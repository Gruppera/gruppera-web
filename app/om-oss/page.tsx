import { Container, Stack, Text, Image, Title, SimpleGrid, Skeleton, Grid, GridCol } from "@mantine/core";
import { FeaturesGrid } from "../../components/FeaturesGrid";

const PRIMARY_COL_HEIGHT = '300px';

export default function OmOssPage() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <Stack gap="sm">
        <FeaturesGrid>
        </FeaturesGrid>
      </Stack>
    </Container>
  );
}
