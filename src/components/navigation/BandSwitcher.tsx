
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { t } from '../../language';
import type { GroupSummary } from '../../types';
import { UiIcon } from '../common/UiIcon';

type BandSwitcherProps = {
  groups: GroupSummary[];
  selectedGroup: GroupSummary | null;
  loading: boolean;
  onSelect: (groupId: number) => void;
  onCreate: () => void;
};

const groupTypes: Record<string, string> = {
  band: t('Banda', 'Band'),
  choir: t('Coro', 'Choir'),
  orchestra: t('Orquestra', 'Orchestra'),
  ensemble: t('Agrupamento', 'Ensemble'),
  other: t('Outro', 'Other'),
};

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function BandSwitcher({ groups, selectedGroup, loading, onSelect, onCreate }: BandSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-bands`;
  const value = normalized(query.trim());
  const filtered = groups.filter((group) => !value || normalized(
    [group.name, group.location, groupTypes[group.group_type]].filter(Boolean).join(' ')
  ).includes(value));
  const position = Math.min(highlight, filtered.length - 1);

  useEffect(() => {
    if (!open) {
      return;
    }

    search.current?.focus();
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) {
      trigger.current?.focus();
    }
  }

  function choose(group: GroupSummary) {
    onSelect(group.id);
    close(true);
  }

  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const length = filtered.length;
      if (length) {
        const next = (position + (event.key === 'ArrowDown' ? 1 : -1) + length) % length;
        setHighlight(next);
        root.current?.querySelectorAll('[role=option]')[next]?.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter' && filtered[position]) {
      event.preventDefault();
      choose(filtered[position]);
    }
  }

  return (
    <div className="band-switcher" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        close();
      }
    }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) {
        event.stopPropagation();
        close(true);
      }
    }}>
      <button ref={trigger} className="band-switcher-trigger" type="button"
        aria-label={selectedGroup ? t(`Mudar de banda. Banda ativa: ${selectedGroup.name}`, `Switch ensemble. Active ensemble: ${selectedGroup.name}`) : t('Selecionar banda', 'Select ensemble')}
        aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? listId : undefined}
        onClick={() => {
          if (open) {
            close();
          } else {
            setQuery('');
            setHighlight(Math.max(0, groups.findIndex((group) => group.id === selectedGroup?.id)));
            setOpen(true);
          }
        }}>
        <span className="band-switcher-icon" style={selectedGroup?.color ? { color: selectedGroup.color, background: '#fff' } : undefined} aria-hidden="true"><UiIcon name="groups" size={17} /></span>
        <span className="band-switcher-name">{selectedGroup?.name ?? (loading ? t('A carregar bandas…', 'Loading ensembles…') : t('Selecionar banda', 'Select ensemble'))}</span>
        <span className="band-switcher-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div className="band-switcher-popover">
          {groups.length > 0 ? (
            <label className="band-switcher-search">
              <span className="band-switcher-label">{t('As tuas bandas', 'Your ensembles')}</span>
              <input ref={search} type="search" role="combobox" value={query} aria-controls={listId}
                aria-label={t('Pesquisar bandas', 'Search ensembles')} aria-expanded="true"
                aria-autocomplete="list" aria-activedescendant={filtered[position] ? `${listId}-${filtered[position].id}` : undefined}
                placeholder={t('Nome ou localidade', 'Name or location')}
                onChange={(event) => { setQuery(event.target.value); setHighlight(0); }}
                onKeyDown={handleKeys} />
            </label>
          ) : null}
          <ul id={listId} className="band-switcher-options" role="listbox" aria-label={t('Bandas', 'Ensembles')}>
            {filtered.map((group, index) => (
              <li key={group.id} role="option" id={`${listId}-${group.id}`} aria-selected={group.id === selectedGroup?.id}
                data-highlighted={index === position} onPointerMove={() => setHighlight(index)}
                onPointerDown={(event) => event.preventDefault()} onClick={() => choose(group)}>
                <span className="band-switcher-option-content"><i aria-hidden="true" style={{ background: group.color }} /><span><strong>{group.name}</strong><small>{[groupTypes[group.group_type], group.location].filter(Boolean).join(' · ')}</small></span></span>
                {group.membership_status === 'invited' ? <small>{t('Convite', 'Invitation')}</small> : null}
                {group.id === selectedGroup?.id ? <UiIcon name="check" size={18} /> : null}
              </li>
            ))}
          </ul>
          {filtered.length === 0 ? <p className="band-switcher-empty" role="status">{groups.length ? t('Nenhuma banda corresponde à pesquisa.', 'No ensembles match your search.') : t('Ainda não tens bandas.', 'You do not have any ensembles yet.')}</p> : null}
          <button type="button" className="band-switcher-create" onClick={() => { close(); onCreate(); }}>
            <UiIcon name="plus" size={18} />{t('Criar nova banda', 'Create a new ensemble')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
