type ClientCardProps = {
  clientId: string;
  name: string;
  plan: string;
  health: string;
  summary: string;
};

export function ClientCard({ clientId, name, plan, health, summary }: ClientCardProps) {
  return (
    <article className="panel client-card" data-client-id={clientId}>
      <div>
        <p className="eyebrow">{plan} plan</p>
        <h2>{name}</h2>
        <p className="muted">{summary}</p>
      </div>
      <dl className="client-facts">
        <div>
          <dt>Health</dt>
          <dd>{health}</dd>
        </div>
      </dl>
      <div className="actions">
        <button className="button" type="button">
          Review client
        </button>
      </div>
    </article>
  );
}

