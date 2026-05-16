// AboutScreen — design philosophy and how the app works.

import { Link } from 'react-router-dom';
import './AboutScreen.css';

export default function AboutScreen() {
  return (
    <div className="about">
      <header className="about__header">
        <Link to="/" className="about__back">← Home</Link>
        <h1 className="about__title">About Sketch Coach</h1>
      </header>

      <div className="about__body">

        <section className="about__section about__section--lead">
          <p className="about__lead">
            A quiet, cozy place to practice drawing. No grade at the end.
            No public gallery. No streak to maintain. Just you, a blank canvas,
            and a coach who's genuinely rooting for you.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__heading">Drawing is for everyone — it just got scary somewhere</h2>
          <p>
            Most people draw confidently as kids and then stop. Betty Edwards, in
            {' '}<em>Drawing on the Right Side of the Brain</em>, identifies why:
            perfectionism kicks in, we compare our work to others, and we start
            chasing realistic detail before we've built the underlying skills.
            The result is a lot of adults who say "I can't draw" — when what they
            mean is "I got discouraged and stopped."
          </p>
          <p>
            Sketch Coach is designed around the opposite of that. There are no
            scores, no public posts, no before/after comparisons with strangers.
            The chillhop music is intentional — it sets a tone of low-stakes
            creative play rather than performance. Think sketchbook on a Sunday
            afternoon, not art class exam.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__heading">Tips that show up when you need them</h2>
          <p>
            There are over 20 drawing principles built into the app — things like
            "ghost the line before you commit," "vary your line weight," or "draw
            from the shoulder for long strokes." You won't see all of them at once.
          </p>
          <p>
            Each project has a focus principle, and the coach's feedback during
            that session is guided by it. As you work through projects, you'll
            encounter more principles naturally, and they'll collect in your
            Sketching Tips page — a personal library of concepts you've actually
            practiced, not a wall of theory to read before you start.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__heading">Difficulty you choose, not difficulty imposed</h2>
          <p>
            Projects are grouped into tiers — Beginner, Developing, Intermediate,
            Advanced — and completing a handful from one tier unlocks the next.
            But there's no hard assessment, no pass/fail. The tiers are a
            suggestion about where to start, not a judgment about where you are.
            If Intermediate feels comfortable, a few Beginner projects will get
            you there quickly. If you want to stay in Developing a while longer,
            that's fine too.
          </p>
          <p>
            The goal is always to stretch just slightly beyond what's comfortable —
            not to grade whether you succeeded.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__heading">The coach gives feedback, not scores</h2>
          <p>
            An AI coach (powered by Claude) watches your canvas as you draw and
            checks in periodically with an observation — something it noticed,
            a gentle nudge, or encouragement when something's working well. At the
            end of each project it gives a brief summary of what went well and one
            or two things to try next time.
          </p>
          <p>
            It never gives a number. It never says "good" or "bad." The vocabulary
            is closer to Bob Ross than to a rubric: "that line has a lot of
            confidence," "the gesture here is really alive," "try ghosting this
            stroke a few times before you commit." The feedback is meant to sharpen
            your eye, not evaluate your output.
          </p>
        </section>

        <section className="about__section">
          <h2 className="about__heading">The workflow: pencil first, ink last</h2>
          <p>
            The app has two drawing modes: <strong>pencil</strong> (light, gray,
            fixed-width — for planning and construction) and{' '}
            <strong>ink</strong> (dark, expressive, pressure-responsive — for
            committing to final lines). This maps to how experienced sketchers
            actually work: rough in the shapes lightly, then ink over the ones
            that feel right, then erase the pencil guides.
          </p>
          <p>
            The step instructions are written around this sequence. Early steps say
            "lightly sketch" — that's pencil. Later steps say "switch to ink and
            trace the outline." The moment of switching modes is part of the lesson:
            it forces a decision about which lines are keepers.
          </p>
        </section>

        <section className="about__section about__section--footer">
          <p>
            Sketch Coach is a personal side project. It runs entirely in your
            browser — your drawings and portfolio are stored locally and never
            leave your device. The AI coach calls use your own Anthropic API key,
            billed to your account.
          </p>
          <p className="about__credit">
            Built with{' '}
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">React</a>
            {' '}and the{' '}
            <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer">Claude API</a>.
            Drawing style inspired by the cozy, lo-fi world of chillhop and Animal Crossing.
          </p>
        </section>

      </div>
    </div>
  );
}
