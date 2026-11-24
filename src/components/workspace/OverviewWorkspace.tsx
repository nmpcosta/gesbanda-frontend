
import { t } from '../../language';
import { UiIcon, type UiIconName } from '../common/UiIcon';
import type { WorkspaceView } from '../../ui-types';

type DashboardMetrics = {
  totalGroups: number;
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  eventsThisMonth: number;
  totalRepertoirePieces: number;
  totalFiles: number;
};

type EventHighlight = {
  id: number;
  title: string;
  type: string;
  status: string;
  when: string;
  location: string;
};

type ActivityRow = {
  id: number;
  event: string;
  type: string;
  status: string;
  when: string;
};

type OverviewWorkspaceProps = {
  selectedGroupName: string | null;
  metrics: DashboardMetrics;
  upcomingEvents: EventHighlight[];
  activityRows: ActivityRow[];
  onNavigate: (view: WorkspaceView) => void;
  onOpenEvent: (eventId: number) => void;
  onCreateGroup: () => void;
};

const statusLabels: Record<string, string> = {
  published: t('Publicado', 'Published'),
  draft: t('Rascunho', 'Draft'),
  cancelled: t('Cancelado', 'Cancelled'),
  completed: t('Concluído', 'Completed'),
};

export function OverviewWorkspace({
  selectedGroupName,
  metrics,
  upcomingEvents,
  activityRows,
  onNavigate,
  onOpenEvent,
  onCreateGroup,
}: OverviewWorkspaceProps) {
  const nextEvent = upcomingEvents[0];
  const indicators: { label: string; value: number; note: string; icon: UiIconName; view: WorkspaceView }[] = [
    {
      label: t('Eventos este mês', 'Events this month'),
      value: metrics.eventsThisMonth,
      note: t(`${metrics.upcomingEvents} nos próximos 7 dias`, `${metrics.upcomingEvents} in the next 7 days`),
      icon: 'agenda',
      view: 'agenda',
    },
    {
      label: t('Membros ativos', 'Active members'),
      value: metrics.activeMembers,
      note: t(`${metrics.totalMembers} no total`, `${metrics.totalMembers} in total`),
      icon: 'members',
      view: 'members',
    },
    {
      label: t('Peças no repertório', 'Pieces in the repertoire'),
      value: metrics.totalRepertoirePieces,
      note: t('Consultar biblioteca', 'View the library'),
      icon: 'repertoire',
      view: 'repertoire',
    },
    {
      label: t('Ficheiros', 'Files'),
      value: metrics.totalFiles,
      note: t('Documentos e anexos', 'Documents and attachments'),
      icon: 'files',
      view: 'files',
    },
  ];

  return (
    <section className="workspace-panel reserved-overview">
      <header className="reserved-hero">
        <div>
          <p>{selectedGroupName ? t('Visão geral', 'Overview') : 'GesBanda'}</p>
          <h1>{selectedGroupName ?? t('Cria a tua primeira formação', 'Create your first ensemble')}</h1>
          <p>{selectedGroupName
            ? t('Consulta o próximo evento, a equipa e o repertório da tua formação.', 'See what is next for your ensemble and keep track of its members and repertoire.')
            : t('Adiciona uma banda, um coro ou uma orquestra para começares a organizar os teus eventos.', 'Add a band, choir or orchestra to start organising your events.')}</p>
          {selectedGroupName ? (
            <button type="button" className="icon-action reserved-hero-button" onClick={() => onNavigate('agenda')}>
              <UiIcon name="agenda" size={18} />{t('Abrir agenda', 'Open schedule')}
            </button>
          ) : (
            <button type="button" className="icon-action reserved-hero-button" onClick={onCreateGroup}>
              <UiIcon name="plus" size={18} />{t('Nova banda', 'New ensemble')}
            </button>
          )}
        </div>
        {nextEvent ? (
          <div className="reserved-next-event">
            <span>{t('Próximo evento', 'Next event')}</span>
            <strong>{nextEvent.title}</strong>
            <p>{nextEvent.type} · {nextEvent.when}</p>
            {nextEvent.location ? <p>{nextEvent.location}</p> : null}
            <button type="button" className="ghost" onClick={() => onOpenEvent(nextEvent.id)}>{t('Ver evento', 'View event')}</button>
          </div>
        ) : null}
      </header>

      {selectedGroupName ? (
        <>
          <div className="reserved-indicators">
            {indicators.map((indicator) => (
              <button type="button" className="reserved-indicator" key={indicator.view} onClick={() => onNavigate(indicator.view)}>
                <span className="reserved-indicator-icon"><UiIcon name={indicator.icon} size={19} /></span>
                <span className="reserved-indicator-label">{indicator.label}</span>
                <strong>{indicator.value}</strong>
                <small>{indicator.note}</small>
              </button>
            ))}
          </div>

          <div className="reserved-overview-columns">
            <article className="workspace-card">
              <div className="listing-head">
                <h2>{t('Próximos eventos', 'Upcoming events')}</h2>
                <button type="button" className="ghost" onClick={() => onNavigate('events')}>{t('Ver todos', 'View all')}</button>
              </div>
              {upcomingEvents.length ? (
                <ul className="reserved-event-list">
                  {upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <button type="button" onClick={() => onOpenEvent(event.id)}>
                        <span className="reserved-indicator-icon"><UiIcon name="events" size={18} /></span>
                        <span><strong>{event.title}</strong><small>{event.when}{event.location ? ` · ${event.location}` : ''}</small></span>
                        <span className="status-chip mute">{event.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">{t('Ainda não há eventos futuros na agenda.', 'There are no upcoming events.')}</p>}
            </article>

            <article className="workspace-card">
              <div className="listing-head"><h2>{t('Acessos rápidos', 'Quick links')}</h2></div>
              <div className="reserved-shortcuts">
                <button type="button" className="ghost icon-action" onClick={() => onNavigate('attendance')}><UiIcon name="check" />{t('Chamada e presenças', 'Check-in and attendance')}</button>
                <button type="button" className="ghost icon-action" onClick={() => onNavigate('communication')}><UiIcon name="bell" />{t('Avisos e inquéritos', 'Announcements and polls')}</button>
                <button type="button" className="ghost icon-action" onClick={() => onNavigate('members')}><UiIcon name="members" />{metrics.invitedMembers
                  ? t(`Membros · ${metrics.invitedMembers} por ativar`, `Members · ${metrics.invitedMembers} pending`)
                  : t('Membros', 'Members')}</button>
              </div>
            </article>
          </div>

          {activityRows.length ? (
            <article className="workspace-card">
              <div className="listing-head"><h2>{t('Eventos recentes', 'Recent events')}</h2></div>
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead><tr><th>{t('Evento', 'Event')}</th><th>{t('Tipo', 'Type')}</th><th>{t('Data', 'Date')}</th><th>{t('Estado', 'Status')}</th></tr></thead>
                  <tbody>{activityRows.slice(0, 5).map((event) => (
                    <tr key={event.id}>
                      <td><button className="tiny ghost" type="button" onClick={() => onOpenEvent(event.id)}>{event.event}</button></td>
                      <td>{event.type}</td><td>{event.when}</td>
                      <td><span className={`status-chip ${event.status === 'cancelled' ? 'warn' : 'mute'}`}>{statusLabels[event.status] ?? event.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </article>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
