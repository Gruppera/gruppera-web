import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

export type ComponentKind =
  | "battery"
  | "ic"
  | "wire"
  | "capacitor"
  | "switch"
  | "led"
  | "ground"
  | "microcontroller"
  | "display"
  | "testPoint"
  | "relay"
  | "diode"
  | "memory"
  | "fuse";

/** Kinds that light up when they're part of a closed loop. */
export const INDICATOR_KINDS: ComponentKind[] = ["led"];

/**
 * Infrastructure kinds that stay in the palette even with nobody mapped to
 * them — a circuit always needs plain wire, a ground reference, and a power
 * source, regardless of who's on the roster. Every other kind only appears
 * once a real person's role matches it (see `Palette.tsx`).
 */
export const ALWAYS_SHOWN_KINDS: ComponentKind[] = ["battery", "wire", "ground"];

/** Palette grouping/order. */
export const KIND_ORDER: ComponentKind[] = [
  "battery",
  "ic",
  "microcontroller",
  "capacitor",
  "switch",
  "led",
  "ground",
  "wire",
  "display",
  "testPoint",
  "relay",
  "diode",
  "memory",
  "fuse",
];

// Mapped from each person's actual role to the closest real, standard
// circuit component — favoring common, recognizable parts over invented
// ones wherever one fits: architects design the schematic itself (IC — its
// datasheet/pinout is the interface contract everything else is built
// against), fullstack handles inputs/logic/outputs at once (microcontroller,
// likewise a very ordinary part today), backend stores and persists state
// (capacitor — "lagrar och buffrar" is a literal, standard-component match),
// coaching/project leadership gates whether work proceeds (switch — a real
// oscillator doesn't have open/closed states, a switch does), UX is the
// visible, perceived result (LED — the most standard "visible output"
// component there is). Sara — VD — isn't a team role in this taxonomy at
// all: she's the ground reference the rest of the circuit is tied to,
// keeping things stable rather than powering or gating anything. Nobody
// currently holds a DevOps/platform title, so `battery` (the power source a
// circuit can't run without) stays unstaffed until someone does — same
// generic-drag treatment as `wire`.
const SLUG_TO_KIND: Record<string, ComponentKind> = {
  sara: "ground",
  daniel: "ic",
  shane: "ic",
  christopher: "ic",
  gunnar: "microcontroller",
  mattias: "microcontroller",
  anton: "microcontroller",
  jonathan: "capacitor",
  james: "capacitor",
  olle: "switch",
  henrik: "switch",
  sandra: "led",
};

export type ConsultantComponent = {
  slug: string;
  name: string;
  photo: string;
  kind: ComponentKind;
};

const consultants = consultantListSchema.parse(mockData);

export const CONSULTANT_COMPONENTS: ConsultantComponent[] = consultants
  .map((c) => ({
    slug: c.slug,
    name: c.name,
    photo: c.photo,
    kind: SLUG_TO_KIND[c.slug] ?? "wire",
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "sv"));

// English electronics terminology — universal (schematic symbols and
// abbreviations like IC/LED are conventionally English regardless of
// locale), unlike the surrounding Swedish copy.
export const KIND_LABELS: Record<ComponentKind, string> = {
  battery: "Battery",
  ic: "IC",
  wire: "Wire",
  capacitor: "Capacitor",
  switch: "Switch",
  led: "LED",
  ground: "Ground",
  microcontroller: "Microcontroller",
  display: "Display",
  testPoint: "Test point",
  relay: "Relay",
  diode: "Diode",
  memory: "Memory",
  fuse: "Fuse",
};

/** Why each kind maps to the role(s) it does — shown under the heading. */
export const KIND_DESCRIPTIONS: Record<ComponentKind, string> = {
  battery: "Ger kretsen ström. Utan den stannar allt.",
  ic: "Bestämmer hur allt kopplas ihop och fungerar.",
  wire: "Bara det som binder ihop kretsen.",
  capacitor: "Lagrar och buffrar informationen.",
  switch: "Styr och grindar flödet.",
  led: "Det synliga resultatet.",
  ground: "Håller allt stabilt, inget kaos.",
  microcontroller: "Hanterar input, logik och output på samma gång.",
  display: "Gör systemet synligt utåt.",
  testPoint: "Kontrollerar att allt fungerar som tänkt.",
  relay: "Bestämmer vad systemet ska prioritera.",
  diode: "Tar tekniska beslut och styr riktningen.",
  memory: "Lagrar och organiserar information.",
  fuse: "Skyddar systemet och begränsar åtkomst.",
};
