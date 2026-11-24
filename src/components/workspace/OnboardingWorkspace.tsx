
import { useState } from 'react';
import { MusicChoices } from '../common/MusicChoices';
import { Alerts } from '../common/Alerts';
import { instrumentGroups } from '../../musicCatalog';
import { t } from '../../language';
import type { User } from '../../types';
import type { GroupForm, WorkspaceView } from '../../ui-types';

type OnboardingProps = {
  user: User;
  hasGroups: boolean;
  onCreateGroup: (name: string, type: GroupForm['groupType']) => Promise<boolean>;
  onFinish: (instruments?: string[]) => Promise<void>;
  onNavigate: (view: WorkspaceView) => void;
};

export function OnboardingWorkspace({ user, hasGroups, onCreateGroup, onFinish, onNavigate }: OnboardingProps) {
  const [step, setStep] = useState<'profile' | 'band' | 'next'>('profile');
  const [selected, setSelected] = useState(user.profile?.instruments ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(skip: boolean, view?: WorkspaceView) {
    setBusy(true);
    setError(null);
    try {
      await onFinish(skip ? undefined : selected);
      if (view) onNavigate(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Não foi possível concluir a configuração.', 'Could not finish setup.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-panel admin-panel onboarding">
      <header className="workspace-head admin-head">
        <div><h2>{t('Bem-vindo ao GesBanda', 'Welcome to GesBanda')}</h2>
          <p className="subtitle">{t('Configura a tua conta e prepara o espaço da formação.', 'Set up your account and get your ensemble workspace ready.')}</p></div>
        <button type="button" className="ghost" disabled={busy} onClick={() => finish(true)}>{t('Saltar assistente', 'Skip setup')}</button>
      </header>
      <Alerts error={error} success={null} />
      {step === 'profile' ? (
        <article className="workspace-card form">
          <h3>{t('O que tocas?', 'What do you play?')}</h3>
          <p>{t('Escolhe os teus instrumentos e vozes. Podes selecionar mais do que uma opção ou continuar sem preencher.', 'Choose your instruments and voices. Select more than one, or continue without adding any.')}</p>
          <MusicChoices label={t('Instrumentos e vozes', 'Instruments and voices')} groups={instrumentGroups} value={selected} onChange={setSelected} />
          <div className="summary-row"><button type="button" className="workspace-primary" onClick={() => setStep(hasGroups ? 'next' : 'band')}>{t('Continuar', 'Continue')}</button></div>
        </article>
      ) : null}
      {step === 'band' ? (
        <article className="workspace-card">
          <h3>{t('Criar uma formação', 'Create an ensemble')}</h3>
          <p>{t('Se já vais juntar-te a uma formação, partilha com a direção o email da tua conta GesBanda.', 'If you’re joining an existing ensemble, give its managers the email address of your GesBanda account.')}</p>
          <form className="form" onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setBusy(true);
            setError(null);
            try {
              if (await onCreateGroup(String(data.get('name')).trim(), data.get('type') as GroupForm['groupType'])) {
                setStep('next');
              } else {
                setError(t('Não foi possível criar a formação. Tenta novamente.', 'Could not create the ensemble. Try again.'));
              }
            } finally {
              setBusy(false);
            }
          }}>
            <label>{t('Nome da formação', 'Ensemble name')}<input name="name" required maxLength={160} /></label>
            <label>{t('Tipo de formação', 'Ensemble type')}
              <select name="type">
                <option value="band">{t('Banda', 'Band')}</option><option value="choir">{t('Coro', 'Choir')}</option>
                <option value="orchestra">{t('Orquestra', 'Orchestra')}</option><option value="ensemble">{t('Agrupamento', 'Ensemble')}</option>
                <option value="other">{t('Outro', 'Other')}</option>
              </select>
            </label>
            <div className="summary-row">
              <button type="submit" disabled={busy}>{t('Criar formação', 'Create ensemble')}</button>
              <button type="button" className="ghost" disabled={busy} onClick={() => setStep('next')}>{t('Continuar sem criar', 'Continue without creating one')}</button>
              <button type="button" className="ghost" disabled={busy} onClick={() => setStep('profile')}>{t('Voltar', 'Back')}</button>
            </div>
          </form>
        </article>
      ) : null}
      {step === 'next' ? (
        <article className="workspace-card">
          <h3>{t('Por onde queres começar?', 'Where would you like to start?')}</h3>
          <div className="summary-row">
            {hasGroups ? <button type="button" className="ghost" disabled={busy} onClick={() => finish(false, 'agenda')}>{t('Ver agenda', 'Open schedule')}</button> : null}
            {hasGroups ? <button type="button" className="ghost" disabled={busy} onClick={() => finish(false, 'members')}>{t('Ver músicos', 'View musicians')}</button> : null}
            <button type="button" className="workspace-primary" disabled={busy} onClick={() => finish(false, 'overview')}>{t('Concluir', 'Finish')}</button>
          </div>
        </article>
      ) : null}
    </section>
  );
}
