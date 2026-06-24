import type { RiskLevel } from "../lib/domain";

type RiskBadgeProps = {
  level: RiskLevel;
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return <span className={`risk-badge risk-badge-${level}`}>{level}</span>;
}
