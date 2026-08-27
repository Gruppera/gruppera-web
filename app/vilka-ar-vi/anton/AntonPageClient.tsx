"use client";

import { useEffect, useRef, useState } from "react";
import mockData from "@/app/mockdata.json";

interface Consultant {
  name: string;
  slug: string;
  about: string;
  focus: string;
  photo: string;
}

const roleAssignments: Record<string, string> = {
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

const crimeFacts: Record<string, string> = {
  daniel: "Master architect—designed the evidence",
  mattias: "Knew the system inside-out",
  christopher: "Had access to the plans",
  gunnar: "Saw everything happen",
  shane: "Spoke to all the victims",
  sara: "First on the scene",
  jonathan: "Helped with the logistics",
  henrik: "Managed the timeline",
  olle: "Knows the motives and methods",
  james: "Connected to the outside world",
};

const roleGroups: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  SUSPECT: { label: "SUSPECTS", color: "#DC2626", bgColor: "#FEE2E2" },
  WITNESS: { label: "WITNESSES", color: "#2563EB", bgColor: "#DBEAFE" },
  ASSOCIATE: { label: "ASSOCIATES", color: "#EA580C", bgColor: "#FFEDD5" },
  PERSON_OF_INTEREST: {
    label: "PERSONS OF INTEREST",
    color: "#65A30D",
    bgColor: "#DCFCE7",
  },
};

interface SVGLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export default function AntonPageClient() {
  const consultants: Consultant[] = mockData;
  const anton = consultants.find((c) => c.slug === "anton");
  const peers = consultants.filter((c) => c.slug !== "anton");

  const peersGrouped: Record<string, Consultant[]> = {};
  peers.forEach((peer) => {
    const role = roleAssignments[peer.slug] || "PERSON_OF_INTEREST";
    if (!peersGrouped[role]) peersGrouped[role] = [];
    peersGrouped[role].push(peer);
  });

