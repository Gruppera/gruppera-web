import { Container, Stack, Text, Title } from "@mantine/core";

export default function KunderPage() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <Stack gap="sm">
        <Title order={1} fz={{ base: 36, md: 52 }}>
          Kunder
        </Title>
      </Stack>
      <></>
    </Container>
  );
}