// Subject priority weights feed the recommendation engine (Phase 11).
// Edit these, not application logic, to change how study time gets allocated.
export const SUBJECTS = [
  {
    shortCode: "MM",
    name: "Mathematical Methods",
    priorityWeight: 1.0,
    colour: "#3b82f6",
  },
  {
    shortCode: "BIO",
    name: "Biology",
    priorityWeight: 0.8,
    colour: "#22c55e",
  },
  {
    shortCode: "PSY",
    name: "Psychology",
    priorityWeight: 0.65,
    colour: "#a855f7",
  },
  {
    shortCode: "ENG",
    name: "English",
    priorityWeight: 0.5,
    colour: "#f97316",
  },
  {
    shortCode: "PE",
    name: "Physical Education",
    priorityWeight: 0.35,
    colour: "#ef4444",
  },
] as const;
