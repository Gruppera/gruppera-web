// Brand accent colors (styles/theme.ts), excluding grafite (canvas
// background) and chamonix (already used for score/text). Used to give each
// portrait a distinct border so the games read as "on brand" rather than
// plain squares/circles.
export const BORDER_COLORS = ["#95B354", "#C3CED9", "#824529", "#E0CCBE", "#757263"];

export const colorForIndex = (index: number) =>
  BORDER_COLORS[((index % BORDER_COLORS.length) + BORDER_COLORS.length) % BORDER_COLORS.length];
