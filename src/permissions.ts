import { t } from './language';

export const managementAreas = {
  members: t("Membros", "Members"),
  events: t("Eventos", "Events"),
  attendance: t("Presenças", "Attendance"),
  repertoire: t("Repertório", "Repertoire"),
  files: t("Ficheiros", "Files"),
  communication: t("Comunicação", "Communication"),
  inventory: t("Inventário", "Inventory"),
  stage: t("Plantas de palco", "Stage plans"),
  payments: t("Pagamentos", "Payments"),
  vacancies: t("Vagas", "Vacancies"),
  licences: t("Licenças", "Licences"),
} as const;

export type ManagementArea = keyof typeof managementAreas;
