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
  flipped?: boolean; // battery/led only: swaps which terminal is +/anode
};

/** Which terminal current leaves from — `from` unless the piece is flipped. */
export const positiveTerminal = (piece: PlacedPiece): NodeId =>
  piece.flipped ? piece.to : piece.from;

export const negativeTerminal = (piece: PlacedPiece): NodeId =>
  piece.flipped ? piece.from : piece.to;

/** Per-piece current direction: current flows from `enter` to `exit`. */
export type FlowDirection = Map<string, { enter: NodeId; exit: NodeId }>;

export type CircuitResult = {
  won: boolean;
  energizedIds: Set<string>; // placed piece ids contributing to the win
  hint: string | null;
  flowDirection: FlowDirection;
};

type Component = { nodes: Set<NodeId>; pieces: Set<string> };

/**
 * Batteries are just another conductive edge now (any number of them,
 * anywhere) — a "closed loop" is any connected component that contains a
 * cycle (edges >= nodes, since a tree has exactly nodes-1 edges; more than
 * that means some path doubles back on itself). Open switches simply
 * don't conduct, so they split the graph instead of forming edges.
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

const hasBatteryAndIndicator = (component: Component, byId: Map<string, PlacedPiece>) => {
  let battery = false;
  let indicator = false;
  component.pieces.forEach((id) => {
    const piece = byId.get(id);
    if (!piece) return;
    if (piece.kind === "battery") battery = true;
    if (isIndicator(piece.kind)) indicator = true;
  });
  return battery && indicator;
};

/**
 * Walks the component outward from the first battery's + terminal, assigning
 * every piece a current direction. Not a rigorous circuit solve (a second
 * battery in the same loop, wired against the first, isn't netted out) — it
 * only needs to give the flow animation and the LED polarity check a single
 * consistent direction to agree on.
 */
const computeFlowDirection = (
  component: Component,
  byId: Map<string, PlacedPiece>,
): FlowDirection => {
  const direction: FlowDirection = new Map();
  const battery = [...component.pieces]
    .map((id) => byId.get(id))
    .find((p): p is PlacedPiece => Boolean(p) && p?.kind === "battery");
  if (!battery) return direction;

  const adj = new Map<NodeId, { to: NodeId; pieceId: string }[]>();
  const add = (a: NodeId, b: NodeId, pieceId: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)?.push({ to: b, pieceId });
  };
  component.pieces.forEach((id) => {
    const piece = byId.get(id);
    if (!piece) return;
    add(piece.from, piece.to, id);
    add(piece.to, piece.from, id);
  });

  const start = positiveTerminal(battery);
  const visited = new Set<NodeId>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop() as NodeId;
    (adj.get(node) ?? []).forEach(({ to, pieceId }) => {
      if (direction.has(pieceId)) return;
      direction.set(pieceId, { enter: node, exit: to });
      if (!visited.has(to)) {
        visited.add(to);
        stack.push(to);
      }
    });
  }
  return direction;
};

const findBackwardsLed = (
  component: Component,
  byId: Map<string, PlacedPiece>,
  direction: FlowDirection,
): PlacedPiece | null => {
  for (const id of component.pieces) {
    const piece = byId.get(id);
    if (!piece || piece.kind !== "led") continue;
    const flow = direction.get(id);
    if (flow && flow.enter !== positiveTerminal(piece)) return piece;
  }
  return null;
};

export const evaluateCircuit = (pieces: PlacedPiece[]): CircuitResult => {
  if (pieces.length === 0) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: null,
      flowDirection: new Map(),
    };
  }

  const byId = new Map(pieces.map((p) => [p.id, p]));
  const real = buildComponents(pieces, { includeOpenSwitches: false });

  const candidates = real.filter((component) => hasCycle(component) && hasBatteryAndIndicator(component, byId));

  let backwardsLed: PlacedPiece | null = null;
  for (const component of candidates) {
    const flowDirection = computeFlowDirection(component, byId);
    const backwards = findBackwardsLed(component, byId, flowDirection);
    if (!backwards) {
      return { won: true, energizedIds: component.pieces, hint: null, flowDirection };
    }
    backwardsLed = backwardsLed ?? backwards;
  }

  if (backwardsLed) {
    const who = backwardsLed.consultantName ?? "Lysdioden";
    return {
      won: false,
      energizedIds: new Set(),
      hint: `${who} sitter åt fel håll — vänd den så strömmen kan passera.`,
      flowDirection: new Map(),
    };
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
      flowDirection: new Map(),
    };
  }
  if (closedLoops.length > 0) {
    return {
      won: false,
      energizedIds: new Set(),
      hint: "Kretsen är sluten men saknar ett batteri — lägg till ett för att ge den ström.",
      flowDirection: new Map(),
    };
  }

  const looseWinner = loose.find((component) => hasCycle(component) && hasBatteryAndIndicator(component, byId));

  if (looseWinner) {
    const openOscillators = [...looseWinner.pieces]
      .map((id) => byId.get(id))
      .filter(
        (p): p is PlacedPiece => Boolean(p) && p?.kind === "switch" && !p?.closed,
      );
    const names = openOscillators
      .map((p) => p.consultantName)
      .filter((name): name is string => Boolean(name));
    const who = names.length > 0 ? names.join(", ") : "en brytare";
    return {
      won: false,
      energizedIds: new Set(),
      hint: `${who} är öppen — klicka på den i kretsen för att stänga den.`,
      flowDirection: new Map(),
    };
  }

  return {
    won: false,
    energizedIds: new Set(),
    hint: "Kretsen är inte sluten — dra fler komponenter så den går runt i en loop.",
    flowDirection: new Map(),
  };
};
