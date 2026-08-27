import { Box, Container, Stack, Text, Title } from "@mantine/core";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { CorridorGame } from "./CorridorGame";

export const metadata = {
  title: "Henrik — Gruppera",
  description: "Henriks bild av Gruppera",
};

export default function HenrikPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* ---------- YOURS TO DESIGN ---------- */}
          <Stack gap={4}>
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Gruppera-korridorerna
            </Title>
            <Text c="dimmed">
              Mitt svar på &quot;vilka är vi&quot;: gå runt, möt teamet och
              skjut på den du vill besöka.
            </Text>
          </Stack>
          <CorridorGame />
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="henrik" />
        </Stack>
      </Container>
    </Box>
  );
}
