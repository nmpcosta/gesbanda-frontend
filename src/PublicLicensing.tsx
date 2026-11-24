
import { useWorkspaceResource } from './hooks/useWorkspaceResource';
import type { LicensePlan } from './types/licensing.types';
import { t, locale } from './language';

type PublicCatalog = {
  data: Pick<LicensePlan, 'id' | 'name' | 'price_cents' | 'duration_days'>[];
  payments_enabled: boolean;
};

export function PublicLicensing({ appUrl }: { appUrl: string }) {
  const { data, loading, error } = useWorkspaceResource<PublicCatalog>('/public/license-plans', '');
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  return (
    <section className="public-wrap public-section" id="licensing">
      <h2>{t('Planos de licenciamento', 'Licence plans')}</h2>
      <p className="public-pricing-intro">{t('Cada licença é associada a uma formação e tem uma duração definida. Os pedidos e renovações são geridos na área da banda.', 'Each licence is linked to an ensemble and runs for a fixed period. Manage orders and renewals from the ensemble’s workspace.')}</p>
      {loading ? <p role="status">{t('A carregar planos…', 'Loading plans…')}</p> : null}
      {error ? <p role="status">{t('O catálogo está temporariamente indisponível.', 'The licence catalogue is temporarily unavailable.')}</p> : null}
      {data ? (
        <>
          <div className="public-pricing">
            {data.data.map((plan) => (
              <article key={plan.id}>
                <h3>{plan.name}</h3>
                <strong>{currency.format(plan.price_cents / 100)}</strong>
                <p>{t(`Licença de ${plan.duration_days} dias`, `${plan.duration_days}-day licence`)}</p>
              </article>
            ))}
          </div>
          {!data.data.length ? <p>{t('O catálogo ainda não tem planos publicados.', 'No plans have been published yet.')}</p> : null}
          <p className="public-pricing-intro">{data.payments_enabled
            ? t('Pagamento por transferência bancária, com referência e confirmação pela administração.', 'Pay by bank transfer with an order reference and confirmation by a platform administrator.')
            : t('Os pedidos pagos estarão disponíveis quando o pagamento por transferência for configurado.', 'Paid orders will be available once bank transfer payments are configured.')}</p>
          <a href={appUrl} className="public-button public-button-outline">{t('Consultar licenças na aplicação', 'View licences in the app')}</a>
        </>
      ) : null}
    </section>
  );
}
