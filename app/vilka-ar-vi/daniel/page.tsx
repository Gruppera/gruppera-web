import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

import { MemoryGame, type MemoryPerson } from "./MemoryGame";

const OWN_SLUG = "daniel";

export const metadata = {
  title: "Daniel — Gruppera",
  description: "Ett memory över konsulterna på Gruppera — tio par att hitta.",
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

          {/* No "Fler konsulter" grid and no back link — the cards are the       */}
          {/* navigation, and the site header's "Vilka är vi" is the ungated way  */}
          {/* back to the index for anyone who does not want to play.             */}
          <MemoryGame people={people} ownSlug={OWN_SLUG} />
        </Stack>
      </Container>
    </Box>
  );
}
