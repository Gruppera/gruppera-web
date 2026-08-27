import { AspectRatio, Card, CardSection, Image } from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "../schemas";

type ConsultantPhotoProps = {
  slug: string;
};

export const ConsultantPhoto = ({ slug }: ConsultantPhotoProps) => {
  const consultants = consultantListSchema.parse(mockData);
  const consultant = consultants.find((entry) => entry.slug === slug);

  if (!consultant) {
    throw new Error(`No consultant found for slug "${slug}"`);
  }

  return (
    <Card
      radius="md"
      p={0}
      style={{ backgroundColor: "var(--mantine-color-body)" }}
      maw={480}
    >
      <CardSection
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
      </CardSection>
    </Card>
  );
};
