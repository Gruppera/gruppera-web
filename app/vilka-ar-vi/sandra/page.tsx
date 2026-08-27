import { Box, Container, Stack, Text, Title } from "@mantine/core";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";

export const metadata = {
  title: "Sandra — Gruppera",
  description: "UX & tillgänglighet",
};

export default function SandraPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* ---------- YOURS TO DESIGN ---------- */}
          <ConsultantPhoto slug="sandra" />

          <Stack gap="xs">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Sandra
            </Title>
            <Text c="cognac.6" fw={500} size="sm">
              UX & tillgänglighet
            </Text>
            <Text c="dimmed" fz={{ base: 14, sm: 15 }} maw={700}>
              Sandra är UX Specialist som förenar kreativitet med strategiskt
              tänkande och skapar digitala upplevelser som är intuitiva,
              tillgängliga och genererar mätbar affärsnytta. Hon har ett
              helhetsperspektiv på kundresan och arbetar med allt från
              research och interaktionsdesign till prototyping,
              tillgänglighet och designsystem, och har även lett designarbete
              som Head of Design. Utöver det operativa arbetet är hon en
              engagerad mentor och utbildare, med erfarenhet som huvudlärare
              inom YH-utbildningar i UX och interaktionsdesign.
            </Text>
          </Stack>
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="sandra" />
        </Stack>
      </Container>
    </Box>
  );
}
