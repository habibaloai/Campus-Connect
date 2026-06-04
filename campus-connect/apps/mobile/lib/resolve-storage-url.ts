import Constants from 'expo-constants';

const OLD_SUPABASE_HOST = 'ojmkhimriptucfsulfzv.supabase.co';

function getCurrentSupabaseHost(): string | null {
  const url =
    Constants.expoConfig?.extra?.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url.trim()).host;
  } catch {
    return null;
  }
}

/**
 * Normalizes avatar/storage URLs after a Supabase project migration.
 * - Rewrites old project host to the current EXPO_PUBLIC_SUPABASE_URL host
 * - Trims stray spaces and %20 from migrated URLs
 */
export function resolveStorageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  let resolved = url.trim();
  if (!resolved) return null;

  const currentHost = getCurrentSupabaseHost();
  if (currentHost && resolved.includes(OLD_SUPABASE_HOST)) {
    resolved = resolved.replace(OLD_SUPABASE_HOST, currentHost);
  }

  // Fix filenames uploaded with a trailing space (stored as %20 in URL)
  resolved = resolved.replace(/%20+$/i, '').replace(/\s+$/, '');

  return resolved;
}
