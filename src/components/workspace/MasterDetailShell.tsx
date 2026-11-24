import type { ReactNode } from 'react';

type MasterDetailShellProps = {
  title: string;
  description: string;
  masterTitle: string;
  detailTitle: string;
  editTitle: string;
  master: ReactNode;
  detail: ReactNode;
  edit: ReactNode;
};

export function MasterDetailShell({
  title,
  description,
  masterTitle,
  detailTitle,
  editTitle,
  master,
  detail,
  edit,
}: MasterDetailShellProps) {
  return (
    <section className="workspace-panel">
      <header className="workspace-head">
        <h2>{title}</h2>
        <p className="subtitle">{description}</p>
      </header>

      <div className="master-detail-grid">
        <aside className="workspace-card">
          <h3>{masterTitle}</h3>
          {master}
        </aside>

        <div className="workspace-main-column">
          <article className="workspace-card">
            <h3>{detailTitle}</h3>
            {detail}
          </article>

          <article className="workspace-card">
            <h3>{editTitle}</h3>
            {edit}
          </article>
        </div>
      </div>
    </section>
  );
}
