import { Badge, Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";
import { Terminal } from "./Terminal";

export const metadata = {
  title: "Christopher — Gruppera",
  description: "arkitektur & senior fullstack",
};

const getConsultant = () => {
  const consultant = consultantListSchema
    .parse(mockData)
    .find((entry) => entry.slug === "christopher");

  if (!consultant) {
    throw new Error('No consultant found for slug "christopher"');
  }

  return consultant;
};

const consultant = getConsultant();

const SKILLS = ["C#", "Docker", "DevOps"];
const PROJECTS = [
  "H&M — planning tools",
  "Qliro — checkout",
  "IKEA — render farm",
];

export default function ChristopherPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* FIXED — identity block, same on every page */}
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Christopher
            </Title>
            <Badge color="sprout" variant="light" size="sm">
              {consultant.focus}
            </Badge>
          </Stack>

          <ConsultantPhoto slug="christopher" />

          {/* ---------- YOURS TO DESIGN ---------- */}
          <Stack gap="md">
            <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
              Det här CV:t utforskas som ett terminalfönster. Skriv{" "}
              <Text component="span" c="sprout.4" fz="inherit">
                help
              </Text>{" "}
              för att komma igång.
            </Text>

            <Terminal />

            <Box
              component="details"
              style={{
                border: "1px solid var(--mantine-color-moss-8)",
                borderRadius: "var(--mantine-radius-md)",
                padding: "var(--mantine-spacing-md)",
              }}
            >
              <Text
                component="summary"
                c="chamonix.0"
                fz={{ base: 14, sm: 16 }}
                style={{ cursor: "pointer" }}
              >
                Visa CV som vanlig text
              </Text>
              <Stack gap="md" mt="md">
                <Stack gap={4}>
                  <Title order={4}>Om mig</Title>
                  <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                    {consultant.about}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Title order={4}>Kompetenser</Title>
                  <Stack gap={2}>
                    {SKILLS.map((skill) => (
                      <Text key={skill} c="dimmed" fz={{ base: 14, sm: 16 }}>
                        · {skill}
                      </Text>
                    ))}
                  </Stack>
                </Stack>
                <Stack gap={4}>
                  <Title order={4}>Utvalda projekt</Title>
                  <Stack gap={2}>
                    {PROJECTS.map((project) => (
                      <Text key={project} c="dimmed" fz={{ base: 14, sm: 16 }}>
                        · {project}
                      </Text>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Stack>
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="christopher" />
        </Stack>
      </Container>
    </Box>
  );
}
