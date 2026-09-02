// Frontend mirror of the backend's computeGapRatio (see
// backend/src/utils/competencyScoring.util.ts) for the one place gap is
// computed client-side instead of via an API call — the assessment detail
// page's per-staff/per-competency table (features/admin/assessments/[id]).
// Kept in sync deliberately: same requiredLevel===0 guard, same floor-only
// -at-display-time behaviour driven by Setting.gapRatioFloorNegative.
export function formatGapRatioPercent(
  gap: number,
  requiredLevel: number,
  floorNegative: boolean,
): string {
  if (!requiredLevel) return "N/A"
  const rawRatio = gap / requiredLevel
  const ratio = floorNegative && rawRatio < 0 ? 0 : rawRatio
  return `${Math.round(ratio * 100)}%`
}
