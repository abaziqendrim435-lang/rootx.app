// ============================================================
// RootX — Server-side Supabase Storage client for product images
// Uses the service-role key. Never expose this module to the client.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGE_BUCKET = 'rootx-product-images';

export function isProductionPersistenceRequired(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getSupabaseStorageClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url.startsWith('http') || url.includes('your_supabase')) return null;
  if (!serviceKey || serviceKey.length < 20 || serviceKey.includes('your_')) return null;

  return createClient(url, serviceKey);
}

export function isDurablePersistedUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean.startsWith('https://')) return false;
  if (clean.includes(`/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`)) return true;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  if (supabaseUrl && clean.startsWith(supabaseUrl) && clean.includes(PRODUCT_IMAGE_BUCKET)) {
    return true;
  }

  return false;
}

export function isAcceptedPersistedUrl(url: string | undefined | null): boolean {
  if (isDurablePersistedUrl(url)) return true;
  if (
    !isProductionPersistenceRequired() &&
    typeof url === 'string' &&
    (url.startsWith('/cached-images/') || url.startsWith('cached-images/'))
  ) {
    return true;
  }
  return false;
}

export async function uploadProductImage(params: {
  generationId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ publicUrl: string; storagePath: string }> {
  const client = getSupabaseStorageClient();
  if (!client) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for durable product image persistence.'
    );
  }

  const objectPath = `${params.generationId}/${params.filename}`;
  const { error } = await client.storage.from(PRODUCT_IMAGE_BUCKET).upload(objectPath, params.buffer, {
    contentType: params.mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl?.trim() || '';

  if (!publicUrl.startsWith('https://')) {
    throw new Error('Supabase Storage did not return a public HTTPS URL.');
  }

  return {
    publicUrl,
    storagePath: `${PRODUCT_IMAGE_BUCKET}/${objectPath}`,
  };
}
