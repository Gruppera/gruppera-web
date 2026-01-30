import { Container, Stack, Text, Image, Title, SimpleGrid, Skeleton, Grid, GridCol } from "@mantine/core";
import { FeaturesGrid } from "../../components/FeaturesGrid";

const PRIMARY_COL_HEIGHT = '300px';

export default function OmOssPage() {
  return (
    <Container size="lg" py={{ base: "lg", sm: "xl" }}>
      <Stack gap="sm">
        <Title order={1} fz={{ base: 36, md: 52 }}>
          Om oss
        </Title>
        <FeaturesGrid>
        </FeaturesGrid>
        <Container my="md">
          <Title>Kolla hur kul vi har det!</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* <Skeleton height={PRIMARY_COL_HEIGHT} radius="md" animate={false} /> */}
        <Grid gutter="md">
          <GridCol>
            <Image src={"/photos/kul/20260114_191113.jpg"}></Image>
          </GridCol>
          <GridCol span={6}>
            <Image src={"/photos/kul/20260114_191210.jpg"}></Image>
          </GridCol>
          <GridCol span={6}>
            <Image src={"/photos/kul/20251112_085828.JPG"}></Image>
          </GridCol>
        </Grid>
      </SimpleGrid>
    </Container>
      </Stack>
    </Container>
  );
}
