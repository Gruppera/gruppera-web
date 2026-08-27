"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mockData from "@/app/mockdata.json";

interface Consultant {
  name: string;
  slug: string;
  about: string;
  focus: string;
  photo: string;
}

type RoleKey =
  | "SUSPECT"
  | "WITNESS"
  | "ASSOCIATE"
  | "PERSON_OF_INTEREST";

interface NodePosition {
  x: number;
  y: number;
  rotation: number;
  width?: number;
}

interface DecorativeCard {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  note: string;
  color: string;
  position: NodePosition;
}

interface Link {
  from: string;
  to: string;
  color: string;
  width: number;
}

interface RenderLink extends Link {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const roleAssignments: Record<string, RoleKey> = {
  daniel: "SUSPECT",
  mattias: "SUSPECT",
  christopher: "SUSPECT",
  gunnar: "WITNESS",
  shane: "WITNESS",
  sara: "WITNESS",
  jonathan: "ASSOCIATE",
  henrik: "ASSOCIATE",
  olle: "PERSON_OF_INTEREST",
  james: "PERSON_OF_INTEREST",
};

const roleMeta: Record<
  RoleKey,
  { label: string; color: string; bg: string; marker: string }
> = {
  SUSPECT: {
    label: "Misstänkt",
    color: "#D53A32",
    bg: "#FDE4E2",
    marker: "⚠️",
  },
  WITNESS: {
    label: "Vittne",
    color: "#2A5FDB",
    bg: "#E3EBFF",
    marker: "👁️",
  },
  ASSOCIATE: {
    label: "Medhjälpare",
    color: "#DE6A22",
    bg: "#FFEBD9",
    marker: "🤝",
  },
  PERSON_OF_INTEREST: {
    label: "Intressant person",
    color: "#5A9C2E",
    bg: "#E8F7DC",
    marker: "🕵️",
  },
};

const involvementText: Record<string, string> = {
  daniel: "Såg ovanligt lugn ut när servern kraschade. Lite för lugn.",
  mattias: "Har alltid ett svar. Frågan är: svar på vad?",
  christopher: "Kom in med en mystisk USB och ett självsäkert leende.",
  gunnar: "Sade att han såg allt. Minns dock bara de dramatiska delarna.",
  shane: "Pratade med alla i korridoren exakt fem minuter före incidenten.",
  sara: "Först på plats, först med teori, först med kaffe.",
  jonathan: "Hade koll på logistik, whiteboard och alibin i samma tabell.",
  henrik: "Flyttade deadline tre gånger. Kallar det 'strategiskt'.",
  olle: "Råkade känna till detaljer ingen hade berättat ännu.",
  james: "Höll kontakt med 'källan' utanför kontoret hela kvällen.",
};

const personPositions: Record<string, NodePosition> = {
  anton: { x: 50, y: 48, rotation: -1, width: 300 },
  daniel: { x: 12, y: 15, rotation: -8, width: 170 },
  mattias: { x: 27, y: 12, rotation: 5, width: 165 },
  christopher: { x: 40, y: 15, rotation: -4, width: 168 },
  gunnar: { x: 61, y: 12, rotation: 4, width: 165 },
  shane: { x: 76, y: 15, rotation: -7, width: 170 },
  sara: { x: 13, y: 50, rotation: 4, width: 172 },
  jonathan: { x: 77, y: 50, rotation: -5, width: 170 },
  henrik: { x: 24, y: 80, rotation: 6, width: 170 },
  olle: { x: 50, y: 84, rotation: -2, width: 165 },
  james: { x: 74, y: 80, rotation: -6, width: 172 },
};

const decorativeCards: DecorativeCard[] = [
  {
    id: "clue-fingerprint",
    title: "Teknisk rapport",
    subtitle: "Fingeravtryck",
    image: "/murder-board/fingerprint.svg",
    note: "Matchar tangentbord och dörrhandtag.",
    color: "#D53A32",
    position: { x: 6, y: 31, rotation: -6, width: 150 },
  },
  {
    id: "clue-map",
    title: "Möteskarta",
    subtitle: "Rutt 19:42",
    image: "/murder-board/map.svg",
    note: "Samma väg användes av tre personer.",
    color: "#2A5FDB",
    position: { x: 91, y: 31, rotation: 7, width: 150 },
  },
  {
    id: "clue-shoeprint",
    title: "Spårsäkring",
    subtitle: "Skotryck",
    image: "/murder-board/shoeprint.svg",
    note: "Spåren leder till fikarummet.",
    color: "#5A9C2E",
    position: { x: 8, y: 67, rotation: 5, width: 148 },
  },
  {
    id: "clue-weapon",
    title: "Möjligt vapen",
    subtitle: "Nerf-pistol",
    image: "/murder-board/prop-weapon.svg",
    note: "Hittad bakom whiteboarden.",
    color: "#DE6A22",
    position: { x: 92, y: 67, rotation: -7, width: 148 },
  },
  {
    id: "clue-news",
    title: "Internnytt",
    subtitle: "Breaking",
    image: "/murder-board/news-clipping.svg",
    note: "Någon läckte sprintplanen.",
    color: "#B7791F",
    position: { x: 33, y: 92, rotation: -4, width: 170 },
  },
  {
    id: "clue-dossier",
    title: "Casefil #042",
    subtitle: "Förhörslogg",
    image: "/murder-board/dossier.svg",
    note: "Två alibin ändrades efter lunch.",
    color: "#7B3FB2",
    position: { x: 67, y: 92, rotation: 3, width: 170 },
  },
];

const links: Link[] = [
  { from: "anton", to: "daniel", color: "#D53A32", width: 2.4 },
  { from: "anton", to: "mattias", color: "#D53A32", width: 2.2 },
  { from: "anton", to: "christopher", color: "#D53A32", width: 2.2 },
  { from: "anton", to: "gunnar", color: "#2A5FDB", width: 2.2 },
  { from: "anton", to: "shane", color: "#2A5FDB", width: 2.2 },
  { from: "anton", to: "sara", color: "#2A5FDB", width: 2.2 },
  { from: "anton", to: "jonathan", color: "#DE6A22", width: 2.2 },
  { from: "anton", to: "henrik", color: "#DE6A22", width: 2.2 },
  { from: "anton", to: "olle", color: "#5A9C2E", width: 2.2 },
  { from: "anton", to: "james", color: "#5A9C2E", width: 2.2 },
  { from: "daniel", to: "clue-fingerprint", color: "#D53A32", width: 1.8 },
  { from: "shane", to: "clue-map", color: "#2A5FDB", width: 1.8 },
  { from: "james", to: "clue-shoeprint", color: "#5A9C2E", width: 1.8 },
  { from: "henrik", to: "clue-weapon", color: "#DE6A22", width: 1.8 },
  { from: "mattias", to: "clue-news", color: "#B7791F", width: 1.8 },
  { from: "christopher", to: "clue-dossier", color: "#7B3FB2", width: 1.8 },
  { from: "clue-news", to: "clue-dossier", color: "#8C5A2A", width: 1.7 },
];

function buildYarnPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curveStrength = Math.max(20, Math.min(70, distance * 0.18));
  const bendDirection = seed % 2 === 0 ? 1 : -1;
  const midX = (x1 + x2) / 2 + bendDirection * curveStrength;
  const midY = (y1 + y2) / 2 - bendDirection * curveStrength * 0.35;
  return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
}

