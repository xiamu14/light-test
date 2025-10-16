'use client';

import { HeroUIProvider as BaseHeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function HeroUIProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <BaseHeroUIProvider>
        {children}
      </BaseHeroUIProvider>
    </NextThemesProvider>
  );
}
