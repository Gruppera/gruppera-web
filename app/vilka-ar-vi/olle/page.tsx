import { Box, Container, Stack } from "@mantine/core";

import { AsteroidsGame } from "@/features/consultants/components/AsteroidsGame";
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";

export const metadata = {
  title: "Olle — Gruppera",
  description: "Agil coachning & engineering manager",
};

export default function OllePage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* ---------- YOURS TO DESIGN ---------- */}
          <AsteroidsGame />
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="olle" />
        </Stack>
      </Container>
    </Box>
  );
}