function resolvePhotoSrc(photo: string): string {
  if (!photo) return "/photos/anton.png";
  if (photo.startsWith("/")) return photo;
  return `/photos/${photo}`;
}

export default function AntonPageClient() {
  const consultants = mockData as Consultant[];
  const anton = consultants.find((c) => c.slug === "anton");
  const peers = consultants.filter((c) => c.slug !== "anton");

  const boardRef = useRef<HTMLElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [renderLinks, setRenderLinks] = useState<RenderLink[]>([]);

  const sortedPeers = useMemo(
    () => [...peers].sort((a, b) => a.name.localeCompare(b.name, "sv")),
    [peers],
  );

  useEffect(() => {
    const updateRenderLinks = () => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();

      const nextLinks: RenderLink[] = [];

      links.forEach((link) => {
        const fromNode = nodeRefs.current.get(link.from);
        const toNode = nodeRefs.current.get(link.to);
        if (!fromNode || !toNode) return;

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();

        nextLinks.push({
          ...link,
          x1: fromRect.left - boardRect.left + fromRect.width / 2,
          y1: fromRect.top - boardRect.top + fromRect.height / 2,
          x2: toRect.left - boardRect.left + toRect.width / 2,
          y2: toRect.top - boardRect.top + toRect.height / 2,
        });
      });

      setRenderLinks(nextLinks);
    };

    const timer = window.setTimeout(updateRenderLinks, 80);
    window.addEventListener("resize", updateRenderLinks);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateRenderLinks);
    };
  }, [sortedPeers]);

  if (!anton) return null;

  return (
    <section
      ref={boardRef}
      style={{
        position: "relative",
        minHeight: "1400px",
        padding: "32px",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 12% 18%, rgba(151, 103, 58, 0.24), transparent 45%),
          radial-gradient(circle at 80% 74%, rgba(133, 92, 53, 0.2), transparent 50%),
          radial-gradient(circle at 42% 58%, rgba(107, 75, 44, 0.16), transparent 55%),
          repeating-linear-gradient(
            90deg,
            #8f6b45 0px,
            #8f6b45 1px,
            #9e7851 1px,
            #9e7851 3px,
            #89653f 3px,
            #89653f 4px
          ),
          linear-gradient(135deg, #6f5030 0%, #8e6a44 45%, #7b5a38 100%)
        `,
        border: "14px solid #7a4631",
        boxShadow:
          "inset 0 0 0 2px rgba(255,255,255,0.12), 0 16px 40px rgba(0,0,0,0.35)",
        fontFamily: "'Comic Sans MS', 'Trebuchet MS', sans-serif",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {renderLinks.map((line, idx) => {
          const path = buildYarnPath(line.x1, line.y1, line.x2, line.y2, idx);
          return (
            <g key={`${line.from}-${line.to}`}>
              <path
                d={path}
                stroke="#5f2b1f"
                strokeOpacity={0.2}
                strokeWidth={line.width + 1.8}
                fill="none"
              />
              <path
                d={path}
                stroke={line.color}
                strokeOpacity={0.72}
                strokeWidth={line.width}
                strokeLinecap="round"
                fill="none"
              />
            </g>
          );
        })}
      </svg>

      {decorativeCards.map((item) => (
        <article
          key={item.id}
          ref={(el) => {
            if (el) nodeRefs.current.set(item.id, el);
          }}
          style={{
            position: "absolute",
            left: `${item.position.x}%`,
            top: `${item.position.y}%`,
            width: `${item.position.width ?? 150}px`,
            transform: `translate(-50%, -50%) rotate(${item.position.rotation}deg)`,
            background: "#f3ead7",
            border: "1px solid rgba(120, 84, 56, 0.5)",
            borderRadius: "6px",
            boxShadow: "0 8px 15px rgba(0,0,0,0.18)",
            padding: "8px 10px 10px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
              fontSize: "11px",
              color: "#5e4331",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            <span>{item.title}</span>
            <span style={{ color: item.color }}>{item.subtitle}</span>
          </div>
          {item.image ? (
            <img
              src={item.image}
              alt={item.subtitle}
              style={{
                width: "100%",
                height: "74px",
                objectFit: "cover",
                border: "1px solid rgba(88, 62, 42, 0.5)",
                borderRadius: "4px",
                marginBottom: "6px",
              }}
            />
          ) : null}
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              lineHeight: 1.35,
              color: "#4f3625",
            }}
          >
            {item.note}
          </p>
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left: "12px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 28% 28%, #f4deb3, #b3862b)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
            }}
          />
        </article>
      ))}

      <article
        ref={(el) => {
          if (el) nodeRefs.current.set("anton", el);
        }}
        style={{
          position: "absolute",
          left: `${personPositions.anton.x}%`,
          top: `${personPositions.anton.y}%`,
          width: `${personPositions.anton.width ?? 300}px`,
          transform: `translate(-50%, -50%) rotate(${personPositions.anton.rotation}deg)`,
          background: "#fcf8f0",
          borderRadius: "8px",
          border: "2px solid #c79a41",
          padding: "22px",
          boxShadow: "0 18px 28px rgba(0,0,0,0.25)",
          zIndex: 9,
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "20px",
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 28% 28%, #f4deb3, #b3862b)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-10px",
            right: "20px",
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 28% 28%, #f4deb3, #b3862b)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        />

        <div
          style={{
            width: "102px",
            height: "102px",
            margin: "0 auto 14px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid #c89e3d",
          }}
        >
          <img
            src={resolvePhotoSrc(anton.photo)}
            alt={anton.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <h1
          style={{
            margin: "2px 0 6px",
            color: "#1e293b",
            fontSize: "54px",
            lineHeight: 1,
          }}
        >
          {anton.name}
        </h1>
        <p
          style={{
            margin: "0 0 10px",
            color: "#8b1f1f",
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            fontSize: "13px",
          }}
        >
          Offret
        </p>
        <p
          style={{
            margin: "0 0 12px",
            color: "#334155",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {anton.focus}
        </p>
        <p
          style={{
            margin: 0,
            color: "#425466",
            lineHeight: 1.5,
            fontSize: "13px",
          }}
        >
          {anton.about}
        </p>
      </article>

      {sortedPeers.map((peer) => {
        const role = roleAssignments[peer.slug] ?? "PERSON_OF_INTEREST";
        const meta = roleMeta[role];
        const position = personPositions[peer.slug];
        const isHovered = hoveredSlug === peer.slug;

        if (!position) return null;

        return (
          <article
            key={peer.slug}
            ref={(el) => {
              if (el) nodeRefs.current.set(peer.slug, el);
            }}
            onClick={() => {
              window.location.href = `/vilka-ar-vi/${peer.slug}`;
            }}
            onMouseEnter={() => setHoveredSlug(peer.slug)}
            onMouseLeave={() => setHoveredSlug(null)}
            style={{
              position: "absolute",
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${position.width ?? 170}px`,
              transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
              background: meta.bg,
              border: `2px solid ${meta.color}`,
              borderRadius: "7px",
              boxShadow: isHovered
                ? "0 16px 24px rgba(0,0,0,0.28)"
                : "0 8px 14px rgba(0,0,0,0.2)",
              padding: "12px",
              zIndex: isHovered ? 11 : 6,
              cursor: "pointer",
              transition: "box-shadow 0.18s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-8px",
                left: "10px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 28% 28%, #f4deb3, #b3862b)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "10px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 28% 28%, #f4deb3, #b3862b)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
              }}
            />

            <div
              style={{
                width: "74px",
                height: "74px",
                margin: "0 auto 8px",
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${meta.color}`,
                background: "#fff",
              }}
            >
              <img
                src={resolvePhotoSrc(peer.photo)}
                alt={peer.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <h2
              style={{
                margin: "0 0 4px",
                textAlign: "center",
                fontSize: "24px",
                lineHeight: 1,
                color: "#1f2a3d",
              }}
            >
              {peer.name}
            </h2>

            <p
              style={{
                margin: "0 0 8px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: meta.color,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              {meta.marker} {meta.label}
            </p>

            <p
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                lineHeight: 1.4,
                color: "#3f3f46",
                minHeight: "48px",
              }}
            >
              {involvementText[peer.slug]}
            </p>

            <p
              style={{
                margin: 0,
                paddingTop: "6px",
                borderTop: `1px dashed ${meta.color}`,
                textAlign: "center",
                fontSize: "11px",
                color: "#475569",
              }}
            >
              {peer.focus}
            </p>
          </article>
        );
      })}
    </section>
  );
}
