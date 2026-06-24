import type { Incident, RenewalSignal } from "../lib/domain";

type TimelineProps = {
  incidents: Incident[];
  signals: RenewalSignal[];
};

export function Timeline({ incidents, signals }: TimelineProps) {
  return (
    <section className="timeline" aria-label="Account timeline">
      <h2>Risk timeline</h2>
      {incidents.map((incident) => (
        <article key={incident.id}>
          <p className="eyebrow">{incident.openedAt}</p>
          <h3>{incident.title}</h3>
          <p>{incident.summary}</p>
        </article>
      ))}
      {signals.map((signal) => (
        <article key={`${signal.accountId}-${signal.signal}`}>
          <p className="eyebrow">{signal.confidence}</p>
          <h3>{signal.source}</h3>
          <p>{signal.signal}</p>
        </article>
      ))}
    </section>
  );
}
