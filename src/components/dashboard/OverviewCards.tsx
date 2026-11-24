import { t } from '../../language';
﻿import type { User } from '../../types';

type OverviewCardsProps = {
  user: User;
  groupsCount: number;
  instrumentsText: string;
};

export function OverviewCards({ user, groupsCount, instrumentsText }: OverviewCardsProps) {
  return (
    <>
      <article className="overview-card">
        <h2>{t("Conta", "Account")}</h2>
        <p>
          <strong>{t("Nome:", "Name:")}</strong> {user.name}
        </p>
        <p>
          <strong>{t("Email:", "Email:")}</strong> {user.email}
        </p>
        <p>
          <strong>{t("Instrumentos:", "Instruments:")}</strong> {instrumentsText}
        </p>
      </article>

      <article className="overview-card">
        <h2>{t("Contexto", "Context")}</h2>
        <p>
          <strong>{t("Grupos:", "Ensembles:")}</strong> {groupsCount}
        </p>
        <p>
          <strong>{t("Status:", "Status:")}</strong> {user.profile?.participation_status ?? 'ativo'}
        </p>
      </article>
    </>
  );
}
