export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AccountStage = "onboarding" | "steady_state" | "renewal" | "at_risk";

export type Account = {
  id: string;
  name: string;
  segment: "commercial" | "enterprise" | "strategic";
  owner: string;
  stage: AccountStage;
  renewalDate: string;
  renewalArr: number;
  riskLevel: RiskLevel;
  healthScore: number;
  openIncidents: number;
  billingExposure: number;
  notificationExposure: number;
  lastExecutiveTouch: string;
};

export type Incident = {
  id: string;
  accountId: string;
  title: string;
  severity: RiskLevel;
  openedAt: string;
  customerVisible: boolean;
  summary: string;
};

export type PlaybookStep = {
  id: string;
  label: string;
  owner: string;
  status: "queued" | "in_review" | "blocked" | "done";
  dueInHours: number;
};

export type RenewalSignal = {
  accountId: string;
  signal: string;
  confidence: "confirmed" | "inference" | "unconfirmed";
  source: string;
};

export type ImpactPreview = {
  accountId: string;
  projectedArrAtRisk: number;
  affectedTeams: string[];
  warnings: string[];
  status: "local_preview";
};
