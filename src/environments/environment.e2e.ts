/**
 * End-to-end test environment.
 * Points at a fake Supabase host that Playwright intercepts
 * (see e2e/mocks.ts) so e2e runs are fully deterministic
 * and never touch a real backend.
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://e2e.supabase.test',
  supabaseAnonKey: 'e2e-anon-key',
};
