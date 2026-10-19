# PROMPTS.md — Which Project Prompt to Use

## Prompt file map

| File | When to use it | Destination |
|---|---|---|
| `CHATGPT_PROJECT_INSTRUCTIONS.md` | Persistent context and behavior for the new ChatGPT Project | ChatGPT Project instructions/context |
| `CREATE_PROMPT.md` | Initial end-to-end application implementation | Antigravity agent, after the doc pack is present |
| `INSTALL_PROMPT.md` | Run, configure, debug and verify an existing implementation | Antigravity agent after first implementation or when setup fails |
| `AGENTS.md` | Persistent coding rules for agents | Repository root; also paste its requirements if the agent does not load it automatically |
| `TEAM_WORKFLOW_PROMPT.md` | Shared boundaries and handoffs if multiple contributors/agents are used | Team working context |
| `PROJECT.md` | Compact project identity, features and implementation order | First project brief for a fresh agent conversation |

## Recommended sequence

1. Create the ChatGPT Project and add `CHATGPT_PROJECT_INSTRUCTIONS.md` to its instructions/context.
2. Upload the entire documentation pack (or at minimum the files listed in `README.md`) into the Project's knowledge/files area.
3. Open the local repository in Antigravity. Keep the document pack available at the repo root.
4. Ask Antigravity to read `PROJECT.md`, `AGENTS.md`, `DECISIONS_AND_CONFLICTS.md` and `CREATE_PROMPT.md`, then start the implementation in stages.
5. Use `INSTALL_PROMPT.md` after the app exists to validate setup and fix real blockers.
6. Return actual errors, diffs or test summaries to ChatGPT for review; do not report a feature as finished until it is tested.

## Small task prompt template

```text
Read PROJECT.md, AGENTS.md, the relevant requirement document, and DECISIONS_AND_CONFLICTS.md first.
Inspect the current repository, Git status and existing implementation before editing.
Objective: [one bounded objective].
Expected behavior: [requirements and acceptance criteria].
Scope: [allowed modules/files after inspection].
Do not change: [unrelated areas].
Security: follow SECURITY.md.
Testing: run the applicable checks from TESTING.md, using actual package scripts.
Do not invent paths, commands, API behavior, test results or deployment status.
Report changed files, behavior, tests run/results, tests not run, risks, and next step.
``` 

## Agent safety

- One agent at a time per file.
- Stop before broad rewrites or material decisions not covered by the decision register.
- Keep `.env` and real credentials out of prompts, commits, logs and screenshots.
- Preserve user edits and reference assets.
- Do not merge, force-push or deploy without owner approval.
