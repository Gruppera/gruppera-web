# Jonathan's consultant page

Branch: `lab/jonathan`, off `main` at `fec38df` (shared scaffolding already merged).

New file: `app/vilka-ar-vi/jonathan/page.tsx` -> `/vilka-ar-vi/jonathan`.
No other files touched. `mockdata.json` already has the `jonathan` entry with
`slug`, `focus: "Senior backend"`, `photo: "jonathan.png"` - not edited.

## Concept

Hybrid: short editorial intro -> one signature visual (a three-node
"teknisk ryggrad" flow) -> a context chip row -> a closing principle callout.
One memorable idea (the flow), executed with restraint, all inside Mantine +
brand tokens, server component only.

## Voice: third person

Third person ("Jonathan ar...", "Han arbetar..."), matching every other bio on
the site and the existing `about` text. For a B2B page aimed at clients deciding
whether to hire, third person reads as the more polished, agency-vetted register
and keeps the eleven pages consistent. First person is defensible (warmer on an
owned page) but we are going third for consistency.

## Content rule

Every line traces back to Jonathan's `mockdata.json` entry. No invented
companies, years, named projects, or specific tech. Jonathan edits in specifics
himself in a later pass.

Source facts (from `about` + `focus`):
senior developer, broad experience - backend-heavy systems - cloud-based
solutions - microservices - integrations - CI/CD - complex organisations -
high demands on security and quality - technical depth - structured way of
working - Scrum Master experience.

## Page structure

Fixed skeleton from `.claude/CLAUDE.md`, unchanged:

- Page shell: `Box > Container size="lg" py={{ base: "lg", sm: "xl" }} > Stack gap="lg"`.
- Identity block: `Title order={1} fz={{ base: 36, md: 52 }}` = "Jonathan";
  `Badge color="sprout" variant="light" size="sm"` = "Senior backend".
- `<ConsultantPhoto slug="jonathan" />`.
- `metadata = { title: "Jonathan - Gruppera", description: "Senior backend" }`.

### Yours-to-design zone

1. **Intro** - `Stack gap="md"`, one `Text fz={{ base: 14, sm: 16 }}` paragraph.
   Rephrases sentence 1 of `about`: senior developer, broad experience of
   backend-heavy systems and cloud-based solutions. 2-3 sentences, no heading
   (sits right under the photo as a lede).

2. **Teknisk ryggrad** - the signature visual. `Title order={3} fz={{ base: 22, md: 28 }}`
   heading, then a three-node flow:

   ```
   Mikrotjanster  ->  Integrationer  ->  CI/CD
   ```

   - Each node: a `Paper` (`bg="grafite.6"`, `radius="md"`, `p="md"`,
     `withBorder`) containing `Text fw={600} fz={16}` (node name) + one
     `Text c="dimmed" size="sm"` line that only re-states mockdata
     (e.g. CI/CD -> "automatiserade leveransfloden").
   - Desktop (`visibleFrom="sm"`): `Group wrap="nowrap" align="stretch"` with
     `IconArrowRight` (`@tabler/icons-react`, `color` via `sprout.4`) between
     nodes.
   - Mobile (`hiddenFrom="sm"`): `Stack` of the same three `Paper` nodes with
     `IconArrowDown` between them.
   - Node content defined once as an array, mapped in both layouts.
   - Sprout appears only on the arrows - signal colour stays a signal.

3. **Sammanhang** - `Title order={3}` heading + `Group gap="xs"` of
   `Badge color="sprout" variant="light" size="sm"` (or `variant="default"` to
   keep sprout for the arrows only - decide during build):
   `Backend-tunga system` - `Molnbaserade losningar` -
   `Komplexa organisationer` - `Sakerhet & kvalitet` - `Scrum Master`.
   These are contexts/attributes, distinct from the three flow nodes, so no
   overlap.

4. **Principle callout** - Mantine `Blockquote` (`color="sprout"`,
   `icon={<IconQuote />}` optional), text:
   "Tekniskt djup kombinerat med ett strukturerat arbetssatt." Closes the
   free zone before the peer list.

- `<ConsultantPeers currentSlug="jonathan" />` last, unmodified.

## Constraints check

- Mantine components only; brand tokens only (`sprout`, `grafite`, `chamonix`,
  `dimmed`); no hex.
- Type scale: 52/36 h1, 28/22 h3, 16 node titles, 16/14 body, per `AGENTS.md`.
- Mantine `Image` is used only inside `ConsultantPhoto` (shared, untouched).
- Server component - no `"use client"`. `visibleFrom`/`hiddenFrom` are static
  responsive props, no JS needed.
- No new dependencies - `@tabler/icons-react` is already installed.

## Verification

```bash
npm run lint
npm run build
```

Both must pass. `out/vilka-ar-vi/jonathan/` must exist after build.
`npm test` does not exist in this repo yet - not run, not claimed.

Manual, in `npm run dev`:

- [ ] `/vilka-ar-vi/jonathan` renders
- [ ] flow reads left-to-right on desktop, top-to-bottom stacked on mobile
- [ ] peer list reaches every other consultant; back link returns to `/vilka-ar-vi`
- [ ] holds up at 360px width
- [ ] no console errors

## PR

`gh pr create` once verified. Body links this plan and pastes real `lint` +
`build` output. Stop at the PR - no merge.
