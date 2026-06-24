import type { Account } from "../lib/domain";

type ActionPanelProps = {
  account: Account;
};

export function ActionPanel({ account }: ActionPanelProps) {
  return (
    <aside className="action-panel" aria-label="Operations actions">
      <p className="eyebrow">Review gate</p>
      <h2>{account.name} playbook</h2>
      <p className="muted">
        Draft local plans, preview impact, and keep provider, billing, and notification actions behind human approval.
      </p>
      <div className="actions">
        <button type="button">Preview impact</button>
        <button type="button">Draft containment plan</button>
      </div>
    </aside>
  );
}
