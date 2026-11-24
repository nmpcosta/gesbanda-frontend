import { t } from '../../language';
﻿type HeaderBarProps = {
  hasUser: boolean;
  onLogout: () => void;
};

export function HeaderBar({ hasUser, onLogout }: HeaderBarProps) {
  return (
    <header className="header-row">
      <div>
        <h1>GesBanda</h1>
        <p className="subtitle">{t("Gestao colaborativa de agrupamentos musicais.", "A shared workspace for musical ensembles.")}</p>
      </div>

      {hasUser && (
        <button className="ghost" type="button" onClick={onLogout}>
          {t("Terminar sessao", "Sign out")}
        </button>
      )}
    </header>
  );
}
