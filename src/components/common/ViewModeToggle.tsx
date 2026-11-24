import { t } from '../../language';
import { UiIcon } from './UiIcon';

export type ListingViewMode = 'table' | 'card';

type ViewModeToggleProps = {
  value: ListingViewMode;
  onChange: (value: ListingViewMode) => void;
};

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label={t("Alternar tipo de listagem", "Change listing view")}>
      <button
        type="button"
        className={`tiny icon-action${value === 'table' ? ' active' : ''}`}
        onClick={() => onChange('table')}
        aria-pressed={value === 'table'}
      >
        <UiIcon name="table" />
        <span>{t("Tabela", "Table")}</span>
      </button>

      <button
        type="button"
        className={`tiny icon-action${value === 'card' ? ' active' : ''}`}
        onClick={() => onChange('card')}
        aria-pressed={value === 'card'}
      >
        <UiIcon name="cards" />
        <span>Cards</span>
      </button>
    </div>
  );
}
