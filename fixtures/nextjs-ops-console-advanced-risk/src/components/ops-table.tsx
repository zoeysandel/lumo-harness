import type { Account } from "../lib/domain";
import { RiskBadge } from "./risk-badge";

type OpsTableProps = {
  accounts: Array<Account & { customerVisibleIncidents: number; confirmedSignals: number }>;
};

export function OpsTable({ accounts }: OpsTableProps) {
  return (
    <table className="ops-table">
      <thead>
        <tr>
          <th>Enterprise account</th>
          <th>Risk</th>
          <th>Renewal</th>
          <th>Owner</th>
          <th>Signals</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => (
          <tr key={account.id}>
            <td>
              <a href={`/accounts/${account.id}`}>{account.name}</a>
              <span>{account.segment}</span>
            </td>
            <td>
              <RiskBadge level={account.riskLevel} />
            </td>
            <td>${account.renewalArr.toLocaleString()}</td>
            <td>{account.owner}</td>
            <td>{account.confirmedSignals} confirmed</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
