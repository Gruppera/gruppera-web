import '@mantine/core/styles.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Poppins } from 'next/font/google';

import { SiteHeader } from '@/components/SiteHeader';
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
          <SiteHeader />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
