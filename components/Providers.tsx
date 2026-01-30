"use client";

import {
  MantineProvider,
  localStorageColorSchemeManager,
  type MantineThemeOverride,
} from "@mantine/core";

type ProvidersProps = {
  children: React.ReactNode;
  theme: MantineThemeOverride;
};

const colorSchemeManager = localStorageColorSchemeManager({
  key: "gruppera-color-scheme",
});

export const Providers = ({ children, theme }: ProvidersProps) => (
  <MantineProvider
    defaultColorScheme="dark"
    theme={theme}
    colorSchemeManager={colorSchemeManager}
  >
    {children}
  </MantineProvider>
);
