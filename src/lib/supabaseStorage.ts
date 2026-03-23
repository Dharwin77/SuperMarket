import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path where file should be stored
 * @param file - File object to upload
 * @returns Public URL of uploaded file or null on error
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path of file to delete
 * @returns true if successful, false otherwise
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Upload staff profile photo
 * @param file - Image file
 * @param staffId - Staff UUID
 * @returns Public URL of uploaded photo
 */
export async function uploadStaffPhoto(
  file: File,
  staffId: string
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${staffId}-${Date.now()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  return uploadFile('staff-photos', filePath, file);
}

/**
 * Delete staff profile photo
 * @param photoUrl - Full URL of the photo
 * @returns true if successful
 */
export async function deleteStaffPhoto(photoUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split('/');
    const filePath = `public/${pathParts[pathParts.length - 1]}`;

    return deleteFile('staff-photos', filePath);
  } catch (error) {
    console.error('Error parsing photo URL:', error);
    return false;
  }
}
