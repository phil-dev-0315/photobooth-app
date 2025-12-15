import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const eventId = formData.get('eventId') as string;
    const assetType = formData.get('assetType') as 'frame' | 'logo' | 'overlay';

    if (!file || !bucket || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${eventId}/${timestamp}-${file.name}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // For overlay uploads, just return the URL without creating a layout
    if (assetType === 'overlay') {
      return NextResponse.json({
        success: true,
        data: {
          url: publicUrl,
          path: fileName,
        }
      });
    }

    // Get optional width, height, placeholders, and overlays from form data
    const width = formData.get('width');
    const height = formData.get('height');
    const placeholdersStr = formData.get('placeholders');
    const overlaysStr = formData.get('overlays');

    let placeholders = [];
    if (placeholdersStr) {
      try {
        placeholders = JSON.parse(placeholdersStr as string);
      } catch (e) {
        console.error('Failed to parse placeholders:', e);
      }
    }

    let overlays = [];
    if (overlaysStr) {
      try {
        overlays = JSON.parse(overlaysStr as string);
      } catch (e) {
        console.error('Failed to parse overlays:', e);
      }
    }

    // Create event layout record
    const layoutData = {
      event_id: eventId,
      layout_type: assetType === 'frame' ? 'custom' : 'default',
      frame_url: publicUrl,
      include_message: false,
      include_logo: assetType === 'logo',
      is_default: false,
      width: width ? parseInt(width as string) : 1080,
      height: height ? parseInt(height as string) : 1920,
      placeholders: placeholders,
      overlays: overlays,
    };

    const { data: layout, error: layoutError } = await supabaseAdmin
      .from('event_layouts')
      .insert([layoutData])
      .select()
      .single();

    if (layoutError) {
      // If layout creation fails, try to delete the uploaded file
      await supabaseAdmin.storage.from(bucket).remove([fileName]);
      throw new Error(`Failed to create layout: ${layoutError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        path: fileName,
        layout
      }
    });
  } catch (error: any) {
    console.error('Asset upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
