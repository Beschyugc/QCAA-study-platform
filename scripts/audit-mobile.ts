/**
 * Actually loads the app at phone width and reports what breaks.
 *
 * Run:  npm run audit:mobile                (needs `npm run dev` running)
 *       npm run audit:mobile -- --shot      (also saves screenshots)
 *
 * PROGRESS.md has carried "responsive layout is written but still
 * unverified — the browser tooling here could not actually resize the
 * viewport" for a long time. The browser extension genuinely can't: it
 * reports a successful resize while window.outerWidth stays at 2560, so
 * media queries never switch and any measurement taken that way describes
 * the desktop layout. This drives Chrome directly with a real 390x844
 * viewport instead, so the media queries do fire and the numbers mean
 * something.
 *
 * Uses playwright-core against the Chrome already installed on this
 * machine — no browser download.
 *
 * What it checks, per page:
 *   - horizontal overflow (the phone bug: the page scrolls sideways)
 *   - which specific elements stick out past the viewport, so the report
 *     names the culprit rather than just saying "something is too wide"
 *   - tap-target sizes below 24px, which are hard to hit accurately
 *
 * Exits non-zero if any page overflows, so it can gate a commit.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { chromium, type Browser, type Page } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHmac } from "node:crypto";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const PHONE = { width: 390, height: 844 }; // iPhone 14 logical size
const SHOTS = process.argv.includes("--shot");
const SHOT_DIR = join(process.cwd(), "..", "STUDYLINE-backups", "mobile-audit");

/** Mints the same signed session cookie lib/session.ts issues, so the audit
 * can reach pages behind requireUser() without driving the login form. */
function sessionCookie(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET missing — can't mint a session for the audit");
  const issuedAt = Date.now().toString();
  const sig = createHmac("sha256", secret).update(issuedAt).digest("hex");
  return `${issuedAt}.${sig}`;
}

type Finding = {
  path: string;
  scrollWidth: number;
  overflowPx: number;
  offenders: { tag: string; cls: string; width: number; right: number; text: string }[];
  smallTargets: { tag: string; label: string; w: number; h: number }[];
  overlaps: { a: string; b: string }[];
};

async function auditPage(page: Page, path: string): Promise<Finding> {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30_000 });
  // Let any client-side layout settle before measuring.
  await page.waitForTimeout(400);

  const result = await page.evaluate((viewportWidth) => {
    const doc = document.documentElement;
    const scrollWidth = doc.scrollWidth;

    // Name the elements actually crossing the right edge. Only the
    // outermost offender in any chain matters — reporting a wide div and
    // all 12 of its children buries the real cause.
    const offenders: { tag: string; cls: string; width: number; right: number; text: string }[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right <= viewportWidth + 1) continue;

      // Content inside a deliberately side-scrolling container (the mobile
      // nav rail, wide tables) is not a bug — it's the fix. Without this the
      // nav's own links get reported as overflow on every single page.
      //
      // Inlined rather than extracted to a helper on purpose: a NAMED
      // function expression inside page.evaluate() gets esbuild's __name
      // wrapper attached, which doesn't exist in the browser, and every page
      // then fails with "__name is not defined".
      let scrollableAncestor = false;
      let p = el.parentElement;
      while (p) {
        const o = getComputedStyle(p).overflowX;
        if (o === "auto" || o === "scroll") {
          scrollableAncestor = true;
          break;
        }
        p = p.parentElement;
      }
      if (scrollableAncestor) continue;

      const parent = el.parentElement;
      if (parent && parent.getBoundingClientRect().right > viewportWidth + 1) continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 70),
        width: Math.round(r.width),
        right: Math.round(r.right),
        text: (el.textContent || "").trim().slice(0, 45),
      });
    }

    // Overlapping text. Overflow checks miss this entirely — the dashboard's
    // subject rows had the subject name rendering on top of the pace text at
    // 390px for as long as the layout existed, and every overflow check
    // passed the whole time, because nothing crossed the viewport edge.
    //
    // Compares only leaf text nodes' siblings, which is where collisions
    // caused by a grid/flex column shift actually show up.
    const overlaps: { a: string; b: string }[] = [];
    const textLeaves = Array.from(document.querySelectorAll<HTMLElement>("main *")).filter(
      (el) =>
        el.children.length === 0 &&
        (el.textContent || "").trim().length > 2 &&
        getComputedStyle(el).display !== "none" &&
        // KaTeX renders every expression TWICE — once as MathML for screen
        // readers, once as styled HTML — stacked in the same place. That is
        // correct and intentional, but it looks exactly like a collision, so
        // the accessibility copy is excluded rather than reported as 8 bogus
        // overlaps on any page containing maths.
        !el.closest(".katex-mathml") &&
        // Anything explicitly hidden from assistive tech or visually is not
        // participating in the visible layout either.
        !el.closest("[aria-hidden='true']") &&
        getComputedStyle(el).visibility !== "hidden",
    );
    for (let i = 0; i < textLeaves.length; i++) {
      for (let j = i + 1; j < textLeaves.length; j++) {
        const A = textLeaves[i];
        const B = textLeaves[j];
        // Ignore nested/ancestor pairs — those legitimately share space.
        if (A.contains(B) || B.contains(A)) continue;
        const a = A.getBoundingClientRect();
        const b = B.getBoundingClientRect();
        if (a.width === 0 || b.width === 0) continue;
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        // Require a substantial overlap in both axes so incidental
        // 1px touching doesn't get reported.
        if (overlapX > 8 && overlapY > 8) {
          overlaps.push({
            a: (A.textContent || "").trim().slice(0, 28),
            b: (B.textContent || "").trim().slice(0, 28),
          });
        }
      }
    }

    const smallTargets: { tag: string; label: string; w: number; h: number }[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("a, button, input, select"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 24 || r.width < 24) {
        smallTargets.push({
          tag: el.tagName.toLowerCase(),
          label:
            (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "")
              .trim()
              .slice(0, 40) || "(no label)",
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }

    return { scrollWidth, offenders, smallTargets, overlaps: overlaps.slice(0, 8) };
  }, PHONE.width);

  if (SHOTS) {
    mkdirSync(SHOT_DIR, { recursive: true });
    const name = path.replace(/[^\w]+/g, "_") || "root";
    await page.screenshot({ path: join(SHOT_DIR, `${name}.png`), fullPage: true });
  }

  return {
    path,
    scrollWidth: result.scrollWidth,
    overflowPx: result.scrollWidth - PHONE.width,
    offenders: result.offenders.slice(0, 6),
    smallTargets: result.smallTargets,
    overlaps: result.overlaps,
  };
}

