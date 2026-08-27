import {
  Badge,
  Box,
  Container,
  List,
  ListItem,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";

export const metadata = {
  title: "Olle — Gruppera",
  description: "Agil coachning & engineering manager",
};

export default function OllePage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* FIXED — identity block, same on every page */}
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Olle
            </Title>
            <Badge color="sprout" variant="light" size="sm">
              Agil coachning &amp; engineering manager
            </Badge>
          </Stack>

          <ConsultantPhoto slug="olle" />

          {/* ---------- YOURS TO DESIGN ---------- */}
          <Stack gap="md">
            <Title order={3} fz={{ base: 22, md: 28 }}>
              Vad jag gör
            </Title>
            <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
              Olle är agil coach och engineering manager med lång erfarenhet av
              att leda utvecklingsteam och stärka samarbeten. Han har arbetat
              som Scrum Master, teamcoach och ledare i både produkt- och
              konsultorganisationer. Olle kombinerar struktur och tydlighet
              med ett coachande förhållningssätt som får team att växa och
              leverera.
            </Text>
          </Stack>

          <Stack gap="md">
            <Title order={3} fz={{ base: 22, md: 28 }}>
              Roller jag trivs i
            </Title>
            <List spacing="xs" c="dimmed" fz={{ base: 14, sm: 16 }}>
              <ListItem>Scrum Master</ListItem>
              <ListItem>Teamcoach</ListItem>
              <ListItem>Engineering manager / ledare</ListItem>
            </List>
          </Stack>
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="olle" />
        </Stack>
      </Container>
    </Box>
  );
}
