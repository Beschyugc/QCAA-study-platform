import type { ReactNode } from "react";

/**
 * Layout primitives for the dashboard. Deliberately plain: the design language
 * lives in tokens.css, and the only element allowed to be loud is the network
 * map. Everything here stays quiet so that lands.
 */

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-7">{children}</div>;
}

export function Zone({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      {eyebrow && (
        <p className="signage mb-3 text-[color:var(--text-faint)] text-xs font-semibold">
          {eyebrow}
        </p>
      )}
      {children}
    </section>
  );
}

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-5 shadow-[0_1px_2px_rgb(0_0_0/0.4)] ${className}`}
    >
      {title && (
        <h2 className="signage mb-3.5 flex items-center gap-2 font-display text-xs font-bold text-[color:var(--text-muted)]">
          {title}
          {right && (
            <span className="ml-auto font-body text-xs font-normal normal-case tracking-normal text-[color:var(--text-faint)]">
              {right}
            </span>
          )}
        </h2>
      )}
      {children}
    </div>
  );
}

/**
 * Empty states are invitations, not apologies (§4.1) — and they never scold.
 * `action` is the next concrete thing to do, which is the whole point: an
 * empty panel that doesn't tell you how to fill it is just a dead end.
 */
export function Empty({
  headline,
  children,
  action,
}: {
  headline: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[460px] px-5 py-7 text-center text-xs text-[color:var(--text-muted)]">
      <b className="mb-2 block font-display text-base font-medium text-[color:var(--text)]">
        {headline}
      </b>
      {children}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
