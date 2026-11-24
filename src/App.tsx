import { legalUrl } from './LegalPages';
import { language, languageUrl, locale, t } from './language';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthForms } from './components/auth/AuthForms';
import { Alerts } from './components/common/Alerts';
import { UiIcon } from './components/common/UiIcon';
import { BandSwitcher } from './components/navigation/BandSwitcher';
import { SideNav } from './components/navigation/SideNav';
import { AgendaWorkspace } from './components/workspace/AgendaWorkspace';
import { QrAttendance } from './components/workspace/AttendanceCheckIn';
import { AttendanceWorkspace } from './components/workspace/AttendanceWorkspace';
import { CommunicationWorkspace } from './components/workspace/CommunicationWorkspace';
import { EventsWorkspace } from './components/workspace/EventsWorkspace';
import { EventProgramme } from './components/workspace/EventProgramme';
import { FilesWorkspace } from './components/workspace/FilesWorkspace';
import { GroupsWorkspace } from './components/workspace/GroupsWorkspace';
import { HistoryWorkspace } from './components/workspace/HistoryWorkspace';
import { InventoryWorkspace } from './components/workspace/InventoryWorkspace';
import { LicensingWorkspace } from './components/workspace/LicensingWorkspace';
import { MembersWorkspace } from './components/workspace/MembersWorkspace';
import { OverviewWorkspace } from './components/workspace/OverviewWorkspace';
import { OnboardingWorkspace } from './components/workspace/OnboardingWorkspace';
import { PaymentsWorkspace } from './components/workspace/PaymentsWorkspace';
import { StagePlansWorkspace } from './components/workspace/StagePlansWorkspace';
import { SocietiesWorkspace, type SocietySummary } from './components/workspace/SocietiesWorkspace';
import { ManageVacanciesWorkspace, VacanciesWorkspace } from './components/workspace/VacanciesWorkspace';
import { RepertoireWorkspace } from './components/workspace/RepertoireWorkspace';
import { PieceFiles } from './components/workspace/PieceFiles';
import { RemindersWorkspace } from './components/workspace/RemindersWorkspace';
import { apiRequest } from './api';
import type { ManagementArea } from './permissions';
import { useAuthSession } from './hooks/useAuthSession';
import { useDashboardData } from './hooks/useDashboardData';
import { useWorkspaceResource } from './hooks/useWorkspaceResource';
import { memberSections } from './musicCatalog';
import type { MeResponse, User } from './types';
import type { SocietySection, WorkspaceView } from './ui-types';

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getUserInitials(user: User | null): string {
  if (!user) {
    return 'US';
  }

  const tokens = user.name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }

  if (tokens.length === 1 && tokens[0].length >= 2) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return user.email.slice(0, 2).toUpperCase();
}

