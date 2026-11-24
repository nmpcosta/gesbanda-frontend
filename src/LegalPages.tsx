
type Language = 'pt' | 'en';
type LegalPage = 'info' | 'terms' | 'privacy' | 'storage' | 'contact';

const pages: Record<LegalPage, [string, string]> = {
  info: ['Informação legal', 'Legal notice'],
  terms: ['Termos e condições', 'Terms and conditions'],
  privacy: ['Política de privacidade', 'Privacy policy'],
  storage: ['Cookies e armazenamento', 'Cookies and storage'],
  contact: ['Contactos e reclamações', 'Contact and complaints'],
};

const operator = {
  name: import.meta.env.VITE_LEGAL_OPERATOR_NAME as string | undefined,
  address: import.meta.env.VITE_LEGAL_OPERATOR_ADDRESS as string | undefined,
  registration: import.meta.env.VITE_LEGAL_OPERATOR_REGISTRATION as string | undefined,
  taxId: import.meta.env.VITE_LEGAL_OPERATOR_TAX_ID as string | undefined,
  email: import.meta.env.VITE_LEGAL_CONTACT_EMAIL as string | undefined,
  phone: import.meta.env.VITE_LEGAL_CONTACT_PHONE as string | undefined,
  privacyEmail: import.meta.env.VITE_LEGAL_PRIVACY_EMAIL as string | undefined,
  adrName: import.meta.env.VITE_LEGAL_ADR_NAME as string | undefined,
  adrUrl: import.meta.env.VITE_LEGAL_ADR_URL as string | undefined,
  privacyRetention: import.meta.env.VITE_LEGAL_RETENTION as string | undefined,
  privacyRetentionEn: import.meta.env.VITE_LEGAL_RETENTION_EN as string | undefined,
  privacyProcessors: import.meta.env.VITE_LEGAL_PROCESSORS as string | undefined,
  privacyProcessorsEn: import.meta.env.VITE_LEGAL_PROCESSORS_EN as string | undefined,
  privacyTransfers: import.meta.env.VITE_LEGAL_TRANSFERS as string | undefined,
  privacyTransfersEn: import.meta.env.VITE_LEGAL_TRANSFERS_EN as string | undefined,
};

const cnpd = 'https://www.cnpd.pt/cidadaos/participacoes/';
const complaints = 'https://www.livroreclamacoes.pt/Inicio/';
const consumerHelp = 'https://www.consumidor.gov.pt/atendimento';

export function legalUrl(page: LegalPage, language: Language): string {
  return `?legal=${page}&lang=${language}`;
}

export function isLegalPage(value: string | null): value is LegalPage {
  return value !== null && Object.prototype.hasOwnProperty.call(pages, value);
}

export function LegalLinks({ language }: { language: Language }) {
  return (
    <nav className="public-legal-links" aria-label={language === 'en' ? 'Legal information' : 'Informação legal'}>
      {Object.entries(pages).map(([page, label]) => <a key={page} href={legalUrl(page as LegalPage, language)}>{label[language === 'en' ? 1 : 0]}</a>)}
    </nav>
  );
}

