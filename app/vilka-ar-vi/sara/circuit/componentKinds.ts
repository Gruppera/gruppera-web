import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

export type ComponentKind =
  | "battery"
  | "ic"
  | "wire"
  | "logic"
  | "oscillator"
  | "sensor"
  | "ground"
  | "microcontroller"
  | "display"
  | "testPoint"
  | "controlSignal"
  | "techLead"
  | "memory"
  | "fuse";

/** Kinds that light up when they're part of a closed loop. */
export const INDICATOR_KINDS: ComponentKind[] = ["sensor"];

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
  "logic",
  "oscillator",
  "sensor",
  "ground",
  "wire",
  "display",
  "testPoint",
  "controlSignal",
  "techLead",
  "memory",
  "fuse",
];

// Mapped from each person's actual role to the closest real circuit
// component, not a generic "everyone's a wire" placeholder:
// architects design the schematic itself (IC — its datasheet/pinout is the
// interface contract everything else is built against), fullstack handles
// inputs/logic/outputs at once (microcontroller), backend does the internal
// processing and storage (logic circuit), coaching/project leadership sets
// pace and sequencing (oscillator), UX is the human-facing signal (sensor).
// Sara — VD — isn't a team role in this taxonomy at all: she's the ground
// reference the rest of the circuit is tied to, keeping things stable rather
// than powering or gating anything. Nobody currently holds a DevOps/platform
// title, so `battery` (the power source a circuit can't run without) stays
// unstaffed until someone does — same generic-drag treatment as `wire`.
const SLUG_TO_KIND: Record<string, ComponentKind> = {
  sara: "ground",
  daniel: "ic",
  shane: "ic",
  christopher: "ic",
  gunnar: "microcontroller",
  mattias: "microcontroller",
  anton: "microcontroller",
  jonathan: "logic",
  james: "logic",
  olle: "oscillator",
  henrik: "oscillator",
  sandra: "sensor",
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
// abbreviations like IC are conventionally English regardless of locale),
// unlike the surrounding Swedish copy.
export const KIND_LABELS: Record<ComponentKind, string> = {
  battery: "Battery",
  ic: "IC",
  wire: "Wire",
  logic: "Logic circuit",
  oscillator: "Oscillator",
  sensor: "Sensor",
  ground: "Ground",
  microcontroller: "Microcontroller",
  display: "Display",
  testPoint: "Test point",
  controlSignal: "Control signal",
  techLead: "Control unit",
  memory: "Memory",
  fuse: "Fuse",
};

/** Why each kind maps to the role(s) it does — shown under the heading. */
export const KIND_DESCRIPTIONS: Record<ComponentKind, string> = {
  battery:
    "Strömförsörjning + spänningsregulator — gör att resten av systemet kan köras stabilt. Utan den slutar allt annat fungera.",
  ic: "Bestämmer hur komponenterna ska kopplas ihop, vilka gränssnitt som finns och hur helheten ska fungera.",
  wire: "Den rena kopplingen — ingen egen roll, bara det som binder ihop kretsen.",
  logic: "Utför den interna bearbetningen, lagrar information och hanterar regler och dataflöden.",
  oscillator: "Skapar rytm och synkronisering. Ser till att saker händer i rätt ordning och att delarna arbetar tillsammans.",
  sensor: "Är kontakten mellan människan och systemet: knappar, rattar, display, feedback och hur signaler uppfattas av användaren.",
  ground: "En neutral punkt att koppla kretsen mot — håller allt stabilt, inget kaos.",
  microcontroller: "Kan arbeta med både inputs, intern logik och outputs — alltså flera delar av kretsen samtidigt.",
  display: "Gör systemets interna funktioner synliga och användbara för omvärlden.",
  testPoint: "Kontrollerar att signalerna är rätt, hittar avvikelser och verifierar att kretsen beter sig som avsett.",
  controlSignal: "Avgör vilket beteende systemet ska prioritera och vilka funktioner som ska aktiveras.",
  techLead: "Tar tekniska beslut under drift och koordinerar hur olika tekniska delar ska samverka.",
  memory: "Ansvarar för att information kan lagras, hämtas och organiseras på ett pålitligt sätt.",
  fuse: "Förhindrar att felaktiga eller skadliga signaler förstör systemet och begränsar åtkomst.",
};
