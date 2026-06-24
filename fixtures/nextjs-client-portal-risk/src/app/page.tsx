import { ClientCard } from "../components/client-card";

const clients = [
  {
    id: "client-northstar",
    name: "Northstar Installations",
    plan: "Growth",
    health: "Needs attention",
    summary: "Two missed service windows and a pending renewal conversation.",
  },
  {
    id: "client-riverline",
    name: "Riverline Facilities",
    plan: "Starter",
    health: "Stable",
    summary: "Uses the portal weekly and has no open escalations.",
  },
];

export default function ClientPortalPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Client portal</p>
        <h1>Account workspace</h1>
        <p className="muted">Track client health and prepare careful follow-up actions before anything external happens.</p>
      </section>

      <section className="client-grid" aria-label="Client health">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            clientId={client.id}
            name={client.name}
            plan={client.plan}
            health={client.health}
            summary={client.summary}
          />
        ))}
      </section>
    </main>
  );
}

