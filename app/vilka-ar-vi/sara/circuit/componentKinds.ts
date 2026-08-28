import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

export type ComponentKind =
  | "battery"
  | "resistor"
  | "wire"
  | "capacitor"
  | "switch"
  | "led"
  | "ground";

/** Kinds that light up when they're part of a closed loop. */
export const INDICATOR_KINDS: ComponentKind[] = ["led"];

/** Palette grouping/order. */
export const KIND_ORDER: ComponentKind[] = [
  "battery",
  "resistor",
  "wire",
  "capacitor",
  "switch",
  "led",
  "ground",
];

// Sara — VD — is a Battery option, same as everyone else is a role-mapped
// component; she's just not required, and the board can hold more than one
// battery (or none, if you'd rather use the generic one). Everyone else maps
// to a component kind by role: architecture/senior roles stabilize the flow
// (Resistor), fullstack generalists connect front- and back-end (Wire),
// backend specialists persist state (Capacitor), coaching/project-leadership
// roles gate flow (Switch), and UX & accessibility is the visible,
// user-facing output (LED).
const SLUG_TO_KIND: Record<string, ComponentKind> = {
  sara: "battery",
  daniel: "resistor",
  shane: "resistor",
  christopher: "resistor",
  gunnar: "wire",
  mattias: "wire",
  anton: "wire",
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
// abbreviations like LED are conventionally English regardless of locale),
// unlike the surrounding Swedish copy.
export const KIND_LABELS: Record<ComponentKind, string> = {
  battery: "Battery",
  resistor: "Resistor",
  wire: "Wire",
  capacitor: "Capacitor",
  switch: "Switch",
  led: "LED",
  ground: "Ground",
};

/** Why each kind maps to the role(s) it does — shown under the heading. */
export const KIND_DESCRIPTIONS: Record<ComponentKind, string> = {
  battery: "Kretsens strömkälla.",
  resistor: "Stabiliserar flödet.",
  wire: "Arbetar i hela kedjan och får allt att fungera.",
  capacitor: "Lagrar och buffrar.",
  switch: "Styr och grindar flödet.",
  led: "Det synliga resultatet.",
  ground: "En neutral punkt att koppla kretsen mot.",
};
