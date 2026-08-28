import { INDICATOR_KINDS, type ComponentKind } from "./componentKinds";

export type NodeId = string; // `${col},${row}`

export const nodeId = (col: number, row: number): NodeId => `${col},${row}`;

export type PlacedPiece = {
  id: string;
  kind: ComponentKind;
  from: NodeId;
  to: NodeId;
  consultantSlug?: string;
  consultantName?: string;
  consultantPhoto?: string;
  closed?: boolean; // switches only: true = conducting
};

export type CircuitResult = {
  won: boolean;
  energizedIds: Set<string>; // placed piece ids contributing to the win
  hint: string | null;
};

const adjacency = (
  pieces: PlacedPiece[],
  { includeOpenSwitches }: { includeOpenSwitches: boolean },
) => {
  const adj = new Map<NodeId, { to: NodeId; piece: PlacedPiece }[]>();
  const add = (a: NodeId, b: NodeId, piece: PlacedPiece) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)?.push({ to: b, piece });
  };
  pieces.forEach((piece) => {
    if (piece.kind === "battery") return; // never a conductor for the loop
    if (piece.kind === "switch" && !piece.closed && !includeOpenSwitches) {
      return;
    }
    add(piece.from, piece.to, piece);
    add(piece.to, piece.from, piece);
  });
  return adj;
};

const connectedComponent = (
  start: NodeId,
  adj: Map<NodeId, { to: NodeId; piece: PlacedPiece }[]>,
) => {
  const seen = new Set<NodeId>([start]);
  const usedPieces = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop() as NodeId;
    (adj.get(node) ?? []).forEach(({ to, piece }) => {
      usedPieces.add(piece.id);
      if (!seen.has(to)) {
        seen.add(to);
        stack.push(to);
      }
    });
  }
  return { nodes: seen, usedPieces };
};

/**
 * Evaluates the board: is there a closed loop from the battery's two
 * terminals back to itself, through at least one lit LED? Simplification —
 * "energized" means "in the same connected sub-circuit as the closed loop",
 * not strictly on the shortest A-B path. A branch that isn't load-bearing
 * still counts; that's a deliberate generosity, not a bug, so using extra
 * people beyond the minimum is always rewarded, never penalized.
 */
export const evaluateCircuit = (
  pieces: PlacedPiece[],
  batteryFrom: NodeId,
  batteryTo: NodeId,
): CircuitResult => {
  const others = pieces.filter((p) => p.kind !== "battery");

  if (others.length === 0) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Börja dra hit komponenter från biblioteket eller en kollega.",
    };
  }

  const realAdj = adjacency(pieces, { includeOpenSwitches: false });
  const real = connectedComponent(batteryFrom, realAdj);

  if (real.nodes.has(batteryTo)) {
    const hasIndicator = others.some(
      (p) =>
        (INDICATOR_KINDS as ComponentKind[]).includes(p.kind) &&
        real.usedPieces.has(p.id),
    );
    if (hasIndicator) {
      return { won: true, energizedIds: real.usedPieces, hint: null };
    }
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Kretsen är sluten men saknar en lysdiod — lägg till en för att se att den fungerar.",
    };
  }

  // Not closed with real switch states — check if it *would* close with
  // every switch treated as conducting, to tell open-switch from no-loop.
  const loeseAdj = adjacency(pieces, { includeOpenSwitches: true });
  const loose = connectedComponent(batteryFrom, loeseAdj);

  if (loose.nodes.has(batteryTo)) {
    const openSwitches = others.filter(
      (p) =>
        p.kind === "switch" && !p.closed && loose.usedPieces.has(p.id),
    );
    const names = openSwitches
      .map((p) => p.consultantName)
      .filter((name): name is string => Boolean(name));
    const who = names.length > 0 ? names.join(", ") : "en brytare";
    return {
      won: false,
      energizedIds: new Set(),
      hint: `${who} är öppen — klicka på den i kretsen för att stänga den.`,
    };
  }

  return {
    won: false,
    energizedIds: new Set(),
    hint: "Kretsen är inte sluten — dra fler ledningar eller komponenter så den går runt tillbaka till batteriet.",
  };
};
