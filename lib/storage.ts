import { createClient } from '@supabase/supabase-js';
import type { UploadResult } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export type BucketName = 'frames' | 'logos' | 'photos' | 'composites';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: BucketName,
  file: File,
  path?: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const fileName = path || `${timestamp}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName
  };
}

/**
 * Upload a base64 image (from canvas/camera) to Supabase Storage
 */
export async function uploadBase64Image(
  bucket: BucketName,
  base64Data: string,
  fileName: string
): Promise<UploadResult> {
  // Convert base64 to blob
  const response = await fetch(base64Data);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(
  bucket: BucketName,
  path: string
): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * List files in a bucket
 */
export async function listFiles(
  bucket: BucketName,
  path: string = ''
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}
