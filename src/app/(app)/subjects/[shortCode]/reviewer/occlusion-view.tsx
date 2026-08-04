type Region = { x: number; y: number; w: number; h: number; label?: string };
type OcclusionData = { imageUrl: string; regions: Region[]; targetIndex: number };

// v1 scope: all regions are hidden on the front; revealing shows the whole
// image with the target region ringed, rather than Anki's fancier
// "reveal only this one, keep others hidden" mode. Documented trade-off —
// see occlusion/actions.ts.
export function OcclusionView({
  extra,
  revealed,
}: {
  extra: string | null;
  revealed: boolean;
}) {
  if (!extra) return null;
  let data: OcclusionData;
  try {
    data = JSON.parse(extra);
  } catch {
    return <p className="text-sm text-destructive">Could not load occlusion image.</p>;
  }

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.imageUrl} alt="Occlusion" className="w-full" />
      {data.regions.map((r, i) =>
        !revealed ? (
          <div
            key={i}
            className="absolute bg-foreground"
            style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
          />
        ) : i === data.targetIndex ? (
          <div
            key={i}
            className="absolute border-4 border-primary"
            style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
          />
        ) : null,
      )}
    </div>
  );
}
