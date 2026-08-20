// Minimal reproduction of the generate-cards 400 — calls generateJson once
// (jsonMode, like draftCardsForBand does) and prints the full error.
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { generateText } = await import("../src/lib/ai/provider");

  // Same shape as a card-generation call: jsonMode on.
  try {
    const out = await generateText(
      [{ role: "user", content: 'Reply with the JSON {"ok": true} and nothing else.' }],
      { jsonMode: true },
    );
    console.log("jsonMode OK:", out);
  } catch (e) {
    console.error("jsonMode FAILED:", (e as Error).message);
  }

  // Control: same call without jsonMode (no thinking:disabled).
  try {
    const out = await generateText([
      { role: "user", content: "Say OK and nothing else." },
    ]);
    console.log("plain OK:", out);
  } catch (e) {
    console.error("plain FAILED:", (e as Error).message);
  }
}

main();
