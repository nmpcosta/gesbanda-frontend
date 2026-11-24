
import { UiIcon, type UiIconName } from './components/common/UiIcon';
import { isLegalPage, LegalLinks, LegalPages } from './LegalPages';
import { PublicLicensing } from './PublicLicensing';
import './institutional.css';

type Language = 'pt' | 'en';
type Feature = { icon: UiIconName; title: string; description: string };
type SiteContent = {
  navigation: [string, string, string];
  signIn: string;
  heading: string;
  introduction: string;
  createAccount: string;
  explore: string;
  example: [string, string, string, string, string, string];
  featuresHeading: string;
  features: Feature[];
  startHeading: string;
  steps: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  closing: string;
};

const content: Record<Language, SiteContent> = {
  pt: {
    navigation: ['Funcionalidades', 'Primeiros passos', 'Perguntas frequentes'],
    signIn: 'Entrar',
    heading: 'A tua banda, em sintonia.',
    introduction: 'Organiza ensaios, atuações, músicos e partituras num espaço de trabalho para bandas, coros e orquestras.',
    createAccount: 'Criar conta',
    explore: 'Conhecer as funcionalidades',
    example: ['Exemplo de agenda', 'Banda do Vale', 'Ensaio geral', 'Quinta-feira, 19:30', 'Concerto de primavera', 'Sábado, 21:00'],
    featuresHeading: 'Da organização ao palco',
    features: [
      { icon: 'agenda', title: 'Agenda e atuações', description: 'Planeia ensaios recorrentes e concertos, convoca toda a banda ou um naipe e envia lembretes na aplicação a quem ainda não respondeu.' },
      { icon: 'members', title: 'Músicos e funções', description: 'Organiza os membros por naipe e instrumento. Atribui funções de gestão e acompanha o estado de cada membro.' },
      { icon: 'bell', title: 'Comunicação interna', description: 'Publica avisos e inquéritos para toda a banda ou apenas para um naipe e acompanha os comentários e respostas.' },
      { icon: 'check', title: 'Controlo de presenças', description: 'Faz a chamada manualmente, por QR ou por localização. Regista faltas e justificações e acompanha as estatísticas por músico.' },
      { icon: 'repertoire', title: 'Repertório e partituras', description: 'Mantém o repertório atualizado, distribui partituras por instrumento e associa peças, áudios ou vídeos aos eventos. A identificação de instrumentos em PDF está disponível quando a IA está configurada.' },
      { icon: 'cards', title: 'Plantas de palco', description: 'Desenha posições para auditório ou desfile, obtém uma proposta por naipes e reutiliza a planta noutros eventos.' },
      { icon: 'table', title: 'Pagamentos a músicos', description: 'Define o orçamento de uma atuação, calcula os valores por presença e regista os pagamentos efetuados.' },
      { icon: 'files', title: 'Inventário e empréstimos', description: 'Organiza instrumentos, fardamento e equipamento por categoria e regista entregas e devoluções com histórico.' },
      { icon: 'files', title: 'Arquivo digital', description: 'Guarda documentos, regulamentos e anexos num arquivo da banda, com categorias e ligações a eventos ou peças.' },
      { icon: 'groups', title: 'Sociedades musicais', description: 'Liga várias formações a uma sociedade. Gere fichas de sócios, direção, património partilhado, quotas, avisos e atas. Publica eventos e acompanha inscrições e entradas.' },
      { icon: 'settings', title: 'Licenças e administração', description: 'Os gestores consultam os planos e as licenças da banda. A administração da plataforma gere os pedidos e consulta o histórico de atividade.' },
    ],
    startHeading: 'Começa pela tua formação',
    steps: [
      { title: 'Cria a banda', description: 'Cria uma conta e identifica a tua banda, coro, orquestra ou outro agrupamento.' },
      { title: 'Adiciona os músicos', description: 'Define os naipes e instrumentos e atribui as funções adequadas a cada pessoa.' },
      { title: 'Prepara o próximo ensaio', description: 'Cria um evento, liga as peças do programa e consulta as respostas dos músicos.' },
    ],
    faq: [
      { question: 'Posso gerir mais do que uma formação?', answer: 'Sim. Podes criar várias formações e alternar entre elas com a mesma conta.' },
      { question: 'Como se compra uma licença?', answer: 'Os gestores consultam os planos disponíveis em Licenças da banda. Quando a transferência está disponível, cada pedido apresenta o valor, as instruções e a referência. A licença é ativada após confirmação pela administração.' },
      { question: 'Quem pode alterar os dados de uma banda?', answer: 'O proprietário, os membros ativos com funções de gestão e os administradores da plataforma. As permissões são verificadas pelo servidor.' },
    ],
    closing: 'Organiza o próximo ensaio com GesBanda.',
  },
  en: {
    navigation: ['Features', 'Getting started', 'Frequently asked questions'],
    signIn: 'Sign in',
    heading: 'Keep your ensemble in tune.',
    introduction: 'Organise rehearsals, performances, musicians and scores in one workspace for bands, choirs and orchestras.',
    createAccount: 'Create an account',
    explore: 'Explore the features',
    example: ['Sample schedule', 'Valley Band', 'Full rehearsal', 'Thursday, 7:30 pm', 'Spring concert', 'Saturday, 9:00 pm'],
    featuresHeading: 'From planning to performance',
    features: [
      { icon: 'agenda', title: 'Schedule and performances', description: 'Schedule recurring rehearsals and concerts, invite the ensemble or a single section, and remind musicians who have yet to RSVP.' },
      { icon: 'members', title: 'Musicians and roles', description: 'Organise members by section and instrument. Assign management roles and track each member’s status.' },
      { icon: 'bell', title: 'Internal communication', description: 'Publish announcements and polls for the whole ensemble or a single section, and follow comments and answers.' },
      { icon: 'check', title: 'Attendance', description: 'Take attendance manually, by QR code or by location. Record absences and reasons and view each musician’s statistics.' },
      { icon: 'repertoire', title: 'Repertoire and scores', description: 'Maintain your repertoire, share parts by instrument, and attach pieces, audio or video to events. AI can suggest the instrument for a PDF when configured.' },
      { icon: 'cards', title: 'Stage plans', description: 'Arrange auditorium or parade positions, generate a layout by section and reuse plans for future events.' },
      { icon: 'table', title: 'Musician payments', description: 'Set a performance budget, calculate amounts based on attendance and track completed payments.' },
      { icon: 'files', title: 'Inventory and loans', description: 'Organise instruments, uniforms and equipment by category and keep a history of loans and returns.' },
      { icon: 'files', title: 'Digital archive', description: 'Store documents, policies and attachments in your ensemble’s archive, with categories and links to events or pieces.' },
      { icon: 'groups', title: 'Music societies', description: 'Link multiple ensembles to one society and manage members, the board, shared equipment, dues, notices and meeting minutes. Publish events and track registrations and admissions.' },
      { icon: 'settings', title: 'Licensing and administration', description: 'Managers can review plans and licences for their ensemble. Platform administrators manage orders and review the activity log.' },
    ],
    startHeading: 'Start with your ensemble',
    steps: [
      { title: 'Create an ensemble', description: 'Create an account and register your band, choir, orchestra or other ensemble.' },
      { title: 'Add your musicians', description: 'Set the sections and instruments and assign roles to the right people.' },
      { title: 'Plan your next rehearsal', description: 'Create an event, add the pieces you’ll rehearse and review musicians’ RSVPs.' },
    ],
    faq: [
      { question: 'Can I manage more than one ensemble?', answer: 'Yes. You can create several ensembles and switch between them with the same account.' },
      { question: 'How do I buy a licence?', answer: 'Managers can see available plans under ensemble licences. When bank transfer is available, each order shows its amount, instructions and reference. The licence becomes active once an administrator confirms payment.' },
      { question: 'Who can edit an ensemble’s information?', answer: 'The owner, active members with management roles and platform administrators. The server checks these permissions.' },
    ],
    closing: 'Plan your next rehearsal with GesBanda.',
  },
};

