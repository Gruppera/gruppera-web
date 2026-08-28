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

type Component = { nodes: Set<NodeId>; pieces: Set<string> };

/**
 * Batteries are just another conductive edge now (any number of them,
 * anywhere) — a "closed loop" is any connected component that contains a
 * cycle (edges >= nodes, since a tree has exactly nodes-1 edges; more than
 * that means some path doubles back on itself). Open switches simply don't
 * conduct, so they split the graph instead of forming edges.
 */
const buildComponents = (
  pieces: PlacedPiece[],
  { includeOpenSwitches }: { includeOpenSwitches: boolean },
): Component[] => {
  const adj = new Map<NodeId, { to: NodeId; pieceId: string }[]>();
  const add = (a: NodeId, b: NodeId, pieceId: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)?.push({ to: b, pieceId });
  };
  const allNodes = new Set<NodeId>();
  pieces.forEach((piece) => {
    if (piece.kind === "switch" && !piece.closed && !includeOpenSwitches) {
      allNodes.add(piece.from);
      allNodes.add(piece.to);
      return;
    }
    add(piece.from, piece.to, piece.id);
    add(piece.to, piece.from, piece.id);
    allNodes.add(piece.from);
    allNodes.add(piece.to);
  });

  const visited = new Set<NodeId>();
  const components: Component[] = [];
  allNodes.forEach((start) => {
    if (visited.has(start)) return;
    const nodes = new Set<NodeId>([start]);
    const pieceIds = new Set<string>();
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const node = stack.pop() as NodeId;
      (adj.get(node) ?? []).forEach(({ to, pieceId }) => {
        pieceIds.add(pieceId);
        if (!visited.has(to)) {
          visited.add(to);
          nodes.add(to);
          stack.push(to);
        }
      });
    }
    components.push({ nodes, pieces: pieceIds });
  });
  return components;
};

const hasCycle = (component: Component) =>
  component.pieces.size >= component.nodes.size;

const isIndicator = (kind: ComponentKind) =>
  (INDICATOR_KINDS as ComponentKind[]).includes(kind);

export const evaluateCircuit = (pieces: PlacedPiece[]): CircuitResult => {
  if (pieces.length === 0) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Börja dra hit komponenter från biblioteket eller en kollega.",
    };
  }

  const byId = new Map(pieces.map((p) => [p.id, p]));
  const real = buildComponents(pieces, { includeOpenSwitches: false });

  const winner = real.find((component) => {
    if (!hasCycle(component)) return false;
    let battery = false;
    let indicator = false;
    component.pieces.forEach((id) => {
      const piece = byId.get(id);
      if (!piece) return;
      if (piece.kind === "battery") battery = true;
      if (isIndicator(piece.kind)) indicator = true;
    });
    return battery && indicator;
  });

  if (winner) {
    return { won: true, energizedIds: winner.pieces, hint: null };
  }

  // Nothing works with real switch states. Figure out *why*, prioritizing
  // the most specific, most encouraging explanation.
  const loose = buildComponents(pieces, { includeOpenSwitches: true });

  const closedLoops = real.filter(hasCycle);
  const withBatteryAndLoop = closedLoops.find((component) =>
    [...component.pieces].some((id) => byId.get(id)?.kind === "battery"),
  );
  if (withBatteryAndLoop) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Kretsen är sluten och har ett batteri men saknar en lysdiod — lägg till en för att se att den fungerar.",
    };
  }
  if (closedLoops.length > 0) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Kretsen är sluten men saknar ett batteri — lägg till ett för att ge den ström.",
    };
  }

  const looseWinner = loose.find((component) => {
    if (!hasCycle(component)) return false;
    let battery = false;
    let indicator = false;
    component.pieces.forEach((id) => {
      const piece = byId.get(id);
      if (!piece) return;
      if (piece.kind === "battery") battery = true;
      if (isIndicator(piece.kind)) indicator = true;
    });
    return battery && indicator;
  });

  if (looseWinner) {
    const openSwitches = [...looseWinner.pieces]
      .map((id) => byId.get(id))
      .filter(
        (p): p is PlacedPiece => Boolean(p) && p?.kind === "switch" && !p?.closed,
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
    hint: "Kretsen är inte sluten — dra fler komponenter så den går runt i en loop.",
  };
};
