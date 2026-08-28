import Link from "next/link";
import { Box, Container, Divider, Flex, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

import { DoodlePortrait } from "./DoodlePortrait";

export const metadata = {
  title: "Sandra — Gruppera",
  description: "UX & tillgänglighet",
};

export default function SandraPage() {
  const consultants = consultantListSchema.parse(mockData);
  const sandra = consultants.find((consultant) => consultant.slug === "sandra");

  if (!sandra) {
    throw new Error('No consultant found for slug "sandra"');
  }

  const peers = consultants
    .filter((consultant) => consultant.slug !== "sandra")
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg" align="center">
          {/* ---------- YOURS TO DESIGN ---------- */}
          <Flex
            direction={{ base: "column", sm: "row" }}
            gap={{ base: "lg", sm: 56 }}
            w={{ base: "100%", sm: "auto" }}
          >
            <DoodlePortrait
              src={`/photos/${sandra.photo}`}
              alt={`${sandra.name} portrait`}
              doodle="random"
            />

            <Stack gap="xs" maw={{ sm: 471 }}>
              <Title order={1} fz={{ base: 28, sm: 36 }}>
                {sandra.name}
              </Title>
              <Text c="sprout.4" fw={500} size="sm">
                {sandra.focus}
              </Text>
              <Text
                c="dimmed"
                fz={{ base: 14, sm: 15 }}
                style={{ whiteSpace: "pre-line" }}
              >
                {sandra.about}
              </Text>
            </Stack>
          </Flex>
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way: every colleague reachable  */}
          {/* plus the back link. Custom layout (centered on desktop, left on */}
          {/* mobile) instead of <ConsultantPeers /> to match this page's      */}
          {/* design without touching the shared component.                   */}
          <Flex direction="column" gap="lg" align={{ base: "flex-start", sm: "center" }} w="100%">
            <Divider w="100%" />
            <Flex direction="column" gap="md" align={{ base: "flex-start", sm: "center" }} w="100%">
              <Title order={3} fz={{ base: 22, md: 28 }}>
                Fler konsulter
              </Title>
              <Flex justify={{ sm: "center" }} wrap="wrap" gap="md" rowGap={4} w="100%">
                {peers.map((peer) => (
                  <Link
                    key={peer.slug}
                    href={`/vilka-ar-vi/${peer.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Text component="span" c="sprout.4" fw={500} size="sm">
                      {peer.name}
                    </Text>
                  </Link>
                ))}
              </Flex>
            </Flex>
            <Link href="/vilka-ar-vi" style={{ textDecoration: "none" }}>
              <Text component="span" c="dimmed" size="sm">
                ← Tillbaka till Vilka är vi
              </Text>
            </Link>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}
