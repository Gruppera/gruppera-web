import { Container, Stack, Text, Title } from "@mantine/core";

export default function HittaTillOssPage() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <Stack gap="sm">
        <Title order={1} fz={{ base: 36, md: 52 }}>
          Hitta till oss
        </Title>
        <Text c="cloud.0" fz={{ base: 14, sm: 16 }}>
          Innehåll kommer snart.
        </Text>
      </Stack>
    </Container>
  );
}
