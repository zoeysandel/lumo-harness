type IntakeActionCardProps = {
  intakeId: string;
  company: string;
  summary: string;
  priority: string;
};

export function IntakeActionCard({ intakeId, company, summary, priority }: IntakeActionCardProps) {
  return (
    <article className="panel" data-intake-id={intakeId}>
      <div>
        <p className="eyebrow">{priority} priority</p>
        <h2>{company}</h2>
        <p className="muted">{summary}</p>
      </div>
      <div className="actions">
        <button className="button" type="button">
          Review intake
        </button>
      </div>
    </article>
  );
}
