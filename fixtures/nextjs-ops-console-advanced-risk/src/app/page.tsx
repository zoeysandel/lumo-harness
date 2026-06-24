import { MetricCard } from "../components/metric-card";
import { OpsTable } from "../components/ops-table";
import { listAccountsForOpsDashboard } from "../lib/services/account-service";
import { summarizePlaybookReadiness } from "../lib/services/playbook-service";

export default function OpsConsolePage() {
  const accounts = listAccountsForOpsDashboard();
  const playbook = summarizePlaybookReadiness();
  const arrAtRisk = accounts
    .filter((account) => account.riskLevel === "high" || account.riskLevel === "critical")
    .reduce((total, account) => total + account.renewalArr, 0);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Ops console</p>
        <h1>Enterprise renewal risk command center</h1>
        <p className="muted">
          Coordinate account recovery work without accidentally triggering provider, billing, notification, or AI side effects.
        </p>
      </section>

      <section className="metrics" aria-label="Operations metrics">
        <MetricCard label="ARR at risk" value={`$${arrAtRisk.toLocaleString()}`} detail="High and critical enterprise renewals" />
        <MetricCard label="Blocked playbook steps" value={String(playbook.blocked)} detail={playbook.reason} />
        <MetricCard label="Accounts watched" value={String(accounts.length)} detail="Mock data only; no database reads" />
      </section>

      <section className="panel">
        <h2>Enterprise account queue</h2>
        <OpsTable accounts={accounts} />
      </section>
    </main>
  );
}
