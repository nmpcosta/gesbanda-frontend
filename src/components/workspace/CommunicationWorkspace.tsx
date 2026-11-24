import { t } from '../../language';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import type { GroupSummary } from '../../types';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type Announcement = {
  id: number;
  title: string;
  body: string;
  section: string | null;
  is_pinned: boolean;
  published_at: string;
  author: { name: string } | null;
  comments: { id: number; body: string; user: { name: string } | null }[];
};

type Poll = {
  id: number;
  title: string;
  section: string | null;
  ends_at: string | null;
  is_active: boolean;
  questions: {
    id: number;
    prompt: string;
    options: { id: number; label: string; responses_count: number }[];
    responses: { poll_option_id: number }[];
  }[];
};

type CommunicationResponse = {
  announcements: Paginated<Announcement>;
  polls: Paginated<Poll>;
  sections: string[];
};

type CommunicationWorkspaceProps = {
  group: GroupSummary;
  token: string;
  canManage: boolean;
  formatDateTime: (value: string) => string;
};

export function CommunicationWorkspace({ group, token, canManage, formatDateTime }: CommunicationWorkspaceProps) {
  const [tab, setTab] = useState<'announcements' | 'polls'>('announcements');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const path = `/groups/${group.id}`;
  const { data, loading, saving, error, save } = useWorkspaceResource<CommunicationResponse>(
    `${path}/communication?${tab}_page=${page}`, token
  );
  const disabled = loading || saving;

  function changeTab(nextTab: typeof tab) {
    setTab(nextTab);
    setPage(1);
    setShowForm(false);
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const section = form.get('section') || null;
    const title = form.get('title');
    const input = tab === 'announcements' ? {
      title,
      section,
      body: form.get('body'),
      is_pinned: form.has('pinned'),
    } : {
      title,
      section,
      ends_at: form.get('ends_at') ? new Date(String(form.get('ends_at'))).toISOString() : null,
      questions: form.getAll('question').map((prompt, index) => ({
        prompt,
        options: String(form.getAll('options')[index]).split('\n').map((option) => option.trim()).filter(Boolean),
      })),
    };

    if (await save(`${path}/${tab}`, 'POST', input)) {
      setShowForm(false);
      setPage(1);
      setQuestionCount(1);
    }
  }

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div><h2>{t("Comunicação", "Communication")}</h2><p className="subtitle">{group.name}</p></div>
        <div className="summary-row">
          <button type="button" className="ghost" aria-pressed={tab === 'announcements'} onClick={() => changeTab('announcements')}>{t("Avisos", "Announcements")}</button>
          <button type="button" className="ghost" aria-pressed={tab === 'polls'} onClick={() => changeTab('polls')}>{t("Inquéritos", "Polls")}</button>
          {canManage ? <button type="button" onClick={() => setShowForm(!showForm)}>{showForm ? t("Fechar formulário", "Close form") : tab === 'announcements' ? t("Novo aviso", "New announcement") : t("Novo inquérito", "New poll")}</button> : null}
        </div>
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar...", "Loading…")}</p> : null}
      {showForm && canManage ? (
        <article className="workspace-card">
          <form className="form" onSubmit={publish}>
            <label>{t("Título", "Title")}<input name="title" maxLength={255} required /></label>
            <label>{t("Destinatários", "Audience")}
              <select name="section">
                <option value="">{t("Toda a banda", "Whole ensemble")}</option>
                {data?.sections.map((section) => <option key={section}>{section}</option>)}
              </select>
            </label>
            {tab === 'announcements' ? (
              <>
                <label>{t("Mensagem", "Message")}<textarea name="body" rows={5} maxLength={10000} required /></label>
                <label className="checkbox-row"><input type="checkbox" name="pinned" />{t("Fixar aviso", "Pin announcement")}</label>
              </>
            ) : (
              <>
                {Array.from({ length: questionCount }, (_, index) => (
                  <fieldset key={index}>
                    <legend>{t("Pergunta", "Question")} {index + 1}</legend>
                    <label>{t("Pergunta", "Question")}<input name="question" maxLength={500} required /></label>
                    <label>{t("Opções de resposta, uma por linha", "Answer options, one per line")}<textarea name="options" rows={3} required /></label>
                  </fieldset>
                ))}
                <div className="summary-row">
                  <button type="button" className="ghost" disabled={questionCount >= 10} onClick={() => setQuestionCount(questionCount + 1)}>{t("Adicionar pergunta", "Add question")}</button>
                  {questionCount > 1 ? <button type="button" className="ghost" onClick={() => setQuestionCount(questionCount - 1)}>{t("Remover última pergunta", "Remove last question")}</button> : null}
                </div>
                <label>{t("Data de fecho", "Closing date")}<input name="ends_at" type="datetime-local" /></label>
              </>
            )}
            <button type="submit" disabled={disabled}>{t("Publicar", "Publish")}</button>
          </form>
        </article>
      ) : null}
      {data && tab === 'announcements' ? (
        <>
          {!loading && data.announcements.data.length === 0 ? <p className="workspace-card">{t("Ainda não há avisos.", "There are no announcements yet.")}</p> : null}
          {data.announcements.data.map((announcement) => (
            <article className="workspace-card detail-list" key={announcement.id}>
              <header className="listing-head">
                <div>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.section ?? 'Toda a banda'} · {formatDateTime(announcement.published_at)}{announcement.author ? ` · ${announcement.author.name}` : ''}</p>
                </div>
                {announcement.is_pinned ? <span className="status-chip">{t("Fixado", "Pinned")}</span> : null}
                {canManage ? <button type="button" className="tiny danger" disabled={disabled} onClick={() => {
                  if (window.confirm(t("Eliminar este aviso e os comentários associados?", "Delete this announcement and its comments?"))) {
                    void save(`${path}/announcements/${announcement.id}`, 'DELETE');
                  }
                }}>{t("Eliminar", "Delete")}</button> : null}
              </header>
              <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.body}</p>
              {announcement.comments.map((comment) => (
                <p key={comment.id}><strong>{comment.user?.name ?? 'Membro'}</strong> {comment.body}</p>
              ))}
              <form className="form" onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                if (await save(`${path}/announcements/${announcement.id}/comments`, 'POST', { body: new FormData(form).get('body') })) {
                  form.reset();
                }
              }}>
                <label>{t("Comentário", "Comment")}<input name="body" maxLength={3000} required /></label>
                <button type="submit" className="tiny" disabled={disabled}>{t("Comentar", "Comment")}</button>
              </form>
            </article>
          ))}
        </>
      ) : null}
      {data && tab === 'polls' ? (
        <>
          {!loading && data.polls.data.length === 0 ? <p className="workspace-card">{t("Ainda não há inquéritos.", "There are no polls yet.")}</p> : null}
          {data.polls.data.map((poll) => {
            const open = poll.is_active && (!poll.ends_at || new Date(poll.ends_at).getTime() > Date.now());
            return (
              <article className="workspace-card detail-list" key={poll.id}>
                <header className="listing-head">
                  <div><h3>{poll.title}</h3><p>{poll.section ?? 'Toda a banda'} · {open ? t("Aberto", "Open") : t("Fechado", "Closed")}</p></div>
                  {canManage && open ? <button type="button" className="tiny ghost" disabled={disabled} onClick={() => {
                    if (window.confirm(t("Fechar este inquérito a novas respostas?", "Close this poll to new responses?"))) {
                      void save(`${path}/polls/${poll.id}/close`, 'PATCH');
                    }
                  }}>{t("Fechar inquérito", "Close poll")}</button> : null}
                </header>
                {poll.questions.map((question) => (
                  <div key={question.id}>
                    <h4>{question.prompt}</h4>
                    <div className="summary-row">
                      {question.options.map((option) => (
                        <button key={option.id} type="button" className="tiny ghost" disabled={disabled || !open}
                          aria-pressed={question.responses[0]?.poll_option_id === option.id}
                          onClick={() => save(`${path}/polls/${poll.id}/questions/${question.id}/vote`, 'PUT', { option_id: option.id })}>
                          {question.responses[0]?.poll_option_id === option.id ? '✓ ' : ''}{option.label} ({option.responses_count})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
        </>
      ) : null}
      {data ? <Pagination page={page} lastPage={data[tab].last_page} onChange={setPage} /> : null}
    </section>
  );
}
