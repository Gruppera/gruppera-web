import { Box, Container, Stack, Text, Title } from "@mantine/core";

import { ConsultantGrid } from "@/features/consultants/components/ConsultantGrid";
import { readConsultants } from "@/features/consultants/api/consultantsStorage";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VilkaArViPage() {
  const consultants = await readConsultants();
  const session = await getAuthSession();
  const isEditable = Boolean(session);
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
            {process.env.NODE_ENV !== "production" ? (
              <Text c="dimmed" fz={{ base: 12, sm: 12 }}>
                Debug: {session ? `Inloggad som ${session.email}` : "Inte inloggad"}
              </Text>
            ) : null}
          </Stack>

          <ConsultantGrid consultants={sortedConsultants} isEditable={isEditable} />
        </Stack>
      </Container>
    </Box>
  );
}
