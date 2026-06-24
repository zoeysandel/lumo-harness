import type { Account, Incident, PlaybookStep, RenewalSignal } from "./domain";

export const accounts: Account[] = [
  {
    id: "acct-northstar",
    name: "Northstar Grid",
    segment: "strategic",
    owner: "Avery Chen",
    stage: "renewal",
    renewalDate: "2026-08-15",
    renewalArr: 420000,
    riskLevel: "critical",
    healthScore: 43,
    openIncidents: 3,
    billingExposure: 74000,
    notificationExposure: 12,
    lastExecutiveTouch: "2026-06-17"
  },
  {
    id: "acct-riverline",
    name: "Riverline Logistics",
    segment: "enterprise",
    owner: "Mara Singh",
    stage: "at_risk",
    renewalDate: "2026-09-03",
    renewalArr: 180000,
    riskLevel: "high",
    healthScore: 58,
    openIncidents: 2,
    billingExposure: 21000,
    notificationExposure: 4,
    lastExecutiveTouch: "2026-06-20"
  },
  {
    id: "acct-fieldstone",
    name: "Fieldstone Care",
    segment: "commercial",
    owner: "Noah Garcia",
    stage: "steady_state",
    renewalDate: "2026-11-28",
    renewalArr: 64000,
    riskLevel: "medium",
    healthScore: 74,
    openIncidents: 1,
    billingExposure: 0,
    notificationExposure: 1,
    lastExecutiveTouch: "2026-06-11"
  }
];

export const incidents: Incident[] = [
  {
    id: "inc-1001",
    accountId: "acct-northstar",
    title: "Delayed integration cutover",
    severity: "critical",
    openedAt: "2026-06-18T09:30:00Z",
    customerVisible: true,
    summary: "Migration blockers delayed two executive milestones."
  },
  {
    id: "inc-1002",
    accountId: "acct-northstar",
    title: "Billing reconciliation mismatch",
    severity: "high",
    openedAt: "2026-06-19T12:45:00Z",
    customerVisible: true,
    summary: "Invoice exposure exists, but billing writes are not allowed from this fixture."
  },
  {
    id: "inc-2001",
    accountId: "acct-riverline",
    title: "Stale notification template",
    severity: "high",
    openedAt: "2026-06-21T16:05:00Z",
    customerVisible: false,
    summary: "Notification copy needs review before external send."
  }
];

export const playbookSteps: PlaybookStep[] = [
  {
    id: "step-legal-review",
    label: "Legal review of customer-facing commitment",
    owner: "Legal Ops",
    status: "in_review",
    dueInHours: 18
  },
  {
    id: "step-exec-brief",
    label: "Executive recovery brief",
    owner: "Account Owner",
    status: "queued",
    dueInHours: 8
  },
  {
    id: "step-billing-freeze",
    label: "Billing change freeze",
    owner: "Revenue Ops",
    status: "blocked",
    dueInHours: 4
  }
];

export const renewalSignals: RenewalSignal[] = [
  {
    accountId: "acct-northstar",
    signal: "Procurement asked for a remediation timeline before renewal approval.",
    confidence: "confirmed",
    source: "call summary"
  },
  {
    accountId: "acct-northstar",
    signal: "Champion has paused expansion planning.",
    confidence: "inference",
    source: "account notes"
  },
  {
    accountId: "acct-riverline",
    signal: "Support leader requested weekly incident digest.",
    confidence: "confirmed",
    source: "support ticket"
  }
];
