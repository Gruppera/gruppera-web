"use client";

import {
  Badge,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import type { Consultant } from "../types";

type ConsultantGridProps = {
  consultants: Consultant[];
};

export const ConsultantGrid = ({ consultants }: ConsultantGridProps) => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl">
    {consultants.map((consultant) => (
      <Card
        key={consultant.name}
        radius="md"
        p={{ base: "lg", md: "xl" }}
        style={{ backgroundColor: "var(--mantine-color-body)" }}
      >
        <Card.Section
          bg="sprout.6"
          style={{
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Image
            alt={`${consultant.name} portrait`}
            src={`/photos/${consultant.photo}`}
            h={{ base: 220, sm: 240, md: 260 }}
            fit="cover"
          />
        </Card.Section>
        <Stack gap="xs" mt={{ base: "md", md: "lg" }}>
          <Title order={4}>{consultant.name}</Title>
          <Badge color="sprout" variant="light" size="sm">
            {consultant.focus}
          </Badge>
          <Text c="dimmed" size="sm">
            {consultant.about}
          </Text>
        </Stack>
      </Card>
    ))}
  </SimpleGrid>
);
