
import { useState } from 'react';
import { musicLabel, normalizeMusicChoice } from '../../musicCatalog';
import type { MusicChoiceGroup } from '../../musicCatalog';
import { t } from '../../language';

type MusicChoicesProps = {
  label: string;
  groups: readonly MusicChoiceGroup[];
  value: string[];
  onChange: (value: string[]) => void;
};

const selectionLimit = 30;

export function MusicChoices({ label, groups, value, onChange }: MusicChoicesProps) {
  const [search, setSearch] = useState('');
  const filter = normalizeMusicChoice(search);
  const visible = groups.map((group) => ({
    ...group,
    options: group.options.filter(([pt, en]) =>
      !filter || normalizeMusicChoice(`${group.title.join(' ')} ${pt} ${en}`).includes(filter)
    ),
  })).filter((group) => group.options.length);
  const exact = groups.flatMap((group) => group.options).find(([pt, en]) =>
    normalizeMusicChoice(pt) === filter || normalizeMusicChoice(en) === filter
  );
  const custom = search.trim();
  const selected = new Set(value.map(normalizeMusicChoice));
  const canAdd = custom.length > 0 && custom.length <= 120 && !selected.has(normalizeMusicChoice(exact?.[0] ?? custom)) && value.length < selectionLimit;

  function toggle(item: string) {
    const key = normalizeMusicChoice(item);
    if (selected.has(key)) {
      onChange(value.filter((entry) => normalizeMusicChoice(entry) !== key));
    } else if (value.length < selectionLimit) {
      onChange([...value, item]);
    }
  }

  return (
    <fieldset className="music-choices">
      <legend>{label}</legend>
      {value.length ? (
        <ul className="music-choice-tags">
          {value.map((entry) => (
            <li key={entry}>
              <button type="button" className="tiny ghost" aria-label={t(`Remover ${musicLabel(entry)}`, `Remove ${musicLabel(entry)}`)}
                onClick={() => toggle(entry)}>{musicLabel(entry)} <span aria-hidden="true">×</span></button>
            </li>
          ))}
        </ul>
      ) : <p className="muted">{t('Nenhuma opção selecionada.', 'No options selected.')}</p>}
      <details>
        <summary>{t('Escolher ou pesquisar opções', 'Browse or search options')}</summary>
        <div className="music-choice-search">
          <label>{t('Pesquisar ou escrever um valor próprio', 'Search or enter your own value')}
            <input value={search} maxLength={120} onChange={(event) => setSearch(event.target.value)} type="search"
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
                if (event.key === 'Enter' && canAdd) {
                  toggle(exact?.[0] ?? custom);
                  setSearch('');
                }
              }} />
          </label>
          {canAdd ? <button type="button" className="ghost" onClick={() => { toggle(exact?.[0] ?? custom); setSearch(''); }}>
            {t(`Adicionar «${musicLabel(exact?.[0] ?? custom)}»`, `Add “${musicLabel(exact?.[0] ?? custom)}”`)}
          </button> : null}
        </div>
        <div className="music-choice-options">
          {visible.map((group) => (
            <div key={group.title[0]} className="music-choice-family">
              <strong>{t(...group.title)}</strong>
              {group.options.map(([pt, en]) => (
                <label key={pt} className="checkbox-row">
                  <input type="checkbox" checked={selected.has(normalizeMusicChoice(pt))}
                    disabled={!selected.has(normalizeMusicChoice(pt)) && value.length >= selectionLimit}
                    onChange={() => toggle(pt)} />
                  {t(pt, en)}
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>
      {value.length >= selectionLimit ? <p role="status">{t('Limite de 30 opções atingido.', 'The 30-option limit has been reached.')}</p> : null}
    </fieldset>
  );
}
