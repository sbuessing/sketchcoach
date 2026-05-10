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
