"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, ScrollArea, Stack, Text } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const getConsultant = () => {
  const consultant = consultantListSchema
    .parse(mockData)
    .find((entry) => entry.slug === "christopher");

  if (!consultant) {
    throw new Error('No consultant found for slug "christopher"');
  }

  return consultant;
};

const consultant = getConsultant();

const FILES: Record<string, string> = {
  "about.txt": consultant.about,
  "skills.txt": ["C#", "Docker", "DevOps"].join("\n"),
  "projects.txt": [
    "H&M — planning tools",
    "Qliro — checkout",
    "IKEA — render farm",
  ].join("\n"),
};

const HELP_LINES = [
  "Tillgängliga kommandon:",
  "  help            visa den här hjälpen",
  "  ls              lista filer",
  "  cat <fil>       skriv ut en fils innehåll",
  "  whoami          vem är jag",
  "  clear           rensa skärmen",
];

const WELCOME_LINES = [
  `Välkommen till ${consultant.name}s CV-shell.`,
  'Skriv "help" för att komma igång.',
  "",
];

const PROMPT = "christopher@gruppera:~$";

type Line = { type: "input" | "output"; text: string };

const runCommand = (raw: string): string[] | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return [];
  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case "help":
      return HELP_LINES;
    case "ls":
      return Object.keys(FILES);
    case "whoami":
      return [`${consultant.name} — ${consultant.focus}`];
    case "cat": {
      const file = args[0];
      if (!file) return ["cat: saknar filnamn"];
      const content = FILES[file];
      if (!content) return [`cat: ${file}: filen finns inte`];
      return content.split("\n");
    }
    case "clear":
      return null;
    default:
      return [`bash: ${cmd}: command not found`];
  }
};

export const Terminal = () => {
  const [lines, setLines] = useState<Line[]>(
    WELCOME_LINES.map((text) => ({ type: "output", text })),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [lines]);

  const submit = () => {
    const output = runCommand(input);
    setLines((prev) => {
      if (output === null) return [];
      const withInput: Line[] = [...prev, { type: "input", text: input }];
      return [
        ...withInput,
        ...output.map((text) => ({ type: "output" as const, text })),
      ];
    });
    if (input.trim() !== "") {
      setHistory((prev) => [...prev, input]);
    }
    setHistoryIndex(null);
    setInput("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    }
  };

  return (
    <Box
      bg="grafite.7"
      role="group"
      aria-label="Interaktiv terminal med Christophers CV"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-moss-8)",
        overflow: "hidden",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <Box
        px="md"
        py="xs"
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--mantine-color-moss-8)",
        }}
      >
        <Box style={{ width: 12, height: 12, borderRadius: "50%", background: "#E0605A" }} />
        <Box style={{ width: 12, height: 12, borderRadius: "50%", background: "#E8C15C" }} />
        <Box style={{ width: 12, height: 12, borderRadius: "50%", background: "#6FC46A" }} />
      </Box>

      <ScrollArea h={360} viewportRef={viewportRef}>
        <Stack gap={4} px="md" py="sm" style={{ fontFamily: MONO_FONT }}>
          {lines.map((line, index) => (
            <Text
              key={index}
              c={line.type === "input" ? "sprout.4" : "chamonix.0"}
              size="sm"
              style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}
            >
              {line.type === "input" ? `${PROMPT} ${line.text}` : line.text}
            </Text>
          ))}
          <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text c="sprout.4" size="sm" style={{ fontFamily: "inherit" }}>
              {PROMPT}
            </Text>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Terminalkommando"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--mantine-color-chamonix-0)",
                fontFamily: "inherit",
                fontSize: "var(--mantine-font-size-sm)",
              }}
            />
          </Box>
        </Stack>
      </ScrollArea>
    </Box>
  );
};
