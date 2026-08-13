# CLAUDE.md — workshop workflow

Scaffolding for the *Flip the Bit* workshop. It governs **how** work happens here.
For how the site is built — brand, Mantine, typography, architecture — read `AGENTS.md`.

> The `CLAUDE.md` you write yourself in Lab 1 belongs in the **repo root**. This file
> is not it. Leave this one alone unless the room agrees to change it.

## The loop — every piece of work, every time

1. **Branch first.** Never work on `main`. `git switch -c lab<N>/<initials>-<slug>`.
   If a change is requested while on `main`, create the branch before editing anything.
2. **Plan before code** for anything bigger than a one-line change. Write it to
   `plans/<branch>.md`, then stop and wait for a human to accept it. Do not edit files
   while planning.
3. **Test before implementation** once a test runner exists. A bug fix starts with a
   test that fails for the right reason.
4. **Verify before pushing:** `npm run lint`, `npm test`, `npm run build`. All three.
   Paste the real output. A summary of a result is not a result.
5. **Finish with a PR** via `gh pr create`. The body links the plan and lists what was
   verified. Never open a PR through the web UI.
6. **Stop at the PR.** Do not merge, and do not close it.

Skipping a step is allowed, but say which one and why, in the same message.
Silently skipping is the failure this file exists to prevent.

## Never

- Push to `Gruppera/gruppera-online-vibe`. Your fork only.
- Touch `.github/workflows/deploy-production.yml`.
- Commit `.env*`, keys, or tokens. If a secret appears in the transcript, say so out loud.
- Add a dependency without asking first.
- Claim a command passed without running it.

## Always

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Use the scripts that exist in `package.json`. Other docs in this repo name commands
  that do not exist — check before you trust them.
- `npm test` does not exist until Lab 2 creates it. Until then, say so rather than
  reporting tests as passing.
- `app/mockdata.json` is the source of truth for people. Edit it deliberately, never
  as a side effect.
