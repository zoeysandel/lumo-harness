import Link from "next/link";

const actions = [
  { href: "/settings", label: "Open settings" },
  { href: "/help", label: "Read help" },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Workspace</p>
        <h1>Team dashboard</h1>
        <p className="muted">
          Manage small account preferences locally before connecting any production services.
        </p>
        <div className="actions">
          {actions.map((action) => (
            <Link className="button" href={action.href} key={action.href}>
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
