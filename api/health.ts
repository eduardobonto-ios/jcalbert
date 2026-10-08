// Temporary diagnostic endpoint: reports runtime info and module-load errors.
// Never returns secret values, only presence/length.
export default async function handler(_req: any, res: any) {
  const report: Record<string, unknown> = {
    node: process.version,
    env: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? null,
      FIREBASE_CLIENT_EMAIL_set: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      FIREBASE_PRIVATE_KEY_length: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
      SUPABASE_URL_set: Boolean(process.env.SUPABASE_URL),
      NODE_OPTIONS: process.env.NODE_OPTIONS ?? null,
      total_env_bytes: Object.entries(process.env).reduce((n, [k, v]) => n + k.length + (v?.length ?? 0), 0),
    },
  };

  try {
    const supabase = await import('@supabase/supabase-js');
    report.supabase = typeof supabase.createClient;
  } catch (error) {
    report.supabase_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(report);
}
