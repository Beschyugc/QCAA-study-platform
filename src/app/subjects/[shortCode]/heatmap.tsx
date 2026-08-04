const RAG_SCORE: Record<string, number | null> = {
  red: 0,
  amber: 0.5,
  green: 1,
  unrated: null,
};

function cellColour(average: number | null) {
  if (average === null) return "#3f3f46"; // no rated objectives yet
  // red (0) -> amber (0.5) -> green (1)
  if (average < 0.5) return `rgb(${239 - average * 2 * 30}, ${68 + average * 2 * 100}, 68)`;
  const t = (average - 0.5) * 2;
  return `rgb(${245 - t * 211}, ${158 + t * 46}, ${11 + t * 57})`;
}

type Topic = {
  id: string;
  number: number;
  title: string;
  subtopics: {
    learningObjectives: { ragStatus: string }[];
  }[];
};
type Unit = { id: string; number: number; title: string; topics: Topic[] };

export function RagHeatmap({ units }: { units: Unit[] }) {
  return (
    <div className="mb-6 space-y-2">
      {units.map((unit) => (
        <div key={unit.id} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">
            Unit {unit.number}
          </span>
          <div className="flex flex-wrap gap-1">
            {unit.topics.map((topic) => {
              const scores = topic.subtopics
                .flatMap((s) => s.learningObjectives)
                .map((o) => RAG_SCORE[o.ragStatus])
                .filter((s): s is number => s !== null);
              const average =
                scores.length === 0
                  ? null
                  : scores.reduce((a, b) => a + b, 0) / scores.length;
              return (
                <div
                  key={topic.id}
                  title={`Topic ${topic.number}: ${topic.title} — ${
                    average === null
                      ? "no ratings yet"
                      : `${Math.round(average * 100)}% average`
                  }`}
                  className="flex h-8 w-8 items-center justify-center rounded text-xs font-medium text-white"
                  style={{ backgroundColor: cellColour(average) }}
                >
                  {topic.number}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
