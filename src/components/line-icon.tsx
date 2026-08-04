import { Activity, BookOpen, Brain, Leaf, Sigma } from "lucide-react";

/**
 * Resolves a line's icon name (stored as a string in config/tokens.ts, which
 * stays free of React imports) to a component.
 *
 * This exists because of §10: colour is never the only signal. Every line
 * carries this icon and a text label alongside its colour, which is what makes
 * the map readable without colour discrimination — and what lets the palette
 * accept a weak tritanope separation between Methods and English without that
 * being a real accessibility failure.
 *
 * Static map, not a dynamic lookup, so unused icons tree-shake out.
 */
const ICONS = { Sigma, Leaf, Brain, BookOpen, Activity } as const;

export type LineIconName = keyof typeof ICONS;

export function LineIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name as LineIconName];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden strokeWidth={1.9} />;
}
