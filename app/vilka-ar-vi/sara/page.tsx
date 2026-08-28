import { Box, Container, Stack, Text, Title } from "@mantine/core";

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
              <span style={{ color: PCB.glow }}>&gt;</span> Viktiga på egen
              hand, starkare tillsammans
            </Title>
            <Text size="sm" maw={560} style={{ color: PCB.silkDim }}>
              Dra komponenter till schemat för att bygga kretsen, eller välj
              en komponent och tryck sedan på en tom plats. Tryck på ett
              hörn på en komponent och sedan ett ledigt hörn i rak linje för
              att förlänga med en wire.
            </Text>
          </Stack>

          <CircuitBuilder />
        </Stack>
      </Container>
    </Box>
  );
}
