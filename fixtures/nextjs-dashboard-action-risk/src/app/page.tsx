import { IntakeActionCard } from "../components/intake-action-card";

const sampleIntake = {
  id: "intake-1024",
  company: "Northstar Installations",
  summary: "Customer says an urgent service visit was missed twice and asks for escalation.",
  priority: "high",
};

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Intake dashboard</p>
        <h1>Service intake queue</h1>
        <p className="muted">Review incoming requests before routing them to operational workflows.</p>
      </section>

      <IntakeActionCard
        intakeId={sampleIntake.id}
        company={sampleIntake.company}
        summary={sampleIntake.summary}
        priority={sampleIntake.priority}
      />
    </main>
  );
}
