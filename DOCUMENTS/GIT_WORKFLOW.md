# Git and GitHub Workflow

## 1. Objective

Keep the Hotel Management repository clear and recoverable while building quickly for the course deadline. The current repository contains documentation only; do not mistake these docs for a codebase.

## 2. Before modifying files

Run and inspect:

```bash
git status --short --branch
git branch --show-current
git log -5 --oneline
```

Do not discard local changes just because the repository is being reorganized. Save or back up the current documents before replacing them. Never force-push or delete history without explicit owner approval.

## 3. Suggested branch strategy

For one person working quickly, use a small number of descriptive feature branches when meaningful:

- `docs/project-specification`
- `feat/authentication`
- `feat/rooms-bookings`
- `feat/admin-dashboard`
- `fix/demo-readiness`

If direct integration to `main` is needed for the submission, merge only after reviewing the diff and running the relevant tests. If working solo, separate branches are recommended but not mandatory if they add overhead; keep commits focused either way.

If teammates are later added, each contributor works on an assigned branch, opens a pull request, and the project owner reviews/integrates it. Never assume four teammates exist just because a different previous project used a four-person workflow.

## 4. Commit conventions

Prefer concise imperative messages, e.g.:
- `docs: add HotelPro project specification pack`
- `feat: implement signup and login flows`
- `feat: add room management endpoints`
- `feat: implement booking history and cancellation`
- `test: cover booking authorization and date conflicts`
- `docs: add local setup and demo instructions`

Avoid mixing large unrelated changes into one commit.

## 5. Repository hygiene

Keep out of Git:
- `.env` and real credentials;
- `node_modules/`;
- local database dumps or personal data;
- build output unless the deployment requires it;
- temporary logs, screenshots that contain secrets, and IDE state.

Keep in Git:
- source code, lockfiles, tests, `.env.example`, README, specification docs, and allowed reference images.

## 6. Before push/PR

- Review `git diff --check` and `git diff`.
- Inspect `git status`.
- Run the checks relevant to the change.
- Do not claim that tests, push, PR, merge or deployment succeeded without actual tool/terminal confirmation.
- Include test results and known limitations in the commit/PR description.

## 7. Final submission repository

The repository should include the application code plus the documentation needed to run and evaluate it. Avoid leaving only planning files in the final submission repository. The demo video should show the version represented by the submitted commit.
