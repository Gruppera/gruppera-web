"use client";

import Link from "next/link";
import {
  AspectRatio,
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

const ConsultantCard = ({ consultant }: { consultant: Consultant }) => (
  <Card
    component={Link}
    href={`/vilka-ar-vi/${consultant.slug}`}
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
      <AspectRatio ratio={320 / 260}>
        <Image
          alt={`${consultant.name} portrait`}
          src={`/photos/${consultant.photo}`}
          fit="cover"
        />
      </AspectRatio>
    </Card.Section>
    <Stack gap="xs" mt={{ base: "md", md: "lg" }}>
      <Title order={4}>{consultant.name}</Title>
      <Group gap="xs">
        <Badge color="sprout" variant="light" size="sm">
          {consultant.focus}
        </Badge>
      </Group>
      <Text c="dimmed" size="sm" style={{ whiteSpace: "pre-line" }}>
        {consultant.about}
      </Text>
    </Stack>
  </Card>
);

export const ConsultantGrid = ({ consultants }: ConsultantGridProps) => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl">
    {consultants.map((consultant) => (
      <ConsultantCard key={consultant.slug} consultant={consultant} />
    ))}
  </SimpleGrid>
);
