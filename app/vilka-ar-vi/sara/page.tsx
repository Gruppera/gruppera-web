import { Box, Container, Stack, Title } from "@mantine/core";

import { CircuitBuilder } from "./CircuitBuilder";
import { PCB } from "./circuit/theme";

export const metadata = {
  title: "Sara — Gruppera",
  description: "Sara VD på Gruppera",
};

export default function SaraPage() {
  return (
    <Box
      style={{
        background: `radial-gradient(1200px 600px at 15% -10%, ${PCB.bgBoard}55, transparent), ${PCB.bgDeep}`,
      }}
    >
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Title
              order={1}
              fz={{ base: 32, md: 48 }}
              style={{
                color: PCB.silk,
                fontFamily:
                  'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
                letterSpacing: -1,
                textShadow: `0 0 24px ${PCB.glowSoft}`,
              }}
            >
              <span style={{ color: PCB.glow }}>&gt;</span> Gruppera är en
              sluten krets
            </Title>
          </Stack>

          <CircuitBuilder />
        </Stack>
      </Container>
    </Box>
  );
}
