type JsonValue = string | number | boolean | null | undefined;

export function logEvent(
  event: string,
  fields: Record<string, JsonValue> = {},
) {
  const payload = {
    ts: new Date().toISOString(),
    service: 'loyalty-bff-customer',
    event,
    ...Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    ),
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}
