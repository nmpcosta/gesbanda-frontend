import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type { GroupForm } from '../../ui-types';

type CreateGroupPanelProps = {
  groupForm: GroupForm;
  submittingGroup: boolean;
  setGroupForm: (updater: (previous: GroupForm) => GroupForm) => void;
  onSubmit: (event: FormEvent) => void;
};

export function CreateGroupPanel({
  groupForm,
  submittingGroup,
  setGroupForm,
  onSubmit,
}: CreateGroupPanelProps) {
  return (
    <article className="module-panel full-width">
      <h2>{t("Criar grupo", "Create ensemble")}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t("Nome do grupo", "Ensemble name")}
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
              setGroupForm((previous) => ({
                ...previous,
                location: event.target.value,
              }))
            }
          />
        </label>

        <label>
          {t("Descricao", "Description")}
          <textarea
            rows={3}
            value={groupForm.description}
            onChange={(event) =>
              setGroupForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />
        </label>

        <button type="submit" disabled={submittingGroup}>
          {submittingGroup ? t("A criar grupo...", "Creating ensemble…") : t("Criar grupo", "Create ensemble")}
        </button>
      </form>
    </article>
  );
}
