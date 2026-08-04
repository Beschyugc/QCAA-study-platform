"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Trend = { date: string; minutes: number }[];
type RagDistribution = { subject: string; red: number; amber: number; green: number; unrated: number }[];

const RAG_COLOURS = { red: "#ef4444", amber: "#f59e0b", green: "#22c55e", unrated: "#a1a1aa" };

export function AnalyticsCharts({
  trend,
  ragDistribution,
  overallRetention,
  totalReviews,
}: {
  trend: Trend;
  ragDistribution: RagDistribution;
  overallRetention: number | null;
  totalReviews: number;
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-around rounded-md border border-border py-3 text-center text-xs text-muted-foreground">
        <div>
          <div className="text-lg font-semibold text-foreground">
            {overallRetention !== null ? `${overallRetention}%` : "—"}
          </div>
          Card retention (quality ≥ 3)
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{totalReviews}</div>
          Reviews (last 500)
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Study time — last 30 days</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="minutes" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">RAG distribution by subject</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ragDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="red" stackId="rag" fill={RAG_COLOURS.red} />
              <Bar dataKey="amber" stackId="rag" fill={RAG_COLOURS.amber} />
              <Bar dataKey="green" stackId="rag" fill={RAG_COLOURS.green} />
              <Bar dataKey="unrated" stackId="rag" fill={RAG_COLOURS.unrated} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