export function InstitutionalSite({ language, legal }: {
  language: Language;
  legal?: string | null;
}) {
  const copy = content[language];
  const appUrl = `?app=1&lang=${language}`;
  const legalPage = isLegalPage(legal ?? null) ? legal : null;
  const currentPage = legalPage ? `legal=${legalPage}&` : '';
  const registerUrl = `${appUrl}&mode=register`;
  const [preview, exampleBand, rehearsal, rehearsalDate, concert, concertDate] = copy.example;

  return (
    <div className="institutional">
      <header className="public-header">
        <a className="public-brand" href={`?lang=${language}`}>GesBanda</a>
        <nav aria-label={language === 'pt' ? 'Navegação principal' : 'Main navigation'}>
          <a href={`?lang=${language}#features`}>{copy.navigation[0]}</a>
          <a href={`?lang=${language}#licensing`}>{language === 'pt' ? 'Planos' : 'Plans'}</a>
          <a href={`?lang=${language}#getting-started`}>{copy.navigation[1]}</a>
          <a href={`?lang=${language}#questions`}>{copy.navigation[2]}</a>
        </nav>
        <div className="public-header-actions">
          <a href={`?${currentPage}lang=pt`} lang="pt-PT" aria-current={language === 'pt' ? 'page' : undefined}>PT</a>
          <a href={`?${currentPage}lang=en`} lang="en" aria-current={language === 'en' ? 'page' : undefined}>EN</a>
          <a className="public-button public-button-outline" href={appUrl}>{copy.signIn}</a>
        </div>
      </header>
      {legalPage && isLegalPage(legalPage) ? <main><LegalPages page={legalPage} language={language} /></main> : <main>
        <section className="public-hero">
          <div className="public-wrap public-hero-grid">
            <div>
              <h1>{copy.heading}</h1>
              <p>{copy.introduction}</p>
              <div className="public-actions">
                <a href={registerUrl} className="public-button">{copy.createAccount}</a>
                <a href="#features" className="public-button public-button-outline">{copy.explore}</a>
              </div>
            </div>
            <aside className="public-preview" aria-label={preview}>
              <span>{preview}</span>
              <h2>{exampleBand}</h2>
              <div><UiIcon name="events" /><p><strong>{rehearsal}</strong><small>{rehearsalDate}</small></p></div>
              <div><UiIcon name="repertoire" /><p><strong>{concert}</strong><small>{concertDate}</small></p></div>
            </aside>
          </div>
        </section>
        <section id="features" className="public-wrap public-section">
          <h2>{copy.featuresHeading}</h2>
          <div className="public-features">
            {copy.features.map((feature) => (
              <article key={feature.title}>
                <UiIcon name={feature.icon} size={25} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="getting-started" className="public-steps">
          <div className="public-wrap public-section">
            <h2>{copy.startHeading}</h2>
            <ol>
              {copy.steps.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.description}</p></li>)}
            </ol>
          </div>
        </section>
        <PublicLicensing appUrl={`${appUrl}&view=group-licenses`} />
        <section id="questions" className="public-wrap public-section public-questions">
          <h2>{copy.navigation[2]}</h2>
          <div>
            {copy.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </section>
        <section className="public-cta">
          <h2>{copy.closing}</h2>
          <a href={registerUrl} className="public-button">{copy.createAccount}</a>
        </section>
      </main>}
      <footer className="public-wrap public-footer">
        <a className="public-brand" href={`?lang=${language}`}>GesBanda</a>
        <LegalLinks language={language} />
        <a href={appUrl}>{copy.signIn}</a>
      </footer>
    </div>
  );
}
