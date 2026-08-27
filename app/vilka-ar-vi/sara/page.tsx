import { Box, Container, Stack, Text, Title } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { ConsultantGrid } from "@/features/consultants/components/ConsultantGrid";
import { consultantListSchema } from "@/features/consultants/schemas";

import { SaraEasterEgg } from "./SaraEasterEgg";

export const metadata = {
  title: "Sara — Gruppera",
  description: "VD",
};

export default function SaraPage() {
  const consultants = consultantListSchema.parse(mockData);
  const colleaguePhotos = consultants
    .filter((consultant) => consultant.slug !== "sara")
    .map((consultant) => `/photos/${consultant.photo}`);
  const sara = consultants.find((consultant) => consultant.slug === "sara");
  const saraPhoto = `/photos/${sara?.photo ?? ""}`;
  const sortedConsultants = [...consultants].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );

  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <div id="sara-page-content">
          <Stack gap="lg">
            <Stack gap="sm">
              <Title order={1} fz={{ base: 36, md: 52 }}>
                Våra konsulter
              </Title>
              <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
                Specialister som kombinerar teknik, affärsnytta och
                leveransfokus för att skapa hållbar utveckling.
              </Text>
            </Stack>

            <ConsultantGrid consultants={sortedConsultants} />
          </Stack>
        </div>

        {/*
          Plain, hydration-independent listener. React's own click handler
          (SaraEasterEgg) attaches after hydration; on a slow load the first
          click could land on the anchor's native href before that JS runs,
          which just re-loaded this same page instead of scrambling it. This
          runs the moment the browser parses this tag, so the very first
          click on Sara's card always scrambles. It only sets a style + a
          data attribute — SaraEasterEgg reads that attribute on mount so
          both stay in sync, and doesn't touch anything else on the page.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var content = document.getElementById("sara-page-content");
              if (!content) return;
              content.addEventListener("click", function (event) {
                var link = event.target.closest("a");
                if (!link || link.getAttribute("href") !== "/vilka-ar-vi/sara") return;
                event.preventDefault();
                event.stopPropagation();
                if (content.dataset.scrambled === "true") return;
                content.dataset.scrambled = "true";
                var effects = [
                  "scaleY(-1)",
                  "scaleX(-1)",
                  "rotate(18deg) skew(14deg, 10deg) scale(0.9)"
                ];
                var effect = effects[Math.floor(Math.random() * effects.length)];
                content.style.transform = effect;
                if (effect.indexOf("rotate") === 0) {
                  content.style.filter = "hue-rotate(160deg) saturate(2.2) contrast(1.2)";
                }
              }, true);
            })();`,
          }}
        />

        <SaraEasterEgg colleaguePhotos={colleaguePhotos} saraPhoto={saraPhoto} />
      </Container>
    </Box>
  );
}
