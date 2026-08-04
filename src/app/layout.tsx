import type { Metadata } from "next";
import { JetBrains_Mono, Public_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Three roles, per the design direction. Display is signage-adjacent and used
// with restraint; body is a civic-design face, which suits the transit-authority
// conceit; data carries every genuine number.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

// Tabular figures are switched on in tokens.css (.tabular) rather than here —
// the whole point is that digits don't jitter while a counter rolls.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "STUDYLINE",
  description: "QCAA study platform — five lines, eleven weeks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `dark` is unconditional: the app has one look — a night transit network.
    // There is no light theme to toggle to, so the class is static rather than
    // driven by a preference nobody set.
    <html
      lang="en-AU"
      className={`dark ${spaceGrotesk.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
