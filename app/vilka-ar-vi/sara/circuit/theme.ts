/**
 * A PCB (printed-circuit-board) look for this page specifically — not the
 * site's brand tokens. Sara's page gets real design freedom; this leans
 * into the circuit metaphor literally: board-green surfaces, copper/gold
 * traces and pads, a neon glow for anything actually powered.
 */
export const PCB = {
  bgDeep: "#03110a", // page background — near-black green
  bgBoard: "#0c3524", // schematic board surface
  bgBoardDark: "#082418", // schematic board edge/shadow
  chip: "#102922", // palette card background, like a component body
  chipBorder: "#2f5a45",
  copper: "#c99a4d", // trace / pad accent
  copperBright: "#e8c67a",
  silk: "#eef7f0", // silkscreen-white text
  silkDim: "#8fb3a0",
  glow: "#4dffa0", // energized / powered neon green
  glowSoft: "rgba(77, 255, 160, 0.18)",
  warn: "#ffb454", // hint accent
} as const;
