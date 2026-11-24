import { t } from '../../language';
type PaginationProps = {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, lastPage, onChange }: PaginationProps) {
  if (page === 1 && lastPage <= 1) {
    return null;
  }

  return (
    <nav className="summary-row" aria-label={t("Paginação", "Pagination")}>
      <button className="ghost" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t("Anterior", "Previous")}
      </button>
      <span>{t("Página", "Page")} {page} {t("de", "of")} {lastPage}</span>
      <button className="ghost" type="button" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        {t("Seguinte", "Next")}
      </button>
    </nav>
  );
}
