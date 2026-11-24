import { t } from '../../language';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UiIcon } from '../common/UiIcon';
import { ViewModeToggle, type ListingViewMode } from '../common/ViewModeToggle';
import type { GroupSummary } from '../../types';
import type { GroupForm } from '../../ui-types';
import type { GroupEditForm } from '../../hooks/useGroupsData';

type GroupsWorkspaceMode = 'list' | 'detail' | 'edit' | 'create';

type GroupsWorkspaceProps = {
  platform: boolean;
  canManageGroup: boolean;
  groups: GroupSummary[];
  selectedGroupId: number | null;
  selectedGroup: GroupSummary | null;
  loadingGroups: boolean;
  submittingGroup: boolean;
  updatingGroup: boolean;
  deletingGroup: boolean;
  groupForm: GroupForm;
  groupEditForm: GroupEditForm;
  createModeToken: number;
  setSelectedGroupId: (groupId: number | null) => void;
  setGroupForm: (updater: (previous: GroupForm) => GroupForm) => void;
  setGroupEditForm: (updater: (previous: GroupEditForm) => GroupEditForm) => void;
  onRefresh: () => void;
  onCreateSubmit: (event: FormEvent, ownerEmail?: string) => Promise<boolean>;
  onOpenLicenses: () => void;
  onUpdateSubmit: (event: FormEvent) => Promise<boolean>;
  onDeleteSelected: () => void | Promise<void>;
};

