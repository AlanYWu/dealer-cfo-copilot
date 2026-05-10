import type { ReactNode } from "react";

export function AppShell(props: {
  sidebar: ReactNode;
  results: ReactNode;
  pdf: ReactNode;
}) {
  return (
    <div className="h-screen grid" style={{ gridTemplateColumns: "260px 1fr 1fr" }}>
      <aside className="border-r border-neutral-200 bg-neutral-50 overflow-y-auto">
        {props.sidebar}
      </aside>
      <section className="overflow-y-auto border-r border-neutral-200">
        {props.results}
      </section>
      <section className="overflow-hidden bg-neutral-100">
        {props.pdf}
      </section>
    </div>
  );
}
