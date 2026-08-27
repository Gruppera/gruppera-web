"use client";

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
import { useDisclosure } from "@mantine/hooks";
import { useMemo } from "react";

import { SnakeGameModal } from "../../snake-game/components/SnakeGameModal";
import type { Consultant } from "../types";

type ConsultantGridProps = {
  consultants: Consultant[];
};

// No `id` field exists on Consultant — name is the only stable identity we
// have, so this easter egg is wired to Sara by name comparison. If her name
// in mockdata.json ever changes, this trigger silently stops working.
const SARA_NAME = "Sara";

const ConsultantCard = ({
  consultant,
  onSaraClick,
}: {
  consultant: Consultant;
  onSaraClick?: () => void;
}) => {
  const isSara = consultant.name === SARA_NAME;

  return (
    <Card
      radius="md"
      p={{ base: "lg", md: "xl" }}
      style={{
        backgroundColor: "var(--mantine-color-body)",
        cursor: isSara ? "pointer" : undefined,
      }}
      role={isSara ? "button" : undefined}
      tabIndex={isSara ? 0 : undefined}
      onClick={isSara ? onSaraClick : undefined}
      onKeyDown={
        isSara
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSaraClick?.();
              }
            }
          : undefined
      }
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
};

export const ConsultantGrid = ({ consultants }: ConsultantGridProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const foodConsultants = useMemo(
    () => consultants.filter((c) => c.name !== SARA_NAME),
    [consultants],
  );

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl">
        {consultants.map((consultant) => (
          <ConsultantCard
            key={consultant.photo}
            consultant={consultant}
            onSaraClick={consultant.name === SARA_NAME ? open : undefined}
          />
        ))}
      </SimpleGrid>
      <SnakeGameModal opened={opened} onClose={close} foodConsultants={foodConsultants} />
    </>
  );
};
