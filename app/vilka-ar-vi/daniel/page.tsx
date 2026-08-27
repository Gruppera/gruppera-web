import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { consultantListSchema } from "@/features/consultants/schemas";

import { MemoryGame, type MemoryPerson } from "./MemoryGame";

const OWN_SLUG = "daniel";

export const metadata = {
  title: "Daniel — Gruppera",
  description: "Daniels bild av Gruppera: elva personer, tio par att hitta.",
};

export default function DanielPage() {
  const consultants = consultantListSchema.parse(mockData);

  // Only the four fields the board needs — the full `about` text would ship in
  // the HTML for all eleven people and never be rendered.
  const people: MemoryPerson[] = [...consultants]
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
    .map(({ slug, name, focus, photo }) => ({ slug, name, focus, photo }));

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text
              fz={12}
              fw={600}
              c="patch.4"
              tt="uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Daniels bild av Gruppera
            </Text>
            <Title order={2} fz={{ base: 28, md: 36 }}>
              Elva som hänger ihop
            </Title>
            <Text c="dimmed" fz={{ base: 14, sm: 16 }} maw="62ch">
              Jag ritar system för ett levande. Det här är det närmaste jag
              kommer ett systemdiagram över oss: elva personer, inget av dem
              särskilt intressant ensamt. Hitta ihop ansikte och namn och du
              kommer vidare till personen. Mitt eget par ligger redan uppvänt —
              du är ju på min sida.
            </Text>
          </Stack>

          <MemoryGame people={people} ownSlug={OWN_SLUG} />

          <ConsultantPeers currentSlug={OWN_SLUG} />
        </Stack>
      </Container>
    </Box>
  );
}
