import { Box, Container, Paper, Stack, Text, Title } from "@mantine/core";

import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <Box>
      <Container size="sm" py={{ base: "lg", sm: "xl" }}>
        <Paper
          radius="lg"
          p={{ base: "lg", sm: "xl" }}
          bg="var(--mantine-color-grafite-6)"
          withBorder
        >
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={1} fz={{ base: 36, md: 52 }}>
                Logga in
              </Title>
              <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                Inloggning för Gruppera-teamet.
              </Text>
            </Stack>

            <LoginForm />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
