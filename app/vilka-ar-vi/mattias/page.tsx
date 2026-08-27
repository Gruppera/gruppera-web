import { Badge, Box, Container, Stack, Title } from "@mantine/core";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";
import { StarField } from "./StarField";

export const metadata = {
  title: "Mattias — Gruppera",
  description: "Senior Fullstack",
};

export default function MattiasPage() {
  return (
    <Box style={{ position: "relative" }}>
      {/* ---------- YOURS TO DESIGN ---------- */}
      {/* Absolutely positioned, stretches behind the whole page.  */}
      <StarField />
      {/* ------------------------------------- */}

      <Container
        size="lg"
        py={{ base: "lg", sm: "xl" }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Stack gap="lg">
          {/* FIXED — identity block, same on every page */}
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Mattias
            </Title>
            <Badge color="sprout" variant="light" size="sm">
              Senior Fullstack
            </Badge>
          </Stack>

          <ConsultantPhoto slug="mattias" />

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="mattias" />
        </Stack>
      </Container>
    </Box>
  );
}
