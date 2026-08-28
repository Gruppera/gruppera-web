import { CELL } from "./grid";
import type { ComponentKind } from "./componentKinds";
import { PCB } from "./theme";

export const KIND_COLOR: Record<ComponentKind, string> = {
  battery: PCB.copperBright,
  ic: PCB.silk,
  wire: PCB.copper,
  capacitor: "#5fb8a8",
  switch: "#c7d0cb",
  led: PCB.glow,
  ground: PCB.copper,
  microcontroller: PCB.silk,
  display: PCB.silk,
  testPoint: PCB.warn,
  relay: "#c7d0cb",
  diode: "#5fb8a8",
  memory: "#5fb8a8",
  fuse: PCB.warn,
};

const L = CELL;

/** Small shared box-with-glyph symbol for the not-yet-staffed kinds. */
const GenericBox = ({ stroke, glyph }: { stroke: string; glyph: string }) => {
  const w = L * 0.34;
  return (
    <g stroke={stroke} strokeWidth={2} fill="none">
      <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
      <rect x={L / 2 - w / 2} y={-11} width={w} height={22} />
      <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
      <text
        x={L / 2}
        y={4}
        textAnchor="middle"
        fontSize={10}
        stroke="none"
        fill={stroke}
      >
        {glyph}
      </text>
    </g>
  );
};

/**
 * Standard-ish schematic symbols, drawn in local coordinates for a
 * horizontal edge running from (0,0) to (L,0) — the caller rotates/
 * translates the whole <g> into place for vertical edges (on the board) or
 * scales the whole thing down via viewBox (in the palette icons). IEC-ish
 * conventions where they exist (parallel-plate capacitor, knife switch,
 * multi-line battery, diode-triangle LED with perception arrows, ground
 * hatch); chip/IC outlines for the roles that don't have a classic
 * passive-component analog.
 */
export const Symbol = ({ kind, closed }: { kind: ComponentKind; closed?: boolean }) => {
  const stroke = KIND_COLOR[kind];
  const common = { stroke, strokeWidth: 2, fill: "none" } as const;

  switch (kind) {
    case "wire":
      return <line x1={0} y1={0} x2={L} y2={0} {...common} />;
    case "ic": {
      const w = L * 0.36;
      const pin = 6;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
          <rect x={L / 2 - w / 2} y={-12} width={w} height={24} />
          <line x1={L / 2 - w / 2 + pin} y1={-12} x2={L / 2 - w / 2 + pin} y2={-18} />
          <line x1={L / 2 + w / 2 - pin} y1={-12} x2={L / 2 + w / 2 - pin} y2={-18} />
          <line x1={L / 2 - w / 2 + pin} y1={12} x2={L / 2 - w / 2 + pin} y2={18} />
          <line x1={L / 2 + w / 2 - pin} y1={12} x2={L / 2 + w / 2 - pin} y2={18} />
          <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "microcontroller": {
      const w = L * 0.4;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
          <rect x={L / 2 - w / 2} y={-13} width={w} height={26} />
          {[-14, -4, 6].map((dx) => (
            <g key={dx}>
              <line x1={L / 2 + dx} y1={-13} x2={L / 2 + dx} y2={-18} />
              <line x1={L / 2 + dx} y1={13} x2={L / 2 + dx} y2={18} />
            </g>
          ))}
          <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "capacitor": {
      const a = L * 0.46;
      const b = L * 0.54;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <line x1={a} y1={-11} x2={a} y2={11} />
          <line x1={b} y1={-11} x2={b} y2={11} />
          <line x1={b} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "switch": {
      const a = L * 0.35;
      const b = L * 0.65;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <line x1={b} y1={0} x2={L} y2={0} />
          <circle cx={a} cy={0} r={2.5} fill={stroke} />
          <circle cx={b} cy={0} r={2.5} fill={stroke} />
          {closed ? (
            <line x1={a} y1={0} x2={b} y2={0} />
          ) : (
            <line x1={a} y1={0} x2={b - 6} y2={-14} />
          )}
        </g>
      );
    }
    case "battery": {
      const mid = L / 2;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={mid - 8} y2={0} />
          <line x1={mid - 8} y1={-13} x2={mid - 8} y2={13} strokeWidth={2} />
          <line x1={mid - 2} y1={-6} x2={mid - 2} y2={6} strokeWidth={4} />
          <line x1={mid + 4} y1={-13} x2={mid + 4} y2={13} strokeWidth={2} />
          <line x1={mid + 10} y1={-6} x2={mid + 10} y2={6} strokeWidth={4} />
          <line x1={mid + 10} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "led": {
      const a = L * 0.4;
      const b = L * 0.6;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <polygon
            points={`${a},-10 ${a},10 ${b},0`}
            fill={stroke}
            stroke={stroke}
          />
          <line x1={b} y1={-10} x2={b} y2={10} />
          <line x1={b} y1={0} x2={L} y2={0} />
          <g strokeWidth={1.5}>
            <line x1={a + 6} y1={-14} x2={a + 12} y2={-20} />
            <line x1={a + 12} y1={-20} x2={a + 8} y2={-20} />
            <line x1={a + 12} y1={-20} x2={a + 12} y2={-16} />
            <line x1={a + 12} y1={-10} x2={a + 18} y2={-16} />
            <line x1={a + 18} y1={-16} x2={a + 14} y2={-16} />
            <line x1={a + 18} y1={-16} x2={a + 18} y2={-12} />
          </g>
        </g>
      );
    }
    case "ground": {
      const mid = L / 2;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={mid} y2={0} />
          <line x1={mid} y1={0} x2={mid} y2={10} />
          <line x1={mid - 10} y1={10} x2={mid + 10} y2={10} />
          <line x1={mid - 6} y1={14} x2={mid + 6} y2={14} />
          <line x1={mid - 2} y1={18} x2={mid + 2} y2={18} />
          <line x1={mid} y1={0} x2={mid} y2={-1} />
          <line x1={mid} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "display":
      return <GenericBox stroke={stroke} glyph="OUT" />;
    case "testPoint":
      return <GenericBox stroke={stroke} glyph="QA" />;
    case "relay":
      return <GenericBox stroke={stroke} glyph="PO" />;
    case "diode":
      return <GenericBox stroke={stroke} glyph="TL" />;
    case "memory":
      return <GenericBox stroke={stroke} glyph="MEM" />;
    case "fuse":
      return <GenericBox stroke={stroke} glyph="SEC" />;
    default:
      return null;
  }
};
