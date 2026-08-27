import Link from "next/link";
import { Divider, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "../schemas";

type ConsultantPeersProps = {
  currentSlug: string;
};

export const ConsultantPeers = ({ currentSlug }: ConsultantPeersProps) => {
  const consultants = consultantListSchema.parse(mockData);
  const peers = consultants
    .filter((consultant) => consultant.slug !== currentSlug)
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));

  return (
    <Stack gap="lg">
      <Divider />
      <Stack gap="md">
        <Title order={3} fz={{ base: 22, md: 28 }}>
          Fler konsulter
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {peers.map((peer) => (
            <Link
              key={peer.slug}
              href={`/vilka-ar-vi/${peer.slug}`}
              style={{ textDecoration: "none" }}
            >
              <Text c="sprout.6" fw={500} size="sm">
                {peer.name}
              </Text>
            </Link>
          ))}
        </SimpleGrid>
      </Stack>
      <Link href="/vilka-ar-vi" style={{ textDecoration: "none" }}>
        <Text c="dimmed" size="sm">
          ← Tillbaka till Vilka är vi
        </Text>
      </Link>
    </Stack>
  );
};
