"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Тонкий wrapper над next-themes. `attribute="class"` додає клас `dark` або
 * `light` на <html>, узгоджено з custom variant у globals.css.
 *
 * `disableTransitionOnChange` гасить CSS transition саме на момент перемикання,
 * щоб уникнути "флешу" при свопі (особливо коли transition стоїть на background).
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