export function GroupsWorkspace({
  platform,
  canManageGroup,
  groups,
  selectedGroupId,
  selectedGroup,
  loadingGroups,
  submittingGroup,
  updatingGroup,
  deletingGroup,
  groupForm,
  groupEditForm,
  createModeToken,
  setSelectedGroupId,
  setGroupForm,
  setGroupEditForm,
  onRefresh,
  onCreateSubmit,
  onOpenLicenses,
  onUpdateSubmit,
  onDeleteSelected,
}: GroupsWorkspaceProps) {
  const [mode, setMode] = useState<GroupsWorkspaceMode>('list');
  const [customColor, setCustomColor] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [listingView, setListingView] = useState<ListingViewMode>('table');

  useEffect(() => {
    if (!selectedGroup && mode !== 'create') {
      setMode('list');
    }
  }, [mode, selectedGroup]);

  useEffect(() => {
    if (createModeToken > 0) {
      setMode('create');
    }
  }, [createModeToken]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{platform ? t("Bandas da plataforma", "Platform ensembles") : t("Bandas", "Ensembles")}</h2>
          
        </div>

        <div className="summary-row">
          {mode === 'list' ? (
            <>
              <button
                className="ghost icon-action"
                type="button"
                onClick={onRefresh}
                disabled={loadingGroups}
              >
                <UiIcon name="refresh" />
                <span>{loadingGroups ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}</span>
              </button>
              <button className="ghost icon-action" type="button" onClick={() => setMode('create')}>
                <UiIcon name="plus" />
                <span>{t("Nova banda", "New ensemble")}</span>
              </button>
            </>
          ) : mode === 'detail' ? (
            <>
              <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
                <UiIcon name="arrow-left" />
                <span>{t("Voltar à lista", "Back to list")}</span>
              </button> 
              {canManageGroup ? (
                <>
                  <button className="ghost icon-action" type="button" onClick={onOpenLicenses}>{t("Licenças", "Licences")}</button>
                  <button className="ghost icon-action" type="button" onClick={() => setMode('edit')}>
                    <UiIcon name="edit" />
                    <span>{t("Editar", "Edit")}</span>
                  </button>
                  <button type="button" className="tiny danger icon-action" onClick={() => onDeleteSelected()} disabled={deletingGroup}>
                    <UiIcon name="trash" />
                    <span>{deletingGroup ? t("A eliminar...", "Deleting…") : t("Eliminar", "Delete")}</span>
                  </button>
                </>
              ) : null}
            </>
          ) : mode === 'edit' ? (
            <button className="ghost icon-action" type="button" onClick={() => setMode('detail')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar ao detalhe", "Back to details")}</span>
            </button>
          ) : (
            <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar a lista", "Back to list")}</span>
            </button>
          )}
        </div>
      </header>

      {mode === 'list' ? (
        groups.length === 0 ? (
          <article className="workspace-card">
            <p className="muted">{t("Ainda não há bandas.", "There are no ensembles yet.")}</p>
          </article>
        ) : (
          <article className="workspace-card listing-shell">
            <div className="listing-head">
              <h3>{t("Listagem", "List")}</h3>
              <ViewModeToggle value={listingView} onChange={setListingView} />
            </div>

            {listingView === 'table' ? (
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>{t("Nome", "Name")}</th>
                      <th>{t("Tipo", "Type")}</th>
                      <th>{t("Localização", "Location")}</th>
                      <th>{t("Plano", "Plan")}</th>
                      <th>{t("Estado", t("Status", "Status"))}</th>
                      <th>{t("Ações", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id} className={selectedGroupId === group.id ? 'selected' : ''}>
                        <td>
                          <div className="table-primary">
                            <strong>{group.name}</strong>
                            <small>#{group.id}</small>
                          </div>
                        </td>
                        <td>{group.group_type}</td>
                        <td>{group.location ?? 'Sem local'}</td>
                        <td>{group.current_license?.plan_name ?? group.plan_tier}</td>
                        <td>
                          <span className={`status-chip ${group.is_active ? 'ok' : 'warn'}`}>
                            {group.is_active ? t("Ativo", "Active") : t("Inativo", "Inactive")}
                          </span>
                        </td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="tiny icon-only"
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setMode('detail');
                            }}
                            aria-label={`Ver detalhe do grupo ${group.name}`}
                          >
                            <UiIcon name="eye" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="entity-card-grid">
                {groups.map((group) => (
                  <article key={group.id} className={`entity-card${selectedGroupId === group.id ? ' selected' : ''}`}>
                    <div>
                      <h4 className="band-color-name"><span aria-hidden="true" style={{ background: group.color }} />{group.name}</h4>
                      <p>
                        {group.group_type}
                        {group.location ? ` | ${group.location}` : ''}
                      </p>
                    </div>
                    <div className="entity-card-actions">
                      <span className={`status-chip ${group.is_active ? 'ok' : 'warn'}`}>
                        {group.is_active ? t("Ativo", "Active") : t("Inativo", "Inactive")}
                      </span>
                      <button
                        type="button"
                        className="tiny icon-action"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setMode('detail');
                        }}
                      >
                        <UiIcon name="eye" />
                        <span>{t("Detalhe", "Details")}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        )
      ) : null}

      {mode === 'detail' ? (
        <article className="workspace-card">
          {!selectedGroup ? (
            <p className="muted">{t("Seleciona um grupo na listagem.", "Select an ensemble from the list.")}</p>
          ) : (
            <div className="detail-list">
              <p>
                <strong>{t("Nome:", "Name:")}</strong> {selectedGroup.name}
              </p>
              <p>
                <strong>{t("Tipo:", "Type:")}</strong> {selectedGroup.group_type}
              </p>
              <p>
                <strong>{t("Plano:", "Plan:")}</strong> {selectedGroup.current_license?.plan_name ?? selectedGroup.plan_tier}
              </p>
              {selectedGroup.has_public_profile ? <p><a href={`?band=${encodeURIComponent(selectedGroup.slug)}&lang=${document.documentElement.lang === 'en' ? 'en' : 'pt'}`} target="_blank" rel="noreferrer">{t("Página pública da banda", "Public ensemble page")}</a></p> : null}
              {platform && selectedGroup.owner ? (
                <p><strong>{t("Proprietário:", "Owner:")}</strong> {selectedGroup.owner.name} ({selectedGroup.owner.email})</p>
              ) : null}
              <p>
                <strong>{t("Localizacao:", "Location:")}</strong> {selectedGroup.location ?? 'Sem localizacao'}
              </p>
              <p>
                <strong>{t("Descrição:", "Description:")}</strong> {selectedGroup.description ?? 'Sem descricao'}
              </p>
              <p>
                <strong>{t("Estado:", t("Status:", "Status:"))}</strong> {selectedGroup.is_active ? t("Ativo", "Active") : t("Inativo", "Inactive")}
              </p>
            </div>
          )}
        </article>
      ) : null}

      {mode === 'edit' && canManageGroup ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const saved = await onUpdateSubmit(event);
              if (saved) {
                setMode('detail');
              }
            }}
          >
            <h3>{t("Editar banda", "Edit ensemble")}</h3>
            <label>
              {t("Nome", "Name")}
              <input
                type="text"
                required
                value={groupEditForm.name}
                onChange={(event) =>
                  setGroupEditForm((previous) => ({ ...previous, name: event.target.value }))
                }
                disabled={!selectedGroup}
              />
            </label>

            <label>
              {t("Tipo", "Type")}
              <select
                value={groupEditForm.groupType}
                onChange={(event) =>
                  setGroupEditForm((previous) => ({
                    ...previous,
                    groupType: event.target.value as GroupForm['groupType'],
                  }))
                }
                disabled={!selectedGroup}
              >
                <option value="band">{t("Banda", "Band")}</option>
                <option value="choir">{t("Coro", "Choir")}</option>
                <option value="orchestra">{t("Orquestra", "Orchestra")}</option>
                <option value="ensemble">Ensemble</option>
                <option value="other">{t("Outro", "Other")}</option>
              </select>
            </label>

            <label>
              {t("Localizacao", "Location")}
              <input
                type="text"
                value={groupEditForm.location}
                onChange={(event) =>
                  setGroupEditForm((previous) => ({
                    ...previous,
                    location: event.target.value,
                  }))
                }
                disabled={!selectedGroup}
              />
            </label>

            <label>
              {t("Descricao", "Description")}
              <textarea
                rows={3}
                value={groupEditForm.description}
                onChange={(event) =>
                  setGroupEditForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                disabled={!selectedGroup}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={groupEditForm.isActive}
                onChange={(event) =>
                  setGroupEditForm((previous) => ({
                    ...previous,
                    isActive: event.target.checked,
                  }))
                }
                disabled={!selectedGroup}
              />
              {t("Grupo ativo", "Active ensemble")}
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="public_profile" key={selectedGroup?.id} defaultChecked={selectedGroup?.has_public_profile} />
              {t("Publicar a formação no diretório", "List this ensemble in the public directory")}
            </label>

            <label className="band-color-field">{t('Cor da formação', 'Ensemble colour')}
              <input type="color" name="group_color" key={selectedGroup?.id} defaultValue={selectedGroup?.color ?? '#5B3DB0'} />
            </label>

            <button type="submit" className="icon-action" disabled={updatingGroup || !selectedGroup}>
              <UiIcon name="check" />
              <span>{updatingGroup ? t("A guardar...", "Saving…") : t("Guardar alterações", "Save changes")}</span>
            </button>
          </form>
        </article>
      ) : null}

      {mode === 'create' ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const created = await onCreateSubmit(event, platform ? ownerEmail : undefined);
              if (created) {
                setOwnerEmail('');
                setCustomColor(false);
                setMode('list');
              }
            }}
          >
            <h3>{t("Nova banda", "New ensemble")}</h3>
            {platform ? (
              <label>
                {t("Email do proprietário (opcional)", "Owner's email (optional)")}
                <input type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} />
                <small>{t("Deixa em branco para atribuir a banda à tua conta.", "Leave blank to make your account the owner.")}</small>
              </label>
            ) : null}
            <label>
              {t("Nome", "Name")}
              <input
                type="text"
                required
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((previous) => ({ ...previous, name: event.target.value }))
                }
              />
            </label>

            <label>
              {t("Tipo", "Type")}
              <select
                value={groupForm.groupType}
                onChange={(event) =>
                  setGroupForm((previous) => ({
                    ...previous,
                    groupType: event.target.value as GroupForm['groupType'],
                  }))
                }
              >
                <option value="band">{t("Banda", "Band")}</option>
                <option value="choir">{t("Coro", "Choir")}</option>
                <option value="orchestra">{t("Orquestra", "Orchestra")}</option>
                <option value="ensemble">Ensemble</option>
                <option value="other">{t("Outro", "Other")}</option>
              </select>
            </label>

            <label>
              {t("Localizacao", "Location")}
              <input
                type="text"
                value={groupForm.location}
                onChange={(event) =>
                  setGroupForm((previous) => ({ ...previous, location: event.target.value }))
                }
              />
            </label>

            <label>
              {t("Descricao", "Description")}
              <textarea
                rows={3}
                value={groupForm.description}
                onChange={(event) =>
                  setGroupForm((previous) => ({ ...previous, description: event.target.value }))
                }
              />
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="use_custom_color" checked={customColor} onChange={(event) => setCustomColor(event.target.checked)} />
              {t('Escolher uma cor específica', 'Choose a custom colour')}
            </label>
            {customColor ? <label className="band-color-field">{t('Cor da formação', 'Ensemble colour')}
              <input type="color" name="group_color" defaultValue="#5B3DB0" />
            </label> : null}

            <button type="submit" className="icon-action" disabled={submittingGroup}>
              <UiIcon name="plus" />
              <span>{submittingGroup ? t("A criar...", "Creating…") : t("Criar banda", "Create ensemble")}</span>
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}
