
import { useState } from 'react';
import { downloadApiFile } from '../../api';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { locale, t } from '../../language';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type Mandate = { id: number; name: string; mandate_reference: string | null; iban_last4: string | null };
type SepaBatch = { id: number; reference: string; period: string; collection_on: string; transactions_count: number; total_cents: number; voided_at: string | null };
type SepaData = {
  creditor: { name: string; id: string; iban_last4: string } | null;
  members: Mandate[];
  batches: Paginated<SepaBatch>;
};

export function SocietySepa({ societyPath, token }: { societyPath: string; token: string }) {
  const [page, setPage] = useState(1);
  const [memberId, setMemberId] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const path = `${societyPath}/sepa`;
  const { data, error, loading, saving, save } = useWorkspaceResource<SepaData>(`${path}?page=${page}`, token);
  const member = data?.members.find((entry) => String(entry.id) === memberId);
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  return (
    <>
      <Alerts error={error ?? downloadError} success={null} />
      {loading ? <p role="status">{t('A carregar remessas…', 'Loading collections…')}</p> : null}
      <article className="workspace-card">
        <h3>{t('Credor SEPA', 'SEPA creditor')}</h3>
        <p>{t('Usa o identificador de credor atribuído pelo teu prestador de pagamentos. O IBAN completo só é apresentado no ficheiro bancário.', 'Use the creditor identifier assigned by your payment provider. The full IBAN is only shown in the banking file.')}</p>
        {data?.creditor ? <p>{data.creditor.name} · {data.creditor.id} · IBAN •••• {data.creditor.iban_last4}</p> : null}
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          if (await save(`${path}/creditor`, 'PUT', Object.fromEntries(new FormData(form)))) form.reset();
        }}>
          <label>{t('Nome do credor', 'Creditor name')}<input name="name" maxLength={70} required /></label>
          <label>{t('Identificador do credor', 'Creditor identifier')}<input name="creditor_id" maxLength={35} required /></label>
          <label>IBAN<input name="iban" maxLength={48} autoComplete="off" required /></label>
          <label>{t('BIC (opcional)', 'BIC (optional)')}<input name="bic" maxLength={11} autoComplete="off" /></label>
          <button type="submit" disabled={saving}>{t('Guardar credor', 'Save creditor')}</button>
        </form>
      </article>
      <article className="workspace-card">
        <h3>{t('Mandatos dos sócios', 'Member mandates')}</h3>
        <div className="form">
          <label>{t('Sócio', 'Member')}
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
              <option value="">{t('Seleciona um sócio', 'Select a member')}</option>
              {data?.members.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.mandate_reference ? ' · SEPA' : ''}</option>)}
            </select>
          </label>
        </div>
        {member ? (
          <form className="form" key={member.id} onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const values = new FormData(form);
            if (await save(`${path}/mandates/${member.id}`, 'PUT', { ...Object.fromEntries(values), has_authorization: values.has('has_authorization') })) {
              form.reset();
            }
          }}>
            {member.mandate_reference ? <p>{member.mandate_reference} · IBAN •••• {member.iban_last4}</p> : null}
            <label>{t('Titular da conta', 'Account holder')}<input name="name" defaultValue={member.name} maxLength={70} required /></label>
            <label>{t('Referência do mandato', 'Mandate reference')}<input name="reference" defaultValue={member.mandate_reference ?? ''} maxLength={35} required /></label>
            <label>IBAN<input name="iban" maxLength={48} autoComplete="off" required /></label>
            <label>{t('BIC (opcional)', 'BIC (optional)')}<input name="bic" maxLength={11} autoComplete="off" /></label>
            <label>{t('Data da assinatura', 'Signature date')}<input type="date" name="signed_on" required /></label>
            <label className="checkbox-row"><input type="checkbox" name="has_authorization" required />{t('Confirmo que o titular assinou um mandato recorrente para esta conta.', 'I confirm that the account holder signed a recurring mandate for this account.')}</label>
            <div className="summary-row">
              <button type="submit" disabled={saving}>{t('Guardar mandato', 'Save mandate')}</button>
              {member.mandate_reference ? <button type="button" className="tiny danger" disabled={saving} onClick={() => {
                if (window.confirm(t('Retirar o mandato das próximas remessas?', 'Remove this mandate from future collections?'))) {
                  void save(`${path}/mandates/${member.id}`, 'DELETE');
                }
              }}>{t('Retirar mandato', 'Remove mandate')}</button> : null}
            </div>
          </form>
        ) : null}
      </article>
      <article className="workspace-card">
        <h3>{t('Remessas de débito direto', 'Direct debit collections')}</h3>
        <p>{t('Gera um ficheiro XML para entregar ao banco. Inclui apenas quotas pendentes do período para sócios ativos com mandato. Regista o pagamento depois de confirmares a cobrança.', 'Generate an XML file for your bank. It includes only pending dues for the period for active members with mandates. Record payment after confirming the collection.')}</p>
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          if (await save(`${path}/batches`, 'POST', { ...Object.fromEntries(values), confirm_mandates: values.has('confirm_mandates') })) {
            form.reset();
            setPage(1);
          }
        }}>
          <label>{t('Período', 'Period')}<input name="period" type="month" required /></label>
          <label>{t('Data de cobrança', 'Collection date')}<input name="collection_on" type="date" required /></label>
          <label className="checkbox-row"><input type="checkbox" name="confirm_mandates" required />{t('Confirmei os mandatos e a comunicação da cobrança aos sócios.', 'I have checked the mandates and notified the members about this collection.')}</label>
          <button type="submit" disabled={saving || !data?.creditor}>{t('Gerar remessa XML', 'Generate XML collection')}</button>
        </form>
        {data?.batches.data.length ? (
          <div className="table-wrapper entity-table-wrapper">
            <table className="entity-table">
              <thead><tr><th>{t('Referência', 'Reference')}</th><th>{t('Período', 'Period')}</th><th>{t('Data', 'Date')}</th><th>{t('Valor', 'Amount')}</th><th>{t('Ações', 'Actions')}</th></tr></thead>
              <tbody>{data.batches.data.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.reference}</td><td>{batch.period}</td><td>{batch.collection_on}</td><td>{currency.format(batch.total_cents / 100)} · {batch.transactions_count}</td>
                  <td className="cell-actions">{batch.voided_at ? t('Anulada', 'Voided') : (
                    <>
                      <button type="button" className="tiny ghost" onClick={async () => {
                        setDownloadError(null);
                        try {
                          await downloadApiFile(`${path}/batches/${batch.id}`, token, `${batch.reference}.xml`);
                        } catch (err) {
                          setDownloadError(err instanceof Error ? err.message : t('Falha ao descarregar a remessa.', 'Could not download the collection.'));
                        }
                      }}>{t('Descarregar XML', 'Download XML')}</button>
                      <button type="button" className="tiny danger" disabled={saving} onClick={() => {
                        if (window.confirm(t('Anular apenas se a remessa não foi entregue ao banco ou se o banco confirmou a rejeição integral. Confirmas?', 'Only void a collection if it was never sent or your bank confirmed that it was rejected in full. Confirm?'))) {
                          void save(`${path}/batches/${batch.id}/void`, 'PATCH', { confirm_not_collected: true });
                        }
                      }}>{t('Anular', 'Void')}</button>
                    </>
                  )}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : null}
        {data ? <Pagination page={page} lastPage={data.batches.last_page} onChange={setPage} /> : null}
      </article>
    </>
  );
}
