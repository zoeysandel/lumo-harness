import type { Account, ImpactPreview } from "../domain";

export function calculateRiskWeight(account: Account) {
  const severityWeight = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 6
  }[account.riskLevel];

  return severityWeight + account.openIncidents + Math.max(0, 80 - account.healthScore) / 20;
}

export function createLocalImpactPreview(account: Account, requestedActions: string[]): ImpactPreview {
  const warnings = [
    account.billingExposure > 0 ? "Billing exposure exists; do not mutate billing from this slice." : "",
    account.notificationExposure > 0 ? "Notification exposure exists; do not send external messages from this slice." : "",
    requestedActions.length > 3 ? "Large action plans need human review before execution." : ""
  ].filter(Boolean);

  return {
    accountId: account.id,
    projectedArrAtRisk: Math.round(account.renewalArr * Math.min(0.8, calculateRiskWeight(account) / 10)),
    affectedTeams: ["Account", "Support", "Revenue Ops"],
    warnings,
    status: "local_preview"
  };
}
