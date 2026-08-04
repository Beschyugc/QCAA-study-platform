// Levenshtein distance, normalized to a 0-1 similarity ratio. Used by
// type-in cards to compare the typed answer against the expected one
// without demanding exact-character matches (typos, minor phrasing).
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

export const FUZZY_MATCH_THRESHOLD = 0.85;

export function isCloseEnough(
  given: string,
  expected: string,
  threshold: number = FUZZY_MATCH_THRESHOLD,
): boolean {
  return similarity(given, expected) >= threshold;
}