  const [svgLines, setSvgLines] = useState<SVGLine[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const calculateLines = () => {
      if (!centerRef.current || !containerRef.current) return;

      const centerRect = centerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const lines: SVGLine[] = [];
      cardRefs.current.forEach((cardElement, slug) => {
        const cardRect = cardElement.getBoundingClientRect();
        const role = roleAssignments[slug] || "PERSON_OF_INTEREST";
        const roleColor = roleGroups[role]?.color || "#65A30D";

        const x1 = centerRect.left - containerRect.left + centerRect.width / 2;
        const y1 = centerRect.top - containerRect.top + centerRect.height / 2;
        const x2 = cardRect.left - containerRect.left + cardRect.width / 2;
        const y2 = cardRect.top - containerRect.top + cardRect.height / 2;

        lines.push({ x1, y1, x2, y2, color: roleColor });
      });

      setSvgLines(lines);
    };

    calculateLines();
    window.addEventListener("resize", calculateLines);
    setTimeout(calculateLines, 200);

    return () => window.removeEventListener("resize", calculateLines);
  }, [peers]);

  const renderSVGConnections = () => {
    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {svgLines.map((line, i) => {
          const dx = line.x2 - line.x1;
          const dy = line.y2 - line.y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const amplitude = 25;
          const frequency = 0.015;

          if (dist < 100) return null;

          const pathPoints: [number, number][] = [];
          const steps = Math.ceil(dist / 10);

          for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            const x = line.x1 + dx * t;
            const y = line.y1 + dy * t;

            const perpX = -dy / dist;
            const perpY = dx / dist;
            const wave = Math.sin(t * Math.PI * frequency * dist) * amplitude;

            pathPoints.push([x + perpX * wave, y + perpY * wave]);
          }

          const pathData = `M ${pathPoints[0][0]} ${pathPoints[0][1]} ${pathPoints.map((p) => `L ${p[0]} ${p[1]}`).join(" ")}`;

          return (
            <path
              key={`line-${i}`}
              d={pathData}
              stroke={line.color}
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          );
        })}
      </svg>
    );
  };

  if (!anton) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: `
          repeating-linear-gradient(
            45deg,
            #8B6F47,
            #8B6F47 2px,
            #9B7F57 2px,
            #9B7F57 4px
          ),
          repeating-linear-gradient(
            -45deg,
            #A47F57,
            #A47F57 1px,
            #8B6F47 1px,
            #8B6F47 2px
          ),
          linear-gradient(135deg, #B8956A 0%, #9B7F57 50%, #8B6F47 100%)
        `,
        padding: "40px 30px",
        fontFamily: "'Comic Sans MS', cursive, sans-serif",
        overflow: "hidden",
      }}
    >
      {renderSVGConnections()}

      {/* Anton's Card - Center */}
      <div
        ref={centerRef}
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "280px",
          margin: "40px auto 80px",
          background: "#FBF8F3",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        {/* Thumbtacks - Anton */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "20px",
            width: "16px",
            height: "16px",
            background: "radial-gradient(circle at 30% 30%, #E8D4B0, #B8860B)",
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(0,0,0,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "20px",
            width: "16px",
            height: "16px",
            background: "radial-gradient(circle at 30% 30%, #E8D4B0, #B8860B)",
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(0,0,0,0.2)",
          }}
        />

        <img
          src={`/photos/${anton.photo}`}
          alt={anton.name}
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "16px",
            border: "3px solid #D4AF37",
          }}
        />
        <h1
          style={{
            fontSize: "40px",
            fontWeight: "bold",
            margin: "12px 0 4px",
            color: "#1F2937",
            textShadow: "1px 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {anton.name}
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontStyle: "italic",
            color: "#6B7280",
            marginBottom: "12px",
          }}
        >
          THE VICTIM
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#374151",
            lineHeight: "1.5",
            marginBottom: "8px",
          }}
        >
          <strong>{anton.focus}</strong>
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#4B5563",
            lineHeight: "1.6",
          }}
        >
          {anton.about}
        </p>
      </div>

      {/* Role Sections */}
      {["SUSPECT", "WITNESS", "ASSOCIATE", "PERSON_OF_INTEREST"].map(
        (role) => (
          <div key={role} style={{ marginBottom: "60px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: roleGroups[role].color,
                textAlign: "center",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {roleGroups[role].label}
            </h2>
            <div
              style={{
                width: "60px",
                height: "2px",
                background: roleGroups[role].color,
                margin: "0 auto 30px",
                opacity: 0.4,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
              }}
            >
              {(peersGrouped[role] || []).map((peer) => (
                <div
                  key={peer.slug}
                  ref={(el) => {
                    if (el) cardRefs.current.set(peer.slug, el);
                  }}
                  data-role={role}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    transform:
                      hoveredSlug === peer.slug
                        ? "scale(1.08) translateY(-4px)"
                        : `rotate(${Math.random() * 4 - 2}deg)`,
                  }}
                  onMouseEnter={() => setHoveredSlug(peer.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  onClick={() =>
                    (window.location.href = `/vilka-ar-vi/${peer.slug}`)
                  }
                >
                  {/* Card Background */}
                  <div
                    style={{
                      background: "#FBF8F3",
                      borderRadius: "6px",
                      padding: "16px",
                      boxShadow:
                        hoveredSlug === peer.slug
                          ? "0 12px 24px rgba(0,0,0,0.2)"
                          : "0 4px 8px rgba(0,0,0,0.1)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    {/* Thumbtacks - Peers */}
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "12px",
                        width: "12px",
                        height: "12px",
                        background: "radial-gradient(circle at 30% 30%, #E8D4B0, #B8860B)",
                        borderRadius: "50%",
                        boxShadow:
                          "0 2px 3px rgba(0,0,0,0.25), inset -1px -1px 1px rgba(0,0,0,0.15)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "12px",
                        width: "12px",
                        height: "12px",
                        background: "radial-gradient(circle at 30% 30%, #E8D4B0, #B8860B)",
                        borderRadius: "50%",
                        boxShadow:
                          "0 2px 3px rgba(0,0,0,0.25), inset -1px -1px 1px rgba(0,0,0,0.15)",
                      }}
                    />

                    {/* Photo */}
                    <img
                      src={`/photos/${peer.photo}`}
                      alt={peer.name}
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "4px",
                        objectFit: "cover",
                        marginBottom: "12px",
                        border: `2px solid ${roleGroups[role].color}`,
                      }}
                    />

                    {/* Name & Focus */}
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        color: "#1F2937",
                        margin: "4px 0 2px",
                        lineHeight: "1.3",
                      }}
                    >
                      {peer.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "11px",
                        color: roleGroups[role].color,
                        fontStyle: "italic",
                        margin: "2px 0 8px",
                        fontWeight: "600",
                      }}
                    >
                      {roleGroups[role].label.slice(0, -1)}
                    </p>

                    {/* Crime Fact */}
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        fontStyle: "italic",
                        lineHeight: "1.4",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      &ldquo;{crimeFacts[peer.slug] || "Connected to the crime"}
                      &rdquo;
                    </p>

                    {/* Focus */}
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#4B5563",
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: `1px solid ${roleGroups[role].bgColor}`,
                        width: "100%",
                      }}
                    >
                      {peer.focus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      <style>{`
        @keyframes flutterCard {
          0% { transform: rotateZ(0deg); }
          50% { transform: rotateZ(0.5deg); }
          100% { transform: rotateZ(-0.5deg); }
        }
      `}</style>
    </div>
  );
}
