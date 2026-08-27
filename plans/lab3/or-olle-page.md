# Olle's consultant page

Branch: `lab3/or-olle-page`, stacked on `lab3/or-consultant-scaffolding`
(not yet merged — this branch includes it as a base so the components exist).

New file: `app/vilka-ar-vi/olle/page.tsx` → `/vilka-ar-vi/olle`.

Follows the fixed skeleton from `.claude/CLAUDE.md`:

- Page shell: `Box > Container size="lg" py={{ base: "lg", sm: "xl" }} > Stack gap="lg"`.
- Identity block: `Title order={1} fz={{ base: 36, md: 52 }}` = "Olle",
  `Badge color="sprout" variant="light" size="sm"` = focus from mockdata
  ("Agil coachning & engineering manager").
- `<ConsultantPhoto slug="olle" />`.
- Yours-to-design section: short sections drawing on the `about` text already
  in mockdata (agile coaching, engineering management, team growth) — nothing
  fabricated beyond what's already there.
- `<ConsultantPeers currentSlug="olle" />` last.
- `metadata.title = "Olle — Gruppera"`.
- Mantine components + brand tokens only, server component (no client state).

## Verification

```bash
npm run lint
npm run build
```

Check `out/vilka-ar-vi/olle/` exists after build. Manually check in the running
dev server: page renders, peer list reaches everyone, back link works, holds up
at mobile width, no console errors.

## Note on process

Per the user's explicit "bygg ... nu", skipping the stop-and-wait-for-plan-approval
step here — proceeding straight to implementation. Flagging it per CLAUDE.md's
"skipping is allowed, but say which one and why" rule.