function getViewLabel(view: WorkspaceView): string {
  if (view === 'overview') {
    return t('Visão geral', 'Overview');
  }

  if (view === 'groups') {
    return t("Bandas", "Ensembles");
  }

  if (view === 'agenda') {
    return t("Agenda", "Schedule");
  }

  if (view === 'events') {
    return t("Eventos", "Events");
  }

  if (view === 'reminders') {
    return t("Lembretes", "Reminders");
  }

  if (view === 'societies') {
    return t("Sociedades musicais", "Music societies");
  }

  if (view === 'stage-plans') {
    return t("Plantas de palco", "Stage plans");
  }

  if (view === 'vacancies') {
    return t("Bolsa de músicos", "Musician vacancies");
  }

  if (view === 'manage-vacancies') {
    return t("Vagas da banda", "Ensemble vacancies");
  }

  if (view === 'payments') {
    return t("Pagamentos", "Payments");
  }

  if (view === 'inventory') {
    return t("Inventário", "Inventory");
  }

  if (view === 'communication') {
    return t("Comunicação", "Communication");
  }

  if (view === 'attendance') {
    return t("Presenças", "Attendance");
  }

  if (view === 'members') {
    return t("Membros", "Members");
  }

  if (view === 'repertoire') {
    return t("Biblioteca", "Library");
  }

  if (view === 'group-licenses' || view === 'platform-licenses') {
    return t("Licenças", "Licences");
  }

  if (view === 'history') {
    return t("Histórico", "Activity");
  }

  return t("Arquivos", "Archive");
}

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkInCode, setCheckInCode] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('check-in'));
  const [platformMode, setPlatformMode] = useState(false);
  const [activeView, setActiveView] = useState<WorkspaceView>(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    return view === 'vacancies' || view === 'group-licenses' ? view : 'overview';
  });
  const [openEventDetail, setOpenEventDetail] = useState(false);
  const [societySection, setSocietySection] = useState<SocietySection | null>(null);
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [groupsCreateModeToken, setGroupsCreateModeToken] = useState<number>(0);
  const [workspaceRenderKey, setWorkspaceRenderKey] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 860px)').matches);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileCloseButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      mobileCloseButton.current?.focus();
    }
  }, [isMobile, mobileMenuOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 860px)');
    function updateViewport() {
      setIsMobile(media.matches);
      if (!media.matches) {
        setMobileMenuOpen(false);
      }
    }
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  const auth = useAuthSession({ setError, setSuccess });
  const societies = useWorkspaceResource<{ data: SocietySummary[] }>('/societies', auth.user ? auth.token : null);
  const selectedSociety = societies.data?.data.find((entry) => entry.id === selectedSocietyId) ?? societies.data?.data[0];

  const platform = platformMode && auth.user?.is_platform_admin === true;
  const dashboard = useDashboardData({
    platform,
    token: auth.token,
    setError,
    setSuccess,
  });

  const canManageGroup = Boolean(dashboard.selectedGroup && (
    platform || dashboard.selectedGroup.owner_user_id === auth.user?.id || dashboard.selectedGroup.can_manage
  ));
  const bandInvitationPending = dashboard.selectedGroup?.membership_status === 'invited';

  function canManageArea(area: ManagementArea): boolean {
    return canManageGroup || dashboard.selectedGroup?.management_permissions?.includes(area) === true;
  }

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const nextWeekTime = nowTime + 7 * 24 * 60 * 60 * 1000;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let upcomingEvents = 0;
    let eventsThisMonth = 0;

    dashboard.events.forEach((eventItem) => {
      const startsAt = new Date(eventItem.starts_at);
      const startsAtTime = startsAt.getTime();

      if (Number.isNaN(startsAtTime)) {
        return;
      }

      if (startsAtTime >= nowTime && startsAtTime <= nextWeekTime) {
        upcomingEvents += 1;
      }

      if (startsAt.getMonth() === currentMonth && startsAt.getFullYear() === currentYear) {
        eventsThisMonth += 1;
      }
    });

    const activeMembers = dashboard.members.filter((member) => member.status === 'active').length;
    const invitedMembers = dashboard.members.filter((member) => member.status === 'invited').length;

    return {
      totalGroups: dashboard.groupsCount,
      totalMembers: dashboard.members.length,
      activeMembers,
      invitedMembers,
      totalEvents: dashboard.events.length,
      upcomingEvents,
      eventsThisMonth,
      totalRepertoirePieces: dashboard.pieces.length,
      totalFiles: dashboard.assets.length + dashboard.documents.length,
    };
  }, [
    dashboard.assets.length,
    dashboard.documents.length,
    dashboard.events,
    dashboard.groupsCount,
    dashboard.members,
    dashboard.pieces.length,
  ]);

  const dashboardTimeline = useMemo(() => {
    const typeLabels: Record<string, string> = {
      rehearsal: t("Ensaio", "Rehearsal"),
      concert: t("Concerto", "Concert"),
      activity: t("Atividade", "Activity"),
      meeting: t("Reuniao", "Meeting"),
      internal: t("Interno", "Internal"),
    };

    const nowTime = Date.now();

    const sortedByStart = [...dashboard.events].sort(
      (first, second) =>
        new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime()
    );

    const upcomingEvents = sortedByStart
      .filter((eventItem) => new Date(eventItem.starts_at).getTime() >= nowTime)
      .slice(0, 5)
      .map((eventItem) => ({
        id: eventItem.id,
        title: eventItem.title,
        type: typeLabels[eventItem.event_type] ?? eventItem.event_type,
        status: eventItem.status,
        when: formatDateTime(eventItem.starts_at),
        location: eventItem.location ?? '',
      }));

    const activityRows = [...dashboard.events]
      .sort(
        (first, second) =>
          new Date(second.starts_at).getTime() - new Date(first.starts_at).getTime()
      )
      .slice(0, 8)
      .map((eventItem) => ({
        id: eventItem.id,
        event: eventItem.title,
        type: typeLabels[eventItem.event_type] ?? eventItem.event_type,
        status: eventItem.status,
        when: formatDateTime(eventItem.starts_at),
      }));

    return {
      upcomingEvents,
      activityRows,
    };
  }, [dashboard.events]);

  function handleMenuViewChange(view: WorkspaceView, section: SocietySection | null = null) {
    setMobileMenuOpen(false);
    setOpenEventDetail(false);
    setGroupsCreateModeToken(0);
    setActiveView(view);
    if (view === 'societies') {
      setSocietySection(section);
      if (isMobile) requestAnimationFrame(() => menuButton.current?.focus());
    }
    setWorkspaceRenderKey((previous) => previous + 1);
    window.scrollTo({ top: 0 });
  }

  function openEvent(eventId: number) {
    dashboard.setSelectedEventId(eventId);
    handleMenuViewChange('events');
    setOpenEventDetail(true);
  }

  function openCreateGroup() {
    setMobileMenuOpen(false);
    setActiveView('groups');
    setWorkspaceRenderKey((previous) => previous + 1);
    setGroupsCreateModeToken((previous) => previous + 1);
  }

  function handlePlatformModeChange() {
    setPlatformMode(!platform);
    setGroupsCreateModeToken(0);
    setError(null);
    setSuccess(null);
    handleMenuViewChange(platform ? 'overview' : 'groups');
  }

  if (auth.loadingSession) {
    return (
      <main className="page reserved-sign-in reserved-sign-in-loading">
        <section className="card card-narrow loading-shell" role="status">
          <h1>GesBanda</h1>
          <p>{t("A validar sessao...", "Checking your session…")}</p>
        </section>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <main className="page reserved-sign-in">
        <aside className="reserved-sign-in-intro">
          <a href={`?lang=${language}`} className="reserved-sign-in-brand">GesBanda</a>
          <h2>{t('Organiza a tua formação.', 'Organise your ensemble.')}</h2>
          <p>{t('Planeia os próximos ensaios, acompanha os músicos e reúne o repertório num só espaço.', 'Plan rehearsals, keep in touch with musicians, and keep scores in one place.')}</p>
        </aside>
        <section className="card card-narrow app-shell">
          <h1>{auth.mode === 'register' ? t('Criar conta', 'Create account') : t('Entrar no GesBanda', 'Sign in to GesBanda')}</h1>
          <nav className="summary-row" aria-label={t('Idioma e site institucional', 'Language and website')}>
            <a href={`?lang=${language}`}>{t('Sobre o GesBanda', 'About GesBanda')}</a>
            <a href={languageUrl('pt')} lang="pt-PT" aria-current={language === 'pt' ? 'page' : undefined}>PT</a>
            <a href={languageUrl('en')} lang="en" aria-current={language === 'en' ? 'page' : undefined}>EN</a>
          </nav>
          <p className="subtitle">{t("Gestao colaborativa de agrupamentos musicais.", "A shared workspace for musical ensembles.")}</p>

          <Alerts error={error} success={success} />

          <AuthForms
            mode={auth.mode}
            submitting={auth.submitting}
            loginForm={auth.loginForm}
            registerForm={auth.registerForm}
            setMode={auth.setMode}
            setLoginForm={auth.setLoginForm}
            setRegisterForm={auth.setRegisterForm}
            onLoginSubmit={auth.handleLoginSubmit}
            onRegisterSubmit={auth.handleRegisterSubmit}
          />
          <nav className="summary-row workspace-auth-legal" aria-label={t('Políticas do GesBanda', 'GesBanda policies')}>
            <a href={legalUrl('terms', language)} target="_blank" rel="noreferrer">{t('Termos', 'Terms')}</a>
            <a href={legalUrl('privacy', language)} target="_blank" rel="noreferrer">{t('Privacidade', 'Privacy')}</a>
            <a href={legalUrl('contact', language)} target="_blank" rel="noreferrer">{t('Apoio', 'Support')}</a>
          </nav>
        </section>
      </main>
    );
  }

  return (
    <main className={`dashboard-app${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileMenuOpen ? ' mobile-menu-open' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileMenuOpen) {
          setMobileMenuOpen(false);
          menuButton.current?.focus();
        }
      }}>
      <a className="workspace-skip" href="#workspace-content">{t('Saltar para o conteúdo', 'Skip to content')}</a>
      {mobileMenuOpen ? <button className="reserved-overlay" type="button" tabIndex={-1}
        aria-label={t('Fechar menu', 'Close menu')} onClick={() => {
          setMobileMenuOpen(false);
          menuButton.current?.focus();
        }} /> : null}
      <aside className="dashboard-sidebar">
        <div className="reserved-mobile-close">
          <button ref={mobileCloseButton} className="reserved-nav-icon" type="button" aria-label={t('Fechar menu', 'Close menu')} onClick={() => {
            setMobileMenuOpen(false);
            menuButton.current?.focus();
          }}><UiIcon name="x" /></button>
        </div>
        <SideNav
          activeView={activeView}
          societySection={societySection}
          hasSociety={selectedSociety !== undefined}
          societyCanManage={selectedSociety?.can_manage === true}
          onChangeSocietySection={(section) => handleMenuViewChange('societies', section)}
          platform={platform}
          canManageLicences={canManageArea('licences')}
          canManageInventory={canManageArea('inventory')}
          canManageVacancies={canManageArea('vacancies')}
          onChangeView={handleMenuViewChange}
          bandSwitcher={(
              <BandSwitcher
                groups={dashboard.groups}
                selectedGroup={dashboard.selectedGroup}
                loading={dashboard.loadingGroups}
                onSelect={(groupId) => {
                  dashboard.setSelectedGroupId(groupId);
                  setError(null);
                  if (isMobile) {
                    setMobileMenuOpen(false);
                    requestAnimationFrame(() => menuButton.current?.focus());
                  }
                  setSuccess(null);
                }}
                onCreate={openCreateGroup}
              />
          )}
        />
      </aside>

      <section className="dashboard-main" inert={isMobile && mobileMenuOpen}>
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button ref={menuButton} className="icon-btn icon-only" type="button" aria-controls="workspace-nav"
              aria-expanded={isMobile ? mobileMenuOpen : !isSidebarCollapsed}
              aria-label={(isMobile ? mobileMenuOpen : !isSidebarCollapsed) ? t('Fechar menu', 'Close menu') : t('Abrir menu', 'Open menu')}
              onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <UiIcon name="menu" />
            </button>
            <div className="workspace-location">
              <span>{platform ? t('Plataforma GesBanda', 'GesBanda platform') : dashboard.selectedGroup?.name ?? 'GesBanda'}</span>
              <strong>{getViewLabel(activeView)}</strong>
            </div>
          </div>

          <div className="topbar-right">
            {auth.user.is_platform_admin ? (
              <button className="ghost icon-action workspace-admin-toggle" type="button" onClick={handlePlatformModeChange}
                aria-label={platform ? t('Voltar às minhas bandas', 'Back to my ensembles') : t('Administração da plataforma', 'Platform administration')}>
                <UiIcon name="settings" />
                <span>{platform ? t('Minhas bandas', 'My ensembles') : t('Administração', 'Administration')}</span>
              </button>
            ) : null}
            <button className="icon-btn icon-only" type="button" aria-label={t('Agenda', 'Schedule')}
              aria-current={activeView === 'agenda' ? 'page' : undefined}
              title={t('Agenda', 'Schedule')} onClick={() => handleMenuViewChange('agenda')}>
              <UiIcon name="agenda" />
            </button>
            <button className="icon-btn icon-only" type="button" aria-label={t('Lembretes', 'Reminders')}
              title={t('Lembretes', 'Reminders')} onClick={() => handleMenuViewChange('reminders')}>
              <UiIcon name="bell" />
            </button>
            <details className="workspace-account">
              <summary aria-label={t('Menu da conta', 'Account menu')}><span className="user-chip">{getUserInitials(auth.user)}</span></summary>
              <div className="workspace-account-menu">
                <div><strong>{auth.user.name}</strong><small>{auth.user.email}</small></div>
                <a href={languageUrl(language === 'pt' ? 'en' : 'pt')} lang={language === 'pt' ? 'en' : 'pt-PT'}>{language === 'pt' ? 'English' : 'Português'}</a>
                <a href={`?lang=${language}`}>{t('Site institucional', 'GesBanda website')}</a>
                <a href={legalUrl('contact', language)}>{t('Apoio e reclamações', 'Support and complaints')}</a>
                <button type="button" className="ghost icon-action" onClick={() => {
                  setPlatformMode(false);
                  handleMenuViewChange('overview');
                  void auth.handleLogout();
                }}>
                  <UiIcon name="logout" />
                  {t('Terminar sessão', 'Sign out')}
                </button>
              </div>
            </details>
          </div>
        </header>

        <section className="dashboard-content" id="workspace-content" tabIndex={-1}>
          <Alerts error={error} success={success} />
          {bandInvitationPending && dashboard.selectedGroup && auth.token ? (
            <article className="workspace-card">
              <p>{t(`Tens um convite para ${dashboard.selectedGroup.name}.`, `You have an invitation to ${dashboard.selectedGroup.name}.`)}</p>
              <div className="summary-row">
                <button type="button" className="workspace-primary" disabled={acceptingInvitation} onClick={async () => {
                  const groupId = dashboard.selectedGroupId;
                  if (!groupId || !auth.token) return;
                  setAcceptingInvitation(true);
                  setError(null);
                  try {
                    await apiRequest(`/groups/${groupId}/accept-invitation`, { method: 'POST' }, auth.token);
                    await dashboard.handleRefreshGroups();
                    setSuccess(t('Convite aceite.', 'Invitation accepted.'));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : t('Não foi possível aceitar o convite.', 'Could not accept the invitation.'));
                  } finally {
                    setAcceptingInvitation(false);
                  }
                }}>{t('Aceitar convite', 'Accept invitation')}</button>
              </div>
            </article>
          ) : null}
          {checkInCode && auth.token ? <QrAttendance token={auth.token} code={checkInCode} onClose={() => {
            setCheckInCode(null);
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }} /> : null}

          {activeView === 'overview' && auth.token && auth.user.onboarding_completed_at === null && !dashboard.loadingGroups ? (
            <OnboardingWorkspace
              user={auth.user}
              hasGroups={dashboard.groups.length > 0}
              onCreateGroup={(name, groupType) => dashboard.handleQuickCreateGroup({ name, groupType })}
              onFinish={async (instruments) => {
                const result = await apiRequest<MeResponse>('/auth/onboarding', {
                  method: 'PUT',
                  body: JSON.stringify(instruments ? { instruments } : {}),
                }, auth.token ?? undefined);
                auth.setUser(result.user);
              }}
              onNavigate={handleMenuViewChange}
            />
          ) : activeView === 'overview' ? (
            <OverviewWorkspace
              key={`overview-${workspaceRenderKey}`}
              selectedGroupName={dashboard.selectedGroup?.name ?? null}
              metrics={dashboardMetrics}
              upcomingEvents={dashboardTimeline.upcomingEvents}
              activityRows={dashboardTimeline.activityRows}
              onNavigate={handleMenuViewChange}
              onOpenEvent={openEvent}
              onCreateGroup={openCreateGroup}
            />
          ) : null}

          {activeView === 'agenda' && !bandInvitationPending ? (
            <AgendaWorkspace
              key={`agenda-${workspaceRenderKey}`}
              groups={dashboard.groups}
              selectedGroupId={dashboard.selectedGroupId}
              setSelectedGroupId={dashboard.setSelectedGroupId}
              events={dashboard.events}
              loadingEvents={dashboard.loadingEvents}
              onRefresh={dashboard.handleRefreshGroupContext}
              onOpenEvent={openEvent}
              onGoToEvents={() => setActiveView('events')}
            />
          ) : null}

          {activeView === 'groups' ? (
            <GroupsWorkspace
              key={`groups-${workspaceRenderKey}`}
              platform={platform}
              canManageGroup={canManageGroup}
              onOpenLicenses={() => handleMenuViewChange('group-licenses')}
              groups={dashboard.groups}
              selectedGroupId={dashboard.selectedGroupId}
              selectedGroup={dashboard.selectedGroup}
              loadingGroups={dashboard.loadingGroups}
              submittingGroup={dashboard.submittingGroup}
              updatingGroup={dashboard.updatingGroup}
              deletingGroup={dashboard.deletingGroup}
              groupForm={dashboard.groupForm}
              groupEditForm={dashboard.groupEditForm}
              setSelectedGroupId={dashboard.setSelectedGroupId}
              setGroupForm={dashboard.setGroupForm}
              setGroupEditForm={dashboard.setGroupEditForm}
              createModeToken={groupsCreateModeToken}
              onRefresh={dashboard.handleRefreshGroups}
              onCreateSubmit={dashboard.handleCreateGroupSubmit}
              onUpdateSubmit={dashboard.handleUpdateGroupSubmit}
              onDeleteSelected={dashboard.handleDeleteSelectedGroup}
            />
          ) : null}

          {activeView === 'group-licenses' && auth.token && dashboard.selectedGroup && canManageArea('licences') ? (
            <LicensingWorkspace
              key={`group-licenses-${dashboard.selectedGroup.id}-${workspaceRenderKey}`}
              token={auth.token}
              group={dashboard.selectedGroup}
              formatDateTime={formatDateTime}
              onLicenseChange={dashboard.handleRefreshGroups}
            />
          ) : null}
          {activeView === 'group-licenses' && !canManageArea('licences') ? (
            <p className="workspace-card">{t("Seleciona uma banda que possas gerir para consultar as licenças.", "Select an ensemble you can manage to view licences.")}</p>
          ) : null}
          {platform && activeView === 'platform-licenses' && auth.token ? (
            <LicensingWorkspace
              key={`platform-licenses-${workspaceRenderKey}`}
              token={auth.token}
              formatDateTime={formatDateTime}
              onLicenseChange={dashboard.handleRefreshGroups}
            />
          ) : null}
          {platform && activeView === 'history' && auth.token ? (
            <HistoryWorkspace token={auth.token} groups={dashboard.groups} formatDateTime={formatDateTime} />
          ) : null}

          {activeView === 'reminders' && auth.token ? (
            <RemindersWorkspace token={auth.token} formatDateTime={formatDateTime} onOpenGroup={(groupId) => {
              dashboard.setSelectedGroupId(groupId);
              handleMenuViewChange('events');
            }} />
          ) : null}

          {activeView === 'societies' && auth.token ? (
            <SocietiesWorkspace token={auth.token} section={societySection} societies={societies.data?.data ?? []} current={selectedSociety}
              loading={societies.loading} saving={societies.saving} error={societies.error}
              onSelect={(id) => {
                setSelectedSocietyId(id);
                setSocietySection(null);
              }}
              onCreate={(input) => societies.save('/societies', 'POST', input)}
              onChange={societies.refresh} />
          ) : null}

          {activeView === 'vacancies' && auth.token ? <VacanciesWorkspace token={auth.token} /> : null}

          {activeView === 'manage-vacancies' && auth.token && dashboard.selectedGroup && canManageArea('vacancies') ? (
            <ManageVacanciesWorkspace key={dashboard.selectedGroup.id} token={auth.token} group={dashboard.selectedGroup} events={dashboard.events} />
          ) : null}

          {activeView === 'payments' && auth.token && !bandInvitationPending ? (
            <PaymentsWorkspace key={dashboard.selectedGroupId} token={auth.token} events={dashboard.events} canManage={canManageArea('payments')} formatDateTime={formatDateTime} />
          ) : null}

          {activeView === 'stage-plans' && auth.token && dashboard.selectedGroup && !bandInvitationPending ? (
            <StagePlansWorkspace key={dashboard.selectedGroup.id} token={auth.token} group={dashboard.selectedGroup}
              members={dashboard.members} events={dashboard.events} canManage={canManageArea('stage')} />
          ) : null}
          {activeView === 'stage-plans' && !dashboard.selectedGroup ? (
            <p className="workspace-card">{t('Seleciona uma banda para consultar as plantas de palco.', 'Select an ensemble to view stage plans.')}</p>
          ) : null}

          {activeView === 'inventory' && auth.token && !bandInvitationPending ? (
            dashboard.selectedGroup && canManageArea('inventory') ? (
              <InventoryWorkspace key={dashboard.selectedGroup.id} token={auth.token} group={dashboard.selectedGroup} formatDateTime={formatDateTime} />
            ) : <p className="workspace-card">{t("Seleciona uma banda que possas gerir para consultar o inventário.", "Select an ensemble you can manage to view inventory.")}</p>
          ) : null}

          {activeView === 'communication' && auth.token && !bandInvitationPending ? (
            dashboard.selectedGroup ? (
              <CommunicationWorkspace
                key={dashboard.selectedGroup.id}
                token={auth.token}
                group={dashboard.selectedGroup}
                canManage={canManageArea('communication')}
                formatDateTime={formatDateTime}
              />
            ) : <p className="workspace-card">{t("Seleciona uma banda para consultar os avisos e inquéritos.", "Select an ensemble to view announcements and polls.")}</p>
          ) : null}

          {activeView === 'attendance' && auth.token && !bandInvitationPending ? (
            dashboard.selectedGroup ? (
              <AttendanceWorkspace
                key={dashboard.selectedGroup.id}
                token={auth.token}
                group={dashboard.selectedGroup}
                events={dashboard.events}
                members={dashboard.members}
                canManage={canManageArea('attendance')}
                formatDateTime={formatDateTime}
              />
            ) : <p className="workspace-card">{t("Seleciona uma banda para consultar as presenças.", "Select an ensemble to view attendance.")}</p>
          ) : null}

          {activeView === 'events' && !bandInvitationPending ? (
            <EventsWorkspace
              key={`events-${workspaceRenderKey}`}
              repertoire={auth.token && dashboard.selectedEvent && dashboard.selectedGroupId ? (
                <EventProgramme key={dashboard.selectedEvent.id} token={auth.token} groupId={dashboard.selectedGroupId}
                  eventId={dashboard.selectedEvent.id} pieces={dashboard.eventPieces} assets={dashboard.assets}
                  loadingPieces={dashboard.loadingEventPieces} loadingAssets={dashboard.loadingAssets} />
              ) : null}
              canManage={canManageArea('events')}
              openDetail={openEventDetail}
              sections={[...new Set(dashboard.members.flatMap(memberSections))].sort()}
              groups={dashboard.groups}
              selectedGroupId={dashboard.selectedGroupId}
              setSelectedGroupId={dashboard.setSelectedGroupId}
              events={dashboard.events}
              selectedEvent={dashboard.selectedEvent}
              selectedEventId={dashboard.selectedEventId}
              setSelectedEventId={dashboard.setSelectedEventId}
              formatDateTime={formatDateTime}
              loadingEvents={dashboard.loadingEvents}
              loadingSummary={dashboard.loadingSummary}
              submittingRsvpId={dashboard.submittingRsvpId}
              rsvpSummary={dashboard.rsvpSummary}
              eventForm={dashboard.eventForm}
              eventEditForm={dashboard.eventEditForm}
              submittingEvent={dashboard.submittingEvent}
              updatingEvent={dashboard.updatingEvent}
              deletingEvent={dashboard.deletingEvent}
              setEventForm={dashboard.setEventForm}
              setEventEditForm={dashboard.setEventEditForm}
              onRefresh={dashboard.handleRefreshGroupContext}
              onCreateSubmit={dashboard.handleCreateEventSubmit}
              onUpdateSubmit={dashboard.handleUpdateEventSubmit}
              onDeleteSelected={dashboard.handleDeleteSelectedEvent}
              onRsvp={dashboard.handleRsvp}
            />
          ) : null}

          {activeView === 'members' && !bandInvitationPending ? (
            <MembersWorkspace
              key={`members-${workspaceRenderKey}`}
              selectedGroupId={dashboard.selectedGroupId}
              selectedGroupOwnerId={dashboard.selectedGroup?.owner_user_id}
              canManage={canManageArea('members')}
              canManageRoles={canManageGroup}
              canChangePermissions={platform || dashboard.selectedGroup?.owner_user_id === auth.user.id}
              memberFields={dashboard.selectedGroup?.member_fields ?? []}
              onSaveFields={async (memberFields) => {
                if (!auth.token || !dashboard.selectedGroupId) return false;
                try {
                  await apiRequest(`/groups/${dashboard.selectedGroupId}/member-fields`, { method: 'PUT', body: JSON.stringify({ member_fields: memberFields }) }, auth.token);
                  await dashboard.handleRefreshGroups();
                  return true;
                } catch (err) {
                  setError(err instanceof Error ? err.message : t("Não foi possível guardar os campos.", "Could not save the fields."));
                  return false;
                }
              }}
              members={dashboard.members}
              memberForm={dashboard.memberForm}
              loadingMembers={dashboard.loadingMembers}
              submittingMember={dashboard.submittingMember}
              updatingMember={dashboard.updatingMember}
              setMemberForm={dashboard.setMemberForm}
              onRefresh={() =>
                auth.token &&
                dashboard.selectedGroupId &&
                dashboard.loadMembers(auth.token, dashboard.selectedGroupId)
              }
              onInviteSubmit={dashboard.handleInviteMemberSubmit}
              onUpdateMember={dashboard.handleUpdateMember}
              onRemoveMember={dashboard.handleRemoveMember}
            />
          ) : null}

          {activeView === 'repertoire' && !bandInvitationPending ? (
            <RepertoireWorkspace
              key={`repertoire-${workspaceRenderKey}-${dashboard.selectedGroupId}`}
              renderPieceFiles={(pieceId) => {
                const groupId = dashboard.selectedGroupId;
                const token = auth.token;
                return groupId && token ? (
                  <PieceFiles key={pieceId} pieceId={pieceId} groupId={groupId} token={token}
                    canManage={canManageArea('files')} loading={dashboard.loadingAssets}
                    assets={dashboard.assets} members={dashboard.members}
                    onRefresh={() => dashboard.loadAssets(token, groupId)} />
                ) : null;
              }}
              canManage={canManageArea('repertoire')}
              selectedGroupId={dashboard.selectedGroupId}
              selectedEventId={dashboard.selectedEventId}
              pieces={dashboard.pieces}
              eventPieces={dashboard.eventPieces}
              pieceForm={dashboard.pieceForm}
              eventPieceForm={dashboard.eventPieceForm}
              loadingPieces={dashboard.loadingPieces}
              loadingEventPieces={dashboard.loadingEventPieces}
              submittingPiece={dashboard.submittingPiece}
              submittingEventPiece={dashboard.submittingEventPiece}
              setPieceForm={dashboard.setPieceForm}
              setEventPieceForm={dashboard.setEventPieceForm}
              onRefresh={() =>
                auth.token &&
                dashboard.selectedGroupId &&
                dashboard.loadPieces(auth.token, dashboard.selectedGroupId)
              }
              onCreatePiece={dashboard.handleCreatePieceSubmit}
              onDeletePiece={dashboard.handleDeletePiece}
              onAttachPiece={dashboard.handleAttachPieceSubmit}
              onDetachPiece={dashboard.handleDetachPiece}
            />
          ) : null}

          {activeView === 'files' && !bandInvitationPending ? (
            <FilesWorkspace
              token={auth.token}
              key={`files-${workspaceRenderKey}-${dashboard.selectedGroupId}`}
              canManage={canManageArea('files')}
              selectedGroupId={dashboard.selectedGroupId}
              assets={dashboard.assets}
              documents={dashboard.documents}
              events={dashboard.events}
              pieces={dashboard.pieces}
              assetForm={dashboard.assetForm}
              documentForm={dashboard.documentForm}
              submittingAsset={dashboard.submittingAsset}
              submittingDocument={dashboard.submittingDocument}
              loadingAssets={dashboard.loadingAssets}
              loadingDocuments={dashboard.loadingDocuments}
              setAssetForm={dashboard.setAssetForm}
              setDocumentForm={dashboard.setDocumentForm}
              onRefresh={dashboard.handleRefreshGroupContext}
              onUploadAsset={dashboard.handleUploadAssetSubmit}
              onUploadDocument={dashboard.handleUploadDocumentSubmit}
              onDeleteFile={dashboard.handleDeleteFile}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}
