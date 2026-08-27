"use client";

import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useEffect, useRef } from "react";

import type { Consultant } from "../../consultants/types";
import { useSnakeGame } from "../hooks/useSnakeGame";
import { SnakeCanvas } from "./SnakeCanvas";

type SnakeGameModalProps = {
  opened: boolean;
  onClose: () => void;
  foodConsultants: Consultant[];
};

export const SnakeGameModal = ({
  opened,
  onClose,
  foodConsultants,
}: SnakeGameModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { status, score, total, start, restart } = useSnakeGame(
    canvasRef,
    foodConsultants,
    opened,
  );

  useEffect(() => {
    if (opened) {
      start();
    }
  }, [opened, start]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="🐍 Saras orm"
      centered
      size="auto"
    >
      <Stack align="center" gap="md">
        <Text size="sm" c="dimmed">
          {score} / {total} uppätna
        </Text>
        <SnakeCanvas canvasRef={canvasRef} />
        {status === "won" && (
          <Group>
            <Text fw={600}>Du åt upp alla! 🎉</Text>
            <Button color="sprout" onClick={restart}>
              Spela igen
            </Button>
          </Group>
        )}
        {status === "lost" && (
          <Group>
            <Text fw={600}>Game over</Text>
            <Button color="sprout" onClick={restart}>
              Spela igen
            </Button>
          </Group>
        )}
        {status === "running" && (
          <Text size="xs" c="dimmed">
            Styr med piltangenterna eller WASD
          </Text>
        )}
      </Stack>
    </Modal>
  );
};
