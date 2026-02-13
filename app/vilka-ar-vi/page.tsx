import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "../mockdata.json";
import { ConsultantGrid } from "@/features/consultants/components/ConsultantGrid";
import { consultantListSchema } from "@/features/consultants/schemas";

export default function VilkaArViPage() {
  const consultants = consultantListSchema.parse(mockData);
  const sortedConsultants = [...consultants].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Våra konsulter
            </Title>
            <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
              Specialister som kombinerar teknik, affärsnytta och leveransfokus
              för att skapa hållbar utveckling.
            </Text>
          </Stack>

          <ConsultantGrid consultants={sortedConsultants} />
        </Stack>
      </Container>
    </Box>
  );
}
