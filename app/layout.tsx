import '@mantine/core/styles.css';
import './globals.css';

import { Box, ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { Poppins } from 'next/font/google';

import { Providers } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ScrollbarCompensation } from '@/components/ScrollbarCompensation';
import { getAuthSession } from '@/lib/auth';
import { grupperaTheme } from '@/styles/theme';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'Gruppera',
  description: 'Världens bästa IT-konsulter samlade på ett och samma ställe.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  const buildId = session ? process.env.APP_BUILD_ID ?? null : null;

  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={poppins.className}>
        <Providers theme={grupperaTheme}>
          <ScrollbarCompensation />
          <Box
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'var(--site-footer-height, 200px)',
              boxSizing: 'border-box',
            }}
          >
            <SiteHeader />
            <Box component="main" style={{ flex: 1, paddingTop: '88px' }}>
              {children}
            </Box>
            <Box id="footer-sentinel" aria-hidden="true" style={{ height: 1 }} />
            <SiteFooter buildId={buildId} />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
