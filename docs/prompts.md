# Sketch Coach — Prompt Log

## 2026-05-10

**Prompt 1**
Let's start a new project. This is Sketch Coach, an AI-assisted sketching app that guides and advises you on how to sketch. For this project we want to record every prompt I write in sketchcoach/docs/prompts.md, starting with this one.

**2026-05-10**
I'm pasting in my project proposal.  Format this and save to docs/proposal.md.  Put the future ideas in ideas.md

**2026-05-10**
I'm pasting in my project proposal.  Format this and save to docs/proposal.md.  Put the future ideas in ideas.md

**2026-05-10**
The reactive advice should be something that happens regularly, like after the user has been idle for 3 seconds, and if we haven't fetched advice in the last 15 seconds.

**2026-05-10**
Include the time in the prompt log for each prompt, and make sure it works even when I'm using multiple agents.

**2026-05-10**
Let's put 2,4, and 10 in the proposal and the rest in ideas.

**2026-05-10 10:53**
Review my proposal and ask hard questions, look for possible improvements.

**2026-05-10 10:55**
1. The user data should all live in the user's local browser storage. 

1. Agree, let's shrink this to 10.
2. Remove the streak mechanic.
3. Let's avoid proactive/reactive and just say the coach is occasionally checking your work and giving advice.  
4. I'm ok with this for our test project.

**2026-05-10 10:57**
Before we do a project spec, let's test some of the data assumptions.  Let's generate the 3 data files and make sure this feels realistic.
A projects.json with 10 projects
10 project-name-as-slug.json files with the step by step instructions
A guidelines.json file that has 20+ drawing guidelines.
Put all of these in docs/ for now.

**2026-05-10 11:05**
Yes, this looks good! We can iterate on these in the future, it looks about like I expected though.  Let's start on the project spec now.  Again, look at the travel simulator folder.  We don't need a content pipeline just a React web app with live calls to Claude.  Write the technical spec.  I'll set up Claude API access and get a key while you're doing that.  Remember to look at the travel simulator (https://travelsimulator.web.app/) project for reference.

**2026-05-10 11:15**
Hmm, I didn't expect to have to use the cloud function.  Is this low complexity? Are there other ways to do this?
I'm not opposed, and can imagine future usages of the cloud functions.

Is 512px going to be a high enough resolution? Let's make it 1024 as a default and remind me of this when we do testing.

For 3, yes let's use structured outputs and json to make sure we have clear guidance.

For 5, I've added in a .env file with the ANTHROPIC= key.  If the env var name you have is more standard, please move that key to the right name and location.

For 6, that's a good idea.  Add a TODO.md with a list of production checks including call rate and sonnet vs haiku

Make these changes then let's start implementing!

**2026-05-10**
We copied the data files (guidelines, projects, and project-slug.json) to the web project, let's delete them from docs/

**2026-05-10 11:23**
<task-notification>
<task-id>be5vlc3j4</task-id>
<tool-use-id>toolu_01QLxh2xw52cCgyVCCxKZ5Kp</tool-use-id>
<output-file>/private/tmp/claude-502/-Users-shawn-Documents-GitHub-sketchcoach/ccb5d199-b301-4715-891c-b59007a42a58/tasks/be5vlc3j4.output</output-file>
<status>failed</status>
<summary>Background command "Start Vite dev server" failed with exit code 143</summary>
</task-notification>

**2026-05-10 11:25**
Looks good! Keep going.

**2026-05-10**
I want to brainstorm some ideas about how this can feel more engaging and interactive.  Right now it feels a little bit Clippy "have you thought about".  Let's list out some potential interaction models between user and AI (AI leads, AI guides, AI reacts) and think through at least 5 potential features for each modality.

**2026-05-10**
I likes Leads 1, Guides 2 4 6, and Reacts 2, 3, 4, 5.  Let's add all of these to a new "Engagement" section in ideas.json

**2026-05-10 11:29**
<task-notification>
<task-id>bezbz0zxb</task-id>
<tool-use-id>toolu_014LJ9ZGvjUPLSpANsAuFKNv</tool-use-id>
<output-file>/private/tmp/claude-502/-Users-shawn-Documents-GitHub-sketchcoach/ccb5d199-b301-4715-891c-b59007a42a58/tasks/bezbz0zxb.output</output-file>
<status>failed</status>
<summary>Background command "Start dev server to smoke-test" failed with exit code 143</summary>
</task-notification>

**2026-05-10**
Sorry I meant guides 5

**2026-05-10 11:31**
The drawing functionality works well! Let's keep going.

**2026-05-10**
Let's start working on vibes while the project is being built.  Look through the proposal and research some styles and references.  Write new .md file or .html file that give me 3 style vibes to choose from.

**2026-05-10**
I like vibe 3.  Let's do 5 variations on it with different color palettes.  I like the existing, let's try 2 that are more colorful and then 2 random.

**2026-05-10 11:39**
I need to buy some credits, so I haven't tested this step, but lets assume it works.  Did you add pressure sensitive stroke width yet? That feels high priority.

**2026-05-10 11:42**
Bought credits, feedback is working.

**2026-05-10 11:43**
Fake length width is working, is there a way to use my actual finger pressure on the trackpad?

**2026-05-10**
I like variation 3.  Implement!

**2026-05-10 11:44**
Let's just put a note about it in ideas.json for now.

**2026-05-10 11:44**
OK let's keep implementing our spec, what's left?

**2026-05-10 11:54**
I've bought extra usage and switched to Sonnet, let's keep implementing all of our milestones.

**2026-05-10 11:56**
The feedback on the drawing is kind of dry.  I want the coach to be a little more enthusiastic.  Like Bob Ross, Mr. Rogers, and a little Yo Gabba Gabba energy.
