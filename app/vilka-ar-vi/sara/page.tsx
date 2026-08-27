import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { ConsultantGrid } from "@/features/consultants/components/ConsultantGrid";
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
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

            <ConsultantPeers currentSlug="sara" />
          </Stack>
        </div>

        <SaraEasterEgg colleaguePhotos={colleaguePhotos} />
      </Container>
    </Box>
  );
}
