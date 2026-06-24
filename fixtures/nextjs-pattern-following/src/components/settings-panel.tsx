import type { ReactNode } from "react";

type SettingsPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

type FieldRowProps = {
  label: string;
  description: string;
  value: string;
};

export function SettingsPanel({ eyebrow, title, description, children }: SettingsPanelProps) {
  return (
    <section className="settings-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      <div className="settings-list">{children}</div>
    </section>
  );
}

export function FieldRow({ label, description, value }: FieldRowProps) {
  return (
    <div className="field-row">
      <div>
        <h2>{label}</h2>
        <p className="muted">{description}</p>
      </div>
      <strong>{value}</strong>
    </div>
  );
}
