import '@mantine/core/styles.css';

import { Box, ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Poppins } from 'next/font/google';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { grupperaTheme } from '@/styles/theme';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'My Mantine app',
  description: 'I have followed setup instructions carefully',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={poppins.className}>
        <MantineProvider defaultColorScheme="dark" theme={grupperaTheme}>
          <Box
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'var(--site-footer-height, 200px)',
            }}
          >
            <SiteHeader />
            <Box component="main" style={{ flex: 1 }}>
              {children}
            </Box>
            <SiteFooter />
          </Box>
        </MantineProvider>
      </body>
    </html>
  );
}
