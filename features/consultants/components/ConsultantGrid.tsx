"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  AspectRatio,
  Badge,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { IconCheck, IconPencil } from "@tabler/icons-react";

import type { Consultant } from "../types";

type ConsultantGridProps = {
  consultants: Consultant[];
  isEditable?: boolean;
};

type EditableField = "name" | "focus" | "about";
type ConsultantUpdates = Partial<Pick<Consultant, EditableField>>;

type ConsultantCardProps = {
  consultant: Consultant;
  isEditable: boolean;
  onUpdate: (photo: string, updates: ConsultantUpdates) => Promise<void>;
};

const ConsultantCard = ({ consultant, isEditable, onUpdate }: ConsultantCardProps) => {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState({
    name: consultant.name,
    focus: consultant.focus,
    about: consultant.about,
  });
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<EditableField | null>(null);

  useEffect(() => {
    setDraft({
      name: consultant.name,
      focus: consultant.focus,
      about: consultant.about,
    });
  }, [consultant]);

  const startEdit = (field: EditableField) => {
    setError(null);
    setEditingField(field);
    setDraft({
      name: consultant.name,
      focus: consultant.focus,
      about: consultant.about,
    });
  };

  const saveEdit = async (field: EditableField) => {
    setError(null);
    setSavingField(field);
    try {
      await onUpdate(consultant.photo, { [field]: draft[field] });
      setEditingField(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setSavingField(null);
    }
  };

  const renderEditIcon = (field: EditableField) => {
    if (!isEditable) return null;
    const isEditing = editingField === field;
    const isLoading = savingField === field;

    return (
      <ActionIcon
        variant="subtle"
        color="sprout"
        aria-label={isEditing ? "Spara ändring" : "Redigera"}
        onClick={() => (isEditing ? saveEdit(field) : startEdit(field))}
        loading={isLoading}
      >
        {isEditing ? <IconCheck size={16} /> : <IconPencil size={16} />}
      </ActionIcon>
    );
  };

  return (
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
        <AspectRatio ratio={320 / 260}>
          <Image
            alt={`${consultant.name} portrait`}
            src={`/photos/${consultant.photo}`}
            fit="cover"
          />
        </AspectRatio>
      </Card.Section>
      <Stack gap="xs" mt={{ base: "md", md: "lg" }}>
        <Group gap="xs" align="center" justify="space-between" wrap="nowrap">
          {editingField === "name" ? (
            <TextInput
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  name: event.currentTarget?.value ?? "",
                }))
              }
              style={{ flex: 1 }}
              size="sm"
            />
          ) : (
            <Title order={4} style={{ flex: 1 }}>
              {consultant.name}
            </Title>
          )}
          {renderEditIcon("name")}
        </Group>

        <Group gap="xs" align="center" justify="space-between" wrap="nowrap">
          {editingField === "focus" ? (
            <TextInput
              value={draft.focus}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  focus: event.currentTarget?.value ?? "",
                }))
              }
              style={{ flex: 1 }}
              size="sm"
            />
          ) : (
            <Badge color="sprout" variant="light" size="sm">
              {consultant.focus}
            </Badge>
          )}
          {renderEditIcon("focus")}
        </Group>

        <Group gap="xs" align="flex-start" justify="space-between" wrap="nowrap">
          {editingField === "about" ? (
            <Textarea
              value={draft.about}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  about: event.currentTarget?.value ?? "",
                }))
              }
              autosize
              minRows={3}
              maxRows={6}
              style={{ flex: 1 }}
              size="sm"
            />
          ) : (
            <Text c="dimmed" size="sm" style={{ flex: 1 }}>
              {consultant.about}
            </Text>
          )}
          {renderEditIcon("about")}
        </Group>

        {error ? (
          <Text c="red" size="xs">
            {error}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};

export const ConsultantGrid = ({ consultants, isEditable = false }: ConsultantGridProps) => {
  const [items, setItems] = useState(consultants);

  useEffect(() => {
    setItems(consultants);
  }, [consultants]);

  const handleUpdate = async (photo: string, updates: ConsultantUpdates) => {
    const response = await fetch("/api/consultants/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo, ...updates }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      consultant?: Consultant;
    };

    if (!response.ok || !data.consultant) {
      throw new Error(data.error ?? "Kunde inte spara ändringen.");
    }

    setItems((prev) =>
      prev.map((item) => (item.photo === photo ? data.consultant ?? item : item)),
    );
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl">
      {items.map((consultant) => (
        <ConsultantCard
          key={consultant.photo}
          consultant={consultant}
          isEditable={isEditable}
          onUpdate={handleUpdate}
        />
      ))}
    </SimpleGrid>
  );
};
