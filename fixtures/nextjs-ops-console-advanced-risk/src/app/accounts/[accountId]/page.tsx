import { ActionPanel } from "../../../components/action-panel";
import { RiskBadge } from "../../../components/risk-badge";
import { Timeline } from "../../../components/timeline";
import { getAccountWorkspace } from "../../../lib/services/account-service";
import { getActivePlaybook } from "../../../lib/services/playbook-service";

type AccountPageProps = {
  params: {
    accountId: string;
  };
};

export default function AccountDetailPage({ params }: AccountPageProps) {
  const workspace = getAccountWorkspace(params.accountId);

  if (!workspace) {
    return (
      <main className="page-shell">
        <h1>Account not found</h1>
      </main>
    );
  }

  const { account, incidents, signals } = workspace;
  const playbook = getActivePlaybook();

  return (
    <main className="page-shell">
      <section className="detail-header">
        <div>
          <p className="eyebrow">Enterprise account</p>
          <h1>{account.name}</h1>
          <p className="muted">
            Renewal on {account.renewalDate} with ${account.renewalArr.toLocaleString()} ARR in scope.
          </p>
        </div>
        <RiskBadge level={account.riskLevel} />
      </section>

      <section className="detail-grid">
        <article className="panel">
          <h2>Risk facts</h2>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>{account.owner}</dd>
            </div>
            <div>
              <dt>Health</dt>
              <dd>{account.healthScore}</dd>
            </div>
            <div>
              <dt>Open incidents</dt>
              <dd>{account.openIncidents}</dd>
            </div>
          </dl>
        </article>

        <ActionPanel account={account} />
      </section>

      <section className="panel">
        <h2>Playbook</h2>
        <ul>
          {playbook.map((step) => (
            <li key={step.id}>
              <strong>{step.label}</strong>
              <span>{step.owner}</span>
              <span>{step.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <Timeline incidents={incidents} signals={signals} />
    </main>
  );
}
