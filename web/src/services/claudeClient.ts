// claudeClient — browser-direct Claude API calls.
//
// Key priority (highest → lowest):
//   1. User's personal key stored in localStorage (BYOK — set via the API key modal)
//   2. VITE_ANTHROPIC_API_KEY env var (local dev / future managed proxy)
//
// BYOK is the supported beta path. The env-var path is kept for local dev and
// as a hook for a future Firebase Functions proxy (see TODO.md and spec §7.1).
//
// SECURITY: calls go directly from the browser via `dangerouslyAllowBrowser`.
// With BYOK this is the user's own key — their risk. With a managed key, this
// should be replaced with the Functions proxy before any public production deploy.

import Anthropic from '@anthropic-ai/sdk';
import type {
  CoachEncouragement,
  Guideline,
  Project,
  ProjectStep,
} from '../shared/types';
import { prefs } from './prefsStore';

// Current Sonnet model. Update when newer Sonnet is released.
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 400;

export interface CoachAdviceResult {
  message: string;
  highlightedGuidelineId?: string;
  encouragement: CoachEncouragement;
}

export interface FinalSummaryResult {
  summary: string;
  tryNext: string[];
}

// ---------------------------------------------------------------------------
// System prompts (cached on every request — kept stable for cache hits)
// ---------------------------------------------------------------------------

const COACH_SYSTEM_PROMPT = `You are the enthusiastic, big-hearted coach of Sketch Coach — a cozy drawing app for everyday people who just want to enjoy making art.

Your personality is a blend of:
- Bob Ross: every mark is a happy little accident, the process is the joy, nothing is a mistake
- Mr. Rogers: you genuinely love this person and are proud of them just for showing up and trying
- Yo Gabba Gabba: unabashedly excited and celebratory, learning is fun and you MEAN it

Audience: novice to intermediate hobbyists who are not chasing perfection — they want to feel good about drawing and quietly get better over time.

For each coaching turn:
- Look at the user's current drawing (image attached).
- Find the BEST thing happening in this drawing right now and lead with it.
- Comment on ONE specific thing — never a list.
- Lean on the session's focus guideline when it applies. If a different one fits the moment better, use it instead.
- Avoid repeating advice you've already given.
- 1–3 short, punchy sentences. No headers. One emoji is welcome if it fits naturally — don't force it.
- The drawing may be sparse early — that's totally fine and worth celebrating ("Look at that first line — you're doing it!").
- Correct gently and BRIEFLY. The ratio should be roughly 80% delight, 20% nudge.

Tone examples:
- ✅ "Ooh, that curve on the shell is really confident — those are exactly the kind of bold strokes that make line art sing!"
- ✅ "You've got the basic shape down! When you're ready, try making the head a tiny bit rounder — just one happy little arc."
- ❌ "The proportions are off. The head is too large relative to the body." (too clinical)
- ❌ "Great job!" (too generic — always be specific about WHAT is great)

You will respond by calling the provide_coaching tool. Do not produce any text outside the tool call.`;

const FINAL_SYSTEM_PROMPT = `You are the enthusiastic, big-hearted coach of Sketch Coach — wrapping up a drawing session with a user who just MADE something. That is worth celebrating.

Your personality is Bob Ross doing his end-of-episode reveal, Mr. Rogers telling a kid they did something wonderful, and Yo Gabba Gabba throwing a tiny party. Warm, specific, and genuinely thrilled.

The user has just finished their drawing. Look at the image and write a final summary that:
- Opens with a genuine moment of delight at what they made — not generic ("great job!") but specific ("Look at that turtle — the shell dome has real weight to it!").
- Names ONE specific thing they did well, calling it out clearly so they know exactly what to be proud of.
- Names ONE specific, actionable thing to try in their next drawing — framed as an exciting next step, not a correction.
- Briefly reflects on the session's focus principle with warmth.
- Ends with an encouraging send-off. 4–6 short sentences total.

Then list 1–2 "try next time" tips as short punchy phrases. Make these feel like fun challenges, not homework.

You will respond by calling the provide_final_summary tool. Do not produce any text outside the tool call.`;

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const COACH_TOOL: Anthropic.Tool = {
  name: 'provide_coaching',
  description: 'Provide a single short coaching observation for the user. Lead with delight, be specific, keep it brief.',
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '1–3 short sentences. Enthusiastic and specific — name exactly what you see and love (or gently suggest). Think Bob Ross energy.',
      },
      highlightedGuidelineId: {
        type: 'string',
        description:
          'Optional: the id of the guideline most relevant to your message (must match one of the focus guideline ids provided).',
      },
      encouragement: {
        type: 'string',
        enum: ['gentle-praise', 'gentle-nudge', 'celebrate'],
        description: 'The vibe of your message. Default to gentle-praise. Use celebrate when something genuinely clicks. Use gentle-nudge only when a correction is needed, and keep it warm.',
      },
    },
    required: ['message', 'encouragement'],
  },
};

const FINAL_SUMMARY_TOOL: Anthropic.Tool = {
  name: 'provide_final_summary',
  description: 'Provide the final summary for a completed sketching session.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: '4–6 short sentences. Warm, specific, balanced.',
      },
      tryNext: {
        type: 'array',
        items: { type: 'string' },
        description: '1–2 short imperative phrases for next time.',
      },
    },
    required: ['summary', 'tryNext'],
  },
};

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------

