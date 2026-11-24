
import type { ReactNode } from 'react';
import { t } from '../../language';
import type { SocietySection, WorkspaceView } from '../../ui-types';
import { UiIcon, type UiIconName } from '../common/UiIcon';

type SideNavItem = {
  id: WorkspaceView;
  label: string;
  icon: UiIconName;
};

type SideNavProps = {
  platform: boolean;
  canManageLicences: boolean;
  canManageInventory: boolean;
  canManageVacancies: boolean;
  activeView: WorkspaceView;
  societySection: SocietySection | null;
  hasSociety: boolean;
  societyCanManage: boolean;
  onChangeSocietySection: (section: SocietySection) => void;
  bandSwitcher: ReactNode;
  onChangeView: (view: WorkspaceView) => void;
};

export function SideNav({
  activeView,
  societySection,
  hasSociety,
  societyCanManage,
  onChangeSocietySection,
  bandSwitcher,
  platform,
  canManageLicences,
  canManageInventory,
  canManageVacancies,
  onChangeView,
}: SideNavProps) {
  const organization: SideNavItem[] = [
    { id: 'groups', label: t('Bandas', 'Ensembles'), icon: 'groups' },
    { id: 'members', label: t('Membros', 'Members'), icon: 'members' },
    { id: 'payments', label: t('Pagamentos a músicos', 'Musician payments'), icon: 'table' },
  ];
  const society: (SideNavItem & { societySection?: SocietySection; manage?: boolean })[] = [
    { id: 'societies', label: t('Sociedades', 'Societies'), icon: 'groups' },
    { id: 'societies', societySection: 'groups', label: t('Formações', 'Ensembles'), icon: 'groups' },
    { id: 'societies', societySection: 'members', label: t('Sócios', 'Members'), icon: 'members', manage: true },
    { id: 'societies', societySection: 'dues', label: t('Quotas', 'Dues'), icon: 'table' },
    { id: 'societies', societySection: 'notices', label: t('Comunicações', 'Communications'), icon: 'bell' },
    { id: 'societies', societySection: 'documents', label: t('Documentos', 'Documents'), icon: 'files' },
    { id: 'societies', societySection: 'sepa', label: 'SEPA', icon: 'settings', manage: true },
    { id: 'societies', societySection: 'inventory', label: t('Inventário', 'Inventory'), icon: 'files', manage: true },
    { id: 'societies', societySection: 'events', label: t('Eventos', 'Events'), icon: 'events' },
  ];
  if (canManageInventory) {
    organization.push({ id: 'inventory', label: t('Inventário', 'Inventory'), icon: 'files' });
  }
  if (canManageVacancies) {
    organization.push({ id: 'manage-vacancies', label: t('Vagas da banda', 'Ensemble vacancies'), icon: 'members' });
  }
  if (canManageLicences) {
    organization.push({ id: 'group-licenses', label: t('Licenças da banda', 'Ensemble licences'), icon: 'settings' });
  }

  const sections: { label: string; items: (SideNavItem & { societySection?: SocietySection })[] }[] = [
    {
      label: t('Organização musical', 'Music workspace'),
      items: [
        { id: 'overview', label: t('Visão geral', 'Overview'), icon: 'dashboard' },
        { id: 'events', label: t('Eventos', 'Events'), icon: 'events' },
        { id: 'attendance', label: t('Presenças', 'Attendance'), icon: 'check' },
        { id: 'communication', label: t('Comunicação', 'Communication'), icon: 'bell' },
        { id: 'repertoire', label: t('Repertório', 'Repertoire'), icon: 'repertoire' },
        { id: 'files', label: t('Arquivo', 'Archive'), icon: 'files' },
        { id: 'stage-plans', label: t('Plantas de palco', 'Stage plans'), icon: 'cards' },
      ],
    },
    { label: t('Gestão da banda', 'Ensemble management'), items: organization },
    {
      label: t('Gestão de sociedades', 'Society management'),
      items: society.filter((item) => !item.societySection || (hasSociety && (!item.manage || societyCanManage))),
    },
    {
      label: t('Comunidade', 'Community'),
      items: [
        { id: 'vacancies', label: t('Bolsa de músicos', 'Musician vacancies'), icon: 'groups' },
      ],
    },
  ];
  if (platform) {
    sections.unshift({
      label: t('Plataforma', 'Platform'),
      items: [
        { id: 'platform-licenses', label: t('Licenciamento', 'Licensing'), icon: 'settings' },
        { id: 'history', label: t('Histórico', 'Activity'), icon: 'agenda' },
      ],
    });
  }

  return (
    <nav className="reserved-nav" id="workspace-nav" aria-label={t('Área reservada', 'Workspace navigation')}>
      <button className="reserved-brand" type="button" onClick={() => onChangeView('overview')} aria-label="GesBanda">
        <span className="reserved-brand-icon" aria-hidden="true"><UiIcon name="repertoire" size={20} /></span>
        <span className="reserved-nav-text">GesBanda</span>
      </button>

      <div className="reserved-band-context">
        <p>{t('Formação ativa', 'Active ensemble')}</p>
        {bandSwitcher}
      </div>

      {sections.map((section) => (
        <div className="reserved-nav-section" key={section.label}>
          <p className="reserved-nav-text">{section.label}</p>
          <ul aria-label={section.label}>
            {section.items.map((item) => (
              <li key={item.societySection ?? item.id}>
                <button type="button" className="reserved-nav-item"
                  aria-current={activeView === item.id && (item.id !== 'societies' || (item.societySection ?? null) === societySection) ? 'page' : undefined}
                  onClick={() => item.societySection ? onChangeSocietySection(item.societySection) : onChangeView(item.id)} title={item.label} aria-label={item.label}>
                  <UiIcon name={item.icon} size={18} />
                  <span className="reserved-nav-text">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
