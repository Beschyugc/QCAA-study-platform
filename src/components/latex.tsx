"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

export function Latex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        throwOnError: false,
        displayMode: block,
      });
    } catch {
      return children;
    }
  }, [children, block]);

  // eslint-disable-next-line react/no-danger
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
