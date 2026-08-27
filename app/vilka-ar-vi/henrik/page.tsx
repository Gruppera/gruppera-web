import { Box, Container, Stack, Text, Title } from "@mantine/core";

import { CorridorGame } from "./CorridorGame";
import { TinderPeers } from "./TinderPeers";

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

          {/* FIXED requirement, met differently here: a swipeable card  */}
          {/* deck instead of ConsultantPeers. Every peer's real <Link>  */}
          {/* stays in the DOM regardless of deck position — see the    */}
          {/* Tinder-cards addendum in plans/lab3/hs-henrik.md.         */}
          <TinderPeers currentSlug="henrik" />
        </Stack>
      </Container>
    </Box>
  );
}
