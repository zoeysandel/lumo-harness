import { FieldRow, SettingsPanel } from "../components/settings-panel";

export default function HomePage() {
  return (
    <main>
      <SettingsPanel
        eyebrow="Account settings"
        title="Workspace preferences"
        description="Manage local account preferences before connecting production services."
      >
        <FieldRow label="Profile" description="Display name and workspace identity." value="Local only" />
        <FieldRow label="Notifications" description="Delivery preferences for account updates." value="Not configured" />
      </SettingsPanel>
    </main>
  );
}