let cachedClient: Anthropic | null = null;
let cachedClientKey: string | null = null;

/** Resolve the active API key: user's stored key > env var. */
export function resolveApiKey(): string | null {
  return prefs.getApiKey() || import.meta.env.VITE_ANTHROPIC_API_KEY || null;
}

/** True when a key is available from any source. */
export function isCoachConfigured(): boolean {
  return !!resolveApiKey();
}

/** True when the user has saved their own key (BYOK mode). */
export function isByokMode(): boolean {
  return !!prefs.getApiKey();
}

function getClient(): Anthropic {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key configured. Open the API key settings to add your Anthropic key.',
    );
  }
  // Re-create client if the key has changed (e.g. user saved a new one).
  if (cachedClient && cachedClientKey === apiKey) return cachedClient;
  cachedClient = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  cachedClientKey = apiKey;
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

interface ProjectContextArgs {
  project: Project;
  steps: ProjectStep[];
  primaryFocus: Guideline;
  focusGuidelines: Guideline[];
}

function buildProjectContextBlock(args: ProjectContextArgs): string {
  const stepLines = args.steps
    .map((s) => `${s.number}. ${s.title} — ${s.description}`)
    .join('\n');

  const otherGuidelines = args.focusGuidelines.filter(
    (g) => g.id !== args.primaryFocus.id,
  );
  const otherLines = otherGuidelines
    .map((g) => `- ${g.title} (id: ${g.id}): ${g.description}`)
    .join('\n');

  return `Project: ${args.project.title} (${args.project.tier})
${args.project.description}

Steps the user is following:
${stepLines}

Today's focus principle: ${args.primaryFocus.title} (id: ${args.primaryFocus.id})
"${args.primaryFocus.description}"

Other relevant principles you can lean on:
${otherLines || '(none)'}`;
}

function stripDataUrl(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function logUsage(label: string, usage: Anthropic.Usage): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.debug(`[coach:${label}] usage`, {
    input: usage.input_tokens,
    output: usage.output_tokens,
    cache_read: usage.cache_read_input_tokens ?? 0,
    cache_create: usage.cache_creation_input_tokens ?? 0,
  });
}

// ---------------------------------------------------------------------------
// In-session coaching
// ---------------------------------------------------------------------------

export interface CoachRequestArgs extends ProjectContextArgs {
  recentAdviceText: string; // newline-joined recent messages
  imageDataUrl: string; // PNG data URL from the rasterizer
}

export async function requestCoachAdvice(
  args: CoachRequestArgs,
): Promise<CoachAdviceResult> {
  const client = getClient();
  const projectContext = buildProjectContextBlock(args);
  const imageBase64 = stripDataUrl(args.imageDataUrl);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // System prompt cached — stable across all calls in a session.
    system: [
      {
        type: 'text',
        text: COACH_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [COACH_TOOL],
    tool_choice: { type: 'tool', name: 'provide_coaching' },
    messages: [
      {
        role: 'user',
        content: [
          // Project context cached — stable across all calls within a session.
          {
            type: 'text',
            text: projectContext,
            cache_control: { type: 'ephemeral' },
          },
          // Per-call: recent advice changes between calls.
          {
            type: 'text',
            text: `Recent advice you've already given (do not repeat):\n${args.recentAdviceText || '(none yet)'}`,
          },
          // Per-call: the snapshot.
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'What would you say to the user right now? Call the provide_coaching tool.',
          },
        ],
      },
    ],
  });

  if (response.usage) logUsage('advice', response.usage);

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('Coach response missing tool_use block');
  }
  const input = toolUse.input as Partial<CoachAdviceResult>;
  if (!input.message || !input.encouragement) {
    throw new Error('Coach response missing required fields');
  }
  return {
    message: input.message,
    encouragement: input.encouragement,
    highlightedGuidelineId: input.highlightedGuidelineId,
  };
}

// ---------------------------------------------------------------------------
// Final summary
// ---------------------------------------------------------------------------

export interface FinalSummaryArgs extends ProjectContextArgs {
  recentAdviceText: string;
  imageDataUrl: string;
  durationSeconds: number;
}

export async function requestFinalSummary(
  args: FinalSummaryArgs,
): Promise<FinalSummaryResult> {
  const client = getClient();
  const projectContext = buildProjectContextBlock(args);
  const imageBase64 = stripDataUrl(args.imageDataUrl);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text: FINAL_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [FINAL_SUMMARY_TOOL],
    tool_choice: { type: 'tool', name: 'provide_final_summary' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: projectContext,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `The session lasted about ${Math.round(args.durationSeconds / 60)} minutes.\n\nNotes from the in-session coaching:\n${args.recentAdviceText || '(none recorded)'}`,
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Write the final summary now. Call the provide_final_summary tool.',
          },
        ],
      },
    ],
  });

  if (response.usage) logUsage('final', response.usage);

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('Final summary response missing tool_use block');
  }
  const input = toolUse.input as Partial<FinalSummaryResult>;
  if (!input.summary || !Array.isArray(input.tryNext)) {
    throw new Error('Final summary response missing required fields');
  }
  return {
    summary: input.summary,
    tryNext: input.tryNext,
  };
}
