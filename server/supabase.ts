// @ts-ignore — installed via: npm install @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";
type SupabaseClient = ReturnType<typeof createClient>;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  Supabase env vars not fully set. Storage and Auth features will be degraded.");
}

// Public client — for client-facing operations (respects RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Admin client — full access, bypasses RLS. Server-side only.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ========================================
// STORAGE HELPERS
// ========================================

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "school-documents";

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ url: string; path: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
  return { url: urlData.publicUrl, path: data.path };
}

/**
 * Get a signed (temporary) URL for private files.
 */
export async function getSignedUrl(
  path: string,
  expiresInSeconds: number = 3600,
  bucket: string = DEFAULT_BUCKET
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Get permanent public URL for a file.
 */
export function getPublicUrl(path: string, bucket: string = DEFAULT_BUCKET): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

// ========================================
// AUTH HELPERS (Server-side)
// ========================================

/**
 * Verify a Supabase JWT and return the user.
 * Use for Supabase Auth sessions (separate from our JWT).
 */
export async function verifySupabaseToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Create a Supabase-managed user (used for OAuth flow).
 */
export async function createSupabaseUser(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata ?? {},
  });
  if (error) throw new Error(`Supabase user creation failed: ${error.message}`);
  return data.user;
}

/**
 * Get OAuth sign-in URL for Google provider.
 */
export function getGoogleOAuthUrl(redirectTo: string): string {
  const { data } = supabase.auth.signInWithIdToken as any;
  // Return Supabase's Google OAuth URL
  const baseUrl = `${SUPABASE_URL}/auth/v1/authorize`;
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo,
  });
  return `${baseUrl}?${params.toString()}`;
}
