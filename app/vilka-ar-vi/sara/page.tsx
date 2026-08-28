import { Box, Container, Stack, Title } from "@mantine/core";

import { CircuitBuilder } from "./CircuitBuilder";

export const metadata = {
  title: "Sara — Gruppera",
  description: "Sara VD på Gruppera",
};

export default function SaraPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Sara bygger en krets
            </Title>
          </Stack>

          <CircuitBuilder />
        </Stack>
      </Container>
    </Box>
  );
}