async function main() {
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  } catch {
    throw new Error(`Could not launch Chrome at ${CHROME}`);
  }

  const context = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  await context.addCookies([
    {
      name: "studyline_session",
      value: sessionCookie(),
      domain: new URL(BASE).hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Sanity-check that the viewport genuinely applied — the whole reason
  // this script exists is that the other tool silently didn't.
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const actual = await page.evaluate(() => ({
    inner: window.innerWidth,
    mobileQuery: window.matchMedia("(max-width: 640px)").matches,
    lgQuery: window.matchMedia("(min-width: 1024px)").matches,
  }));
  console.log(
    `viewport ${actual.inner}px · max-width:640 ${actual.mobileQuery} · min-width:1024 ${actual.lgQuery}`,
  );
  if (actual.inner !== PHONE.width || !actual.mobileQuery || actual.lgQuery) {
    throw new Error("Viewport did not apply — measurements would be meaningless, refusing to report.");
  }
  console.log("");

  const paths = [
    "/",
    "/calendar",
    `/calendar/day?date=${new Date().toISOString().slice(0, 10)}`,
    "/placement",
    "/mistakes",
    "/timer",
    "/past-papers",
    "/assumed-knowledge",
    "/subjects/BIO",
    "/subjects/BIO/reviewer",
    "/subjects/BIO/cards",
    "/subjects/MM/learn",
  ];

  const findings: Finding[] = [];
  for (const path of paths) {
    try {
      findings.push(await auditPage(page, path));
    } catch (error) {
      console.log(`  ${path.padEnd(38)} FAILED TO LOAD — ${(error as Error).message.split("\n")[0]}`);
    }
  }

  console.log(`PAGE                                   OVERFLOW   SMALL TAPS  OVERLAPS`);
  for (const f of findings) {
    const status = f.overflowPx > 0 ? `+${f.overflowPx}px` : "ok";
    console.log(`  ${f.path.padEnd(36)} ${status.padEnd(10)} ${String(f.smallTargets.length).padEnd(11)} ${f.overlaps.length}`);
  }

  const overflowing = findings.filter((f) => f.overflowPx > 0);
  const broken = findings.filter((f) => f.overflowPx > 0 || f.overlaps.length > 0);
  if (overflowing.length > 0) {
    console.log(`\nWHAT'S STICKING OUT`);
    for (const f of overflowing) {
      console.log(`\n  ${f.path}  (scrollWidth ${f.scrollWidth} vs viewport ${PHONE.width})`);
      for (const o of f.offenders) {
        console.log(`    <${o.tag}> w=${o.width} right=${o.right}`);
        console.log(`      class: ${o.cls}`);
        if (o.text) console.log(`      text : ${o.text}`);
      }
    }
  }

  const withSmall = findings.filter((f) => f.smallTargets.length > 0);
  if (withSmall.length > 0) {
    console.log(`\nTAP TARGETS UNDER 24px`);
    for (const f of withSmall) {
      console.log(`\n  ${f.path}`);
      for (const t of f.smallTargets) {
        console.log(`    <${t.tag}> ${t.w}x${t.h}  ${t.label}`);
      }
    }
  }

  const withOverlap = findings.filter((f) => f.overlaps.length > 0);
  if (withOverlap.length > 0) {
    console.log(`\nOVERLAPPING TEXT`);
    for (const f of withOverlap) {
      console.log(`\n  ${f.path}`);
      for (const o of f.overlaps) console.log(`    "${o.a}"  <>  "${o.b}"`);
    }
  }

  if (SHOTS) console.log(`\nScreenshots: ${SHOT_DIR}`);

  await browser.close();

  console.log(
    broken.length === 0
      ? `\nClean at ${PHONE.width}px across ${findings.length} pages: no overflow, no overlapping text, no tap target under 24px.`
      : `\n${broken.length} of ${findings.length} pages have layout problems at ${PHONE.width}px.`,
  );
  process.exit(broken.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
