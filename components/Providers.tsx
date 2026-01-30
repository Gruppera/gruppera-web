"use client";

import { MantineProvider, type MantineThemeOverride } from "@mantine/core";

type ProvidersProps = {
  children: React.ReactNode;
  theme: MantineThemeOverride;
};

export const Providers = ({ children, theme }: ProvidersProps) => (
  <MantineProvider defaultColorScheme="dark" theme={theme}>
    {children}
  </MantineProvider>
);
