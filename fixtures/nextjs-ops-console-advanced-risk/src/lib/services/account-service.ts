import { accounts, incidents, renewalSignals } from "../data";

export function listAccountsForOpsDashboard() {
  return accounts.map((account) => {
    const accountIncidents = incidents.filter((incident) => incident.accountId === account.id);

    return {
      ...account,
      customerVisibleIncidents: accountIncidents.filter((incident) => incident.customerVisible).length,
      confirmedSignals: renewalSignals.filter((signal) => {
        return signal.accountId === account.id && signal.confidence === "confirmed";
      }).length
    };
  });
}

export function getAccountById(accountId: string) {
  return accounts.find((account) => account.id === accountId);
}

export function getAccountWorkspace(accountId: string) {
  const account = getAccountById(accountId);

  if (!account) {
    return null;
  }

  return {
    account,
    incidents: incidents.filter((incident) => incident.accountId === account.id),
    signals: renewalSignals.filter((signal) => signal.accountId === account.id)
  };
}
