import { playbookSteps } from "../data";

export function getActivePlaybook() {
  return playbookSteps;
}

export function summarizePlaybookReadiness() {
  const blocked = playbookSteps.filter((step) => step.status === "blocked").length;
  const inReview = playbookSteps.filter((step) => step.status === "in_review").length;

  return {
    total: playbookSteps.length,
    blocked,
    inReview,
    readyForAutomation: false,
    reason: "Human review is required before provider, billing, or notification side effects."
  };
}
