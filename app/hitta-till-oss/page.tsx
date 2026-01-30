import { Container, Stack, Text, Title } from "@mantine/core";

import { MapboxMap } from "@/features/location/components/MapboxMap";

export default function HittaTillOssPage() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Title order={1} fz={{ base: 36, md: 52 }}>
            Hitta till oss
          </Title>
          <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
            Kammakargatan 29, 111 60 Stockholm
          </Text>
        </Stack>

        <MapboxMap />
      </Stack>
    </Container>
  );
}
