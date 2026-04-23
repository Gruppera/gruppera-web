import { Container } from "@mantine/core";

import { FeaturesGrid } from "../components/FeaturesGrid";

export default function Home() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <FeaturesGrid />
    </Container>
  );
}
