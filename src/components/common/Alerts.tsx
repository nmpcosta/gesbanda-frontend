type AlertsProps = {
  error: string | null;
  success: string | null;
};

export function Alerts({ error, success }: AlertsProps) {
  return (
    <>
      {error && <p className="alert error">{error}</p>}
      {success && <p className="alert success">{success}</p>}
    </>
  );
}
