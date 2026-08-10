export function getPlanningState(occurrence) {
  const title = occurrence?.title?.trim() ?? "";
  const summary = occurrence?.summary?.trim() ?? "";
  const plan = occurrence?.plan?.trim() ?? "";
  if (plan) return "planned";
  return title || summary ? "plan-not-added" : "no-content";
}
