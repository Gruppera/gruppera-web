import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

export type ComponentKind =
  | "battery"
  | "resistor"
  | "wire"
  | "capacitor"
  | "switch"
  | "led";

// Sara is the page's fixed Battery — the company's power source, not a
// draggable/unlockable piece. Everyone else maps to a component kind by role:
// architecture/senior roles stabilize the flow (Resistor), fullstack
// generalists connect front- and back-end (Wire), backend specialists persist
// state (Capacitor), coaching/project-leadership roles gate flow (Switch),
// and UX & accessibility is the visible, user-facing output (LED).
const SLUG_TO_KIND: Record<string, ComponentKind> = {
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

export const SARA = consultants.find((c) => c.slug === "sara");

export const CONSULTANT_COMPONENTS: ConsultantComponent[] = consultants
  .filter((c) => c.slug !== "sara")
  .map((c) => ({
    slug: c.slug,
    name: c.name,
    photo: c.photo,
    kind: SLUG_TO_KIND[c.slug] ?? "wire",
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "sv"));

export const KIND_LABELS: Record<ComponentKind, string> = {
  battery: "Batteri",
  resistor: "Resistor",
  wire: "Ledning",
  capacitor: "Kondensator",
  switch: "Brytare",
  led: "Lysdiod",
};
