"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Stack, Text, TextInput } from "@mantine/core";

const requestOtp = async (email: string) => {
  const response = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Kunde inte skicka kod");
  }
};

const verifyOtp = async (email: string, code: string) => {
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), code: code.trim() }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Kunde inte verifiera kod");
  }
};

type Step = "request" | "verify";

export const LoginForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await requestOtp(email);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await verifyOtp(email, code);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Text c="dimmed" fz={{ base: 14, sm: 15 }}>
        Ange din e-postadress på gruppera.se så skickar vi en engångskod.
      </Text>

      {step === "request" ? (
        <Stack gap="sm">
          <TextInput
            label="E-postadress"
            placeholder="namn@gruppera.se"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            type="email"
            required
          />
          {error ? (
            <Text c="red" fz={{ base: 12, sm: 14 }}>
              {error}
            </Text>
          ) : null}
          <Button onClick={handleRequest} loading={isLoading} disabled={!email}>
            Skicka engångskod
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          <TextInput
            label="Engångskod"
            placeholder="6 siffror"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            inputMode="numeric"
            maxLength={6}
            required
          />
          {error ? (
            <Text c="red" fz={{ base: 12, sm: 14 }}>
              {error}
            </Text>
          ) : (
            <Text c="dimmed" fz={{ base: 12, sm: 14 }}>
              Koden gäller i 10 minuter.
            </Text>
          )}
          <Group gap="sm" justify="space-between">
            <Button variant="subtle" onClick={() => setStep("request")}>
              Byt e-post
            </Button>
            <Button onClick={handleVerify} loading={isLoading} disabled={!code}>
              Logga in
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
};