export function LegalPages({ page, language }: { page: LegalPage; language: Language }) {
  const en = language === 'en';
  const tr = (pt: string, english: string) => en ? english : pt;
  const privacyContact = operator.privacyEmail || operator.email;
  const fullOperator = operator.name && operator.address && operator.taxId && operator.email;

  return (
    <article className="public-wrap public-section legal-document">
      <h1>{pages[page][en ? 1 : 0]}</h1>
      <p className="legal-revision">
        {tr('Versão de', 'Version dated')} <time dateTime="2026-11-21">{tr('21 de novembro de 2026', '21 November 2026')}</time>
      </p>
      {page === 'info' ? (
        <>
          <section>
            <h2>{tr('Entidade responsável pelo GesBanda', 'GesBanda operator')}</h2>
            {!fullOperator ? <p role="status">{tr('A identificação completa da entidade responsável está por configurar.', 'The operator’s full legal details are awaiting configuration.')}</p> : null}
            <dl>
              {operator.name ? <><dt>{tr('Nome ou denominação social', 'Legal name')}</dt><dd>{operator.name}</dd></> : null}
              {operator.address ? <><dt>{tr('Morada', 'Address')}</dt><dd>{operator.address}</dd></> : null}
              {operator.taxId ? <><dt>{tr('Número de identificação fiscal', 'Tax identification number')}</dt><dd>{operator.taxId}</dd></> : null}
              {operator.registration ? <><dt>{tr('Registo público', 'Public registration')}</dt><dd>{operator.registration}</dd></> : null}
              {operator.email ? <><dt>Email</dt><dd><a href={`mailto:${operator.email}`}>{operator.email}</a></dd></> : null}
              {operator.phone ? <><dt>{tr('Telefone', 'Telephone')}</dt><dd>{operator.phone}</dd></> : null}
            </dl>
          </section>
          <section>
            <h2>{tr('Serviço e preços', 'Service and prices')}</h2>
            <p>{tr('O GesBanda disponibiliza ferramentas de gestão para formações e sociedades musicais. Os preços em euros, a duração dos planos e o meio de pagamento disponível são apresentados antes de criar cada pedido de licença.', 'GesBanda provides management tools for ensembles and music societies. Prices in euros, plan duration and the available payment method are shown before you create a licence order.')}</p>
            <p><a href={legalUrl('terms', language)}>{tr('Consulta as condições de contratação', 'Read the terms of service')}</a></p>
          </section>
          <section>
            <h2>{tr('Acessibilidade', 'Accessibility')}</h2>
            <p>{tr('O site adapta-se a diferentes tamanhos de ecrã. Se encontrares uma dificuldade ao navegar, operar um formulário ou consultar informação, descreve-nos a página e a dificuldade através dos contactos publicados.', 'The website adapts to different screen sizes. If you have trouble navigating, using a form or accessing information, use the published contact details to tell us which page is affected and what happened.')}</p>
          </section>
        </>
      ) : null}

      {page === 'terms' ? (
        <>
          <section>
            <h2>{tr('Conta e utilização', 'Accounts and use')}</h2>
            <p>{tr('Usa dados corretos ao criar a conta e protege as tuas credenciais. Só podes gerir uma formação, uma sociedade ou os dados dos seus membros quando tiveres autorização para o fazer. Contacta a equipa de suporte se suspeitares de acesso indevido.', 'Use accurate information when creating an account and keep your credentials secure. Only manage an ensemble, society or its members’ data when authorised. Contact support if you suspect unauthorised access.')}</p>
          </section>
          <section>
            <h2>{tr('Conteúdos e partilha', 'Content and sharing')}</h2>
            <p>{tr('Carrega apenas partituras, gravações, documentos e outros conteúdos que tenhas autorização para usar e partilhar. Escolhe os destinatários antes de publicar. A publicação de uma página de formação, atuação ou vaga pode tornar a informação acessível a qualquer visitante.', 'Only upload scores, recordings, documents and other content you are authorised to use and share. Check the intended audience before posting. Publishing an ensemble page, performance or vacancy may make that information available to any visitor.')}</p>
            <p>{tr('É proibido publicar material ilícito, ameaçador, discriminatório ou que viole direitos de terceiros, aceder indevidamente a contas e interferir no funcionamento do serviço. As denúncias são analisadas de acordo com a situação e a legislação aplicável.', 'Do not publish unlawful, threatening, discriminatory or infringing material, access accounts without permission, or interfere with the service. Reports are reviewed according to the circumstances and applicable law.')}</p>
          </section>
          <section>
            <h2>{tr('Licenças, pagamentos e duração', 'Licences, payments and duration')}</h2>
            <p>{tr('O pedido indica o plano, o preço em euros, a duração e as instruções da transferência. O pedido fica pendente até o pagamento ser confirmado. A licença tem a duração apresentada no pedido e termina na data indicada. Para renovar, é necessário um novo pedido. Os pagamentos a músicos e as quotas de sociedades são registos de operações efetuadas pelas respetivas entidades.', 'An order states the plan, price in euros, duration and bank transfer instructions. It remains pending until payment is confirmed. The licence lasts for the period shown and ends on the indicated date. A new order is required to renew. Musician payments and society dues are records of transactions handled by the respective organisations.')}</p>
          </section>
          <section>
            <h2>{tr('Livre resolução e assistência', 'Withdrawal and support')}</h2>
            <p>{tr('Quando o regime aplicável aos contratos à distância com consumidores conferir o direito de livre resolução, podes exercê-lo nos termos legais, em regra nos 14 dias que se seguem à celebração do contrato de prestação de serviços. Envia uma declaração inequívoca de resolução pelo contacto indicado, identificando o pedido e a conta. Mantêm-se os direitos legais relativos a serviços digitais, incluindo em caso de falta de conformidade.', 'Where consumer distance-selling law grants a right of withdrawal, you can exercise it under the applicable rules, generally within 14 days of concluding a services contract. Send a clear withdrawal statement to the published contact, identifying the order and account. Statutory digital service rights, including remedies for lack of conformity, continue to apply.')}</p>
            <p><a href={legalUrl('contact', language)}>{tr('Contactos e reclamações', 'Contact and complaints')}</a> · <a href="https://diariodarepublica.pt/dr/detalhe/decreto-lei/24-2014-572450">{tr('Decreto-Lei n.º 24/2014 e modelo de livre resolução', 'Portuguese distance contracts law and withdrawal form')}</a></p>
          </section>
          <section>
            <h2>{tr('Funcionalidades assistidas por IA', 'AI-assisted features')}</h2>
            <p>{tr('As sugestões de instrumento e de planta podem conter erros. Confirma o resultado antes de o guardar ou distribuir. Usa a análise de documentos apenas quando tiveres autorização para enviar o conteúdo ao serviço que gera a sugestão.', 'Instrument and stage plan suggestions may contain mistakes. Review the result before saving or distributing it. Only analyse documents you are authorised to send to the service generating the suggestion.')}</p>
          </section>
        </>
      ) : null}

      {page === 'privacy' ? (
        <>
          <section>
            <h2>{tr('Quem trata os dados', 'Who processes your data')}</h2>
            <p>{tr('A entidade identificada na informação legal é responsável pela gestão das contas, da segurança e do licenciamento do GesBanda. As formações e sociedades que decidem como utilizar os dados dos seus membros são responsáveis pelas respetivas finalidades de gestão. Contacta a direção da formação ou sociedade sobre registos que esta mantém.', 'The operator named in the legal notice is responsible for GesBanda account management, security and licensing. Ensembles and societies that decide how to use member data are responsible for their own management purposes. Contact the relevant organisation about records it maintains.')}</p>
            <p>{privacyContact ? <a href={`mailto:${privacyContact}`}>{privacyContact}</a> : <a href={legalUrl('info', language)}>{tr('Identificação e contactos do responsável', 'Operator identity and contact details')}</a>}</p>
          </section>
          <section>
            <h2>{tr('Dados, origem e finalidades', 'Data, sources and purposes')}</h2>
            <ul>
              <li>{tr('Conta e perfil. Nome, email, credenciais protegidas, instrumentos e outros elementos introduzidos pelo utilizador ou pelo gestor autorizado. São usados para criar a conta, autenticar e prestar o serviço.', 'Account and profile. Name, email, protected credentials, instruments and other information provided by you or an authorised manager. These support account creation, authentication and service delivery.')}</li>
              <li>{tr('Gestão musical e associativa. Fichas de membros, funções, eventos, respostas, presenças, mensagens, candidaturas, empréstimos, pagamentos, quotas e ficheiros são registados conforme os módulos utilizados. Os dados podem vir diretamente da pessoa, dos gestores ou de atividades realizadas na aplicação.', 'Ensemble and society management. Member profiles, roles, events, responses, attendance, messages, applications, loans, payments, dues and files are processed according to the modules used. Information can come directly from you, from authorised managers, or from activity in the application.')}</li>
              <li>{tr('Localização. Se escolheres registar presença por localização, o navegador pede autorização para partilhar a posição. A posição do músico serve para verificar a distância ao local e o registo de presença guarda o resultado da chamada. A posição usada para configurar o local da chamada é guardada na sessão de chamada.', 'Location. If you choose to check in by location, your browser asks permission to share your position. A musician’s coordinates are used to check distance from the venue, and the attendance record stores the outcome. The coordinates used to configure the check-in venue are stored with the check-in session.')}</li>
              <li>{tr('Inscrições em eventos públicos. O nome, email, lugares, referência, pagamentos e entradas são usados pela sociedade para gerir a inscrição, cobrar quando aplicável e controlar o acesso. A lista de inscritos fica reservada à equipa de gestão da sociedade.', 'Public event registrations. The society uses your name, email, seats, reference, payments and check-in records to manage reservations, collect payment where applicable and control admission. The attendee list is restricted to the society’s management team.')}</li>
              <li>{tr('Débito direto. Quando uma sociedade regista um mandato, a direção trata o nome do titular, IBAN, BIC quando aplicável, referência e data da assinatura para preparar a cobrança. Os dados completos são reservados ao ficheiro bancário da direção e comunicados ao prestador de pagamentos quando este recebe a remessa.', 'Direct debit. When a society records a mandate, its board processes the account holder’s name, IBAN, BIC where applicable, mandate reference and signature date to prepare collections. Full details are restricted to the board’s banking file and shared with the payment provider when it receives the collection.')}</li>
              <li>{tr('Licenciamento e operação. Os pedidos, referências e estados de pagamento servem para prestar o serviço e manter o histórico. Os registos técnicos e administrativos ajudam a proteger contas, detetar abuso e investigar problemas.', 'Licensing and operations. Orders, references and payment statuses support service delivery and record keeping. Technical and administrative logs help protect accounts, detect abuse and investigate incidents.')}</li>
            </ul>
          </section>
          <section>
            <h2>{tr('Bases jurídicas', 'Legal bases')}</h2>
            <p>{tr('A prestação do serviço e do licenciamento assenta na execução do contrato ou nas diligências pré-contratuais pedidas pelo utilizador. O cumprimento de obrigações fiscais, contabilísticas ou outras exigidas por lei assenta na obrigação legal aplicável. A segurança e prevenção de uso abusivo podem assentar no interesse legítimo de proteger o serviço e os utilizadores. A localização é opcional e exige autorização do navegador. Cada organização deve informar os membros da base que utiliza para os tratamentos que determina.', 'Service delivery and licensing rely on performance of a contract or pre-contractual steps requested by the user. Tax, accounting and other statutory requirements rely on the applicable legal obligation. Security and abuse prevention may rely on the legitimate interest in protecting the service and its users. Location is optional and requires browser permission. Each organisation must inform members of the basis for processing it decides to carry out.')}</p>
          </section>
          <section>
            <h2>{tr('Acesso, fornecedores e transferências', 'Access, providers and transfers')}</h2>
            <p>{tr('Os dados são mostrados às pessoas autorizadas em função do módulo e do papel. O diretório, as atuações publicadas e as vagas abertas mostram os dados escolhidos para publicação. Os fornecedores de alojamento e email podem receber dados necessários a esses serviços, quando configurados. A análise de PDF com IA envia o documento escolhido para análise. A proposta de planta usa os nomes dos naipes ou instrumentos.', 'Access depends on the module and assigned role. The public directory, published performances and open vacancies display information selected for publication. Hosting and email providers may receive data needed for those services when configured. AI score analysis sends the selected PDF for analysis. Stage layout suggestions use section or instrument labels.')}</p>
            <p>{(en ? operator.privacyProcessorsEn : operator.privacyProcessors) || tr('A lista de fornecedores desta instalação está por indicar.', 'The providers for this installation are awaiting disclosure.')}</p>
            <p>{(en ? operator.privacyTransfersEn : operator.privacyTransfers) || tr('As localizações de tratamento e eventuais garantias de transferência internacional desta instalação estão por indicar.', 'Processing locations and any international transfer safeguards for this installation are awaiting disclosure.')}</p>
          </section>
          <section>
            <h2>{tr('Conservação e direitos', 'Retention and your rights')}</h2>
            <p>{(en ? operator.privacyRetentionEn : operator.privacyRetention) || tr('Os prazos específicos desta instalação estão por indicar. A conservação depende da finalidade do registo, da duração da relação e dos prazos legais aplicáveis.', 'Specific retention periods for this installation are awaiting disclosure. Retention depends on the purpose of the record, the length of the relationship and applicable statutory periods.')}</p>
            <p>{tr('Nos termos do RGPD, podes pedir acesso, retificação, apagamento, limitação ou portabilidade, opor-te ao tratamento quando aplicável e retirar o consentimento quando este for a base jurídica. Podes também apresentar uma reclamação à autoridade de controlo. O nome, o email e a palavra-passe são necessários para criar a conta. Recusar a partilha de localização impede apenas o método de chamada por localização.', 'Under the GDPR, you may request access, rectification, erasure, restriction or portability, object where applicable, and withdraw consent where consent is the legal basis. You can also complain to a supervisory authority. Your name, email and password are required to create an account. Declining location access prevents location-based check-in only.')}</p>
            <p><a href={cnpd}>{tr('Apresentar participação à CNPD', 'Submit a complaint to the Portuguese data protection authority')}</a></p>
          </section>
        </>
      ) : null}

      {page === 'storage' ? (
        <>
          <section>
            <h2>{tr('Armazenamento necessário', 'Essential storage')}</h2>
            <p>{tr('A aplicação guarda no armazenamento local do navegador o identificador da sessão, com a chave gesbanda.auth.token. O identificador mantém a sessão disponível quando atualizas a página. Ao terminares sessão ou quando a aplicação deteta uma sessão inválida, o identificador é removido do navegador.', 'The application stores a session identifier in browser local storage under gesbanda.auth.token. It lets your session remain available when you reload the page. The application removes it at sign-out or when it detects an invalid session.')}</p>
            <p>{tr('A versão distribuída do site não inclui cookies de publicidade nem de análise de utilização. O idioma escolhido é indicado no endereço da página.', 'The supplied website includes no advertising or analytics cookies. The selected language is indicated in the page URL.')}</p>
          </section>
          <section>
            <h2>{tr('Gerir os dados do navegador', 'Manage browser data')}</h2>
            <p>{tr('Podes apagar os dados do site nas definições do navegador. Se apagares o identificador local, terás de iniciar sessão novamente nesse navegador. Para revogar também a sessão no servidor, usa a opção Terminar sessão na aplicação.', 'You can clear site data in your browser settings. Deleting the local identifier means you need to sign in again in that browser. To revoke the server session as well, use Sign out in the application.')}</p>
          </section>
        </>
      ) : null}

      {page === 'contact' ? (
        <>
          <section>
            <h2>{tr('Assistência e denúncias', 'Support and reports')}</h2>
            <p>{tr('Usa o contacto de suporte para questões de conta, licenças e acessibilidade ou para denunciar conteúdos ilícitos. Indica o assunto, o endereço da publicação quando aplicável e o motivo do pedido. Evita enviar palavras-passe, documentos de identificação ou dados bancários desnecessários.', 'Use the support contact for account, licensing or accessibility queries, or to report unlawful content. Include the subject, the publication URL if applicable and the reason for the request. Avoid sending passwords, identity documents or unnecessary bank details.')}</p>
            {operator.email ? <p><a href={`mailto:${operator.email}`}>{operator.email}</a>{operator.phone ? ` · ${operator.phone}` : ''}</p> : <p role="status">{tr('Os contactos de suporte estão por configurar.', 'Support contacts are awaiting configuration.')}</p>}
          </section>
          <section>
            <h2>{tr('Reclamações e resolução alternativa de litígios', 'Complaints and alternative dispute resolution')}</h2>
            <p>{tr('Nas relações de consumo abrangidas pelo regime português, podes usar o Livro de Reclamações Eletrónico e recorrer à entidade de resolução alternativa de litígios competente.', 'For consumer relationships covered by Portuguese law, you can use the Electronic Complaints Book and contact the competent alternative dispute resolution body.')}</p>
            <ul>
              <li><a href={complaints}>{tr('Livro de Reclamações Eletrónico', 'Electronic Complaints Book')}</a></li>
              {operator.adrName && operator.adrUrl?.startsWith('https://')
                ? <li><a href={operator.adrUrl}>{operator.adrName}</a></li>
                : <li><a href={consumerHelp}>{tr('Entidades de resolução de litígios e apoio ao consumidor', 'Dispute resolution bodies and consumer support')}</a></li>}
            </ul>
          </section>
        </>
      ) : null}
    </article>
  );
}
