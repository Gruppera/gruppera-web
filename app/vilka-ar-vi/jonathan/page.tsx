import { Fragment } from "react";
import {
  Badge,
  Blockquote,
  Box,
  Container,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowDown, IconQuote } from "@tabler/icons-react";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";
import { ModeView } from "./ModeView";

export const metadata = {
  title: "Jonathan — Gruppera",
  description: "Senior backend",
};

const backbone = [
  {
    name: "Mikrotjänster",
    detail: "avgränsade tjänster som kan utvecklas och driftas var för sig",
  },
  {
    name: "Integrationer",
    detail: "sammankoppling av system och tjänster",
  },
  {
    name: "CI/CD",
    detail: "automatiserade bygg- och leveransflöden",
  },
];

const contexts = [
  "Backend-tunga system",
  "Molnbaserade lösningar",
  "Komplexa organisationer",
  "Säkerhet & kvalitet",
  "Scrum Master",
];

const BackboneNode = ({ name, detail }: { name: string; detail: string }) => (
  <Paper withBorder radius="md" p="md">
    <Text fw={600} fz={16}>
      {name}
    </Text>
    <Text c="dimmed" size="sm" mt={4}>
      {detail}
    </Text>
  </Paper>
);

export default function JonathanPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          <ModeView>
            {/* ---------- YOURS TO DESIGN ---------- */}
            <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
              Jonathan är senior utvecklare med bred erfarenhet av backend-tunga
              system och molnbaserade lösningar. Han har arbetat i komplexa
              organisationer med höga krav på säkerhet och kvalitet.
            </Text>

            <Flex
              direction={{ base: "column", sm: "row" }}
              gap="xl"
              align={{ base: "stretch", sm: "flex-start" }}
            >
              <Box maw={260}>
                <ConsultantPhoto slug="jonathan" />
              </Box>

              <Stack gap="sm" style={{ flex: 1 }}>
                <Title order={3} fz={{ base: 22, md: 28 }}>
                  Teknisk ryggrad
                </Title>
                {backbone.map((node, index) => (
                  <Fragment key={node.name}>
                    <BackboneNode name={node.name} detail={node.detail} />
                    {index < backbone.length - 1 ? (
                      <IconArrowDown
                        size={20}
                        color="var(--mantine-color-sprout-4)"
                        style={{ alignSelf: "center" }}
                      />
                    ) : null}
                  </Fragment>
                ))}
              </Stack>
            </Flex>

            <Stack gap="md">
              <Title order={3} fz={{ base: 22, md: 28 }}>
                Sammanhang
              </Title>
              <Group gap="xs">
                {contexts.map((context) => (
                  <Badge key={context} variant="default" size="sm">
                    {context}
                  </Badge>
                ))}
              </Group>
            </Stack>

            <Blockquote color="sprout" icon={<IconQuote size={20} />} mt="sm">
              Tekniskt djup kombinerat med ett strukturerat arbetssätt.
            </Blockquote>
            {/* ------------------------------------- */}
          </ModeView>

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="jonathan" />
        </Stack>
      </Container>
    </Box>
  );
}
