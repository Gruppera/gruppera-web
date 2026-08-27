import { Badge, Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { ConsultantGrid } from "@/features/consultants/components/ConsultantGrid";
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";
import { consultantListSchema } from "@/features/consultants/schemas";

import { SaraEasterEgg } from "./SaraEasterEgg";

export const metadata = {
  title: "Sara — Gruppera",
  description: "VD",
};

export default function SaraPage() {
  const consultants = consultantListSchema.parse(mockData);
  const colleaguePhotos = consultants
    .filter((consultant) => consultant.slug !== "sara")
    .map((consultant) => `/photos/${consultant.photo}`);
  const sortedConsultants = [...consultants].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <div id="sara-page-content">
          <Stack gap="lg">
            {/* FIXED — identity block, same on every page */}
            <Stack gap="sm">
              <Title
                order={1}
                fz={{ base: 36, md: 52 }}
                data-easter-trigger="sara"
                style={{ cursor: "pointer" }}
              >
                Sara
              </Title>
              <Badge color="sprout" variant="light" size="sm">
                VD
              </Badge>
            </Stack>

            <Box data-easter-trigger="sara" style={{ cursor: "pointer" }}>
              <ConsultantPhoto slug="sara" />
            </Box>

            {/* ---------- YOURS TO DESIGN ---------- */}
            <Stack gap="md">
              <Title order={3} fz={{ base: 22, md: 28 }}>
                Strategi, tillväxt och kultur
              </Title>
              <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                Sara är VD på Gruppera med ansvar för bolagets strategi, tillväxt
                och kultur. Hon har bakgrund som agil coach och certifierad Scrum
                Master, där hon arbetat med att stärka team, ledarskap och
                leveransförmåga i både svenska och internationella miljöer.
              </Text>
              <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                Idag kombinerar hon sitt coachande ledarskap med
                affärsutveckling och långsiktiga kundrelationer för att driva
                bolaget framåt.
              </Text>
            </Stack>

            <Stack gap="sm">
              <Title order={1} fz={{ base: 36, md: 52 }}>
                Våra konsulter
              </Title>
              <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                Specialister som kombinerar teknik, affärsnytta och
                leveransfokus för att skapa hållbar utveckling.
              </Text>
            </Stack>
            <ConsultantGrid consultants={sortedConsultants} />
            {/* ------------------------------------- */}

            {/* FIXED — every page ends the same way. Renders the link */}
            {/* grid to all other consultants plus the back link.      */}
            <ConsultantPeers currentSlug="sara" />
          </Stack>
        </div>

        <SaraEasterEgg colleaguePhotos={colleaguePhotos} />
      </Container>
    </Box>
  );
}
