import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/stickers - Get stickers for an event
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('stickers')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/stickers - Upload new sticker with file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string | null;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'File and Event ID are required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${eventId}/${timestamp}-${file.name}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('stickers')
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
      .from('stickers')
      .getPublicUrl(fileName);

    // Create sticker record
    const stickerData = {
      event_id: eventId,
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      url: publicUrl,
      category: category || null,
    };

    const { data, error } = await supabaseAdmin
      .from('stickers')
      .insert([stickerData])
      .select()
      .single();

    if (error) {
      // If sticker record creation fails, delete the uploaded file
      await supabaseAdmin.storage.from('stickers').remove([fileName]);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/stickers - Delete sticker
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Sticker ID is required' },
      { status: 400 }
    );
  }

  try {
    // First, get the sticker to find the file path
    const { data: sticker, error: fetchError } = await supabaseAdmin
      .from('stickers')
      .select('url, event_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL and delete from storage
    if (sticker?.url) {
      try {
        const url = new URL(sticker.url);
        const pathParts = url.pathname.split('/');
        const stickersBucketIndex = pathParts.indexOf('stickers');
        if (stickersBucketIndex !== -1) {
          const filePath = pathParts.slice(stickersBucketIndex + 1).join('/');
          await supabaseAdmin.storage.from('stickers').remove([filePath]);
        }
      } catch (e) {
        // Continue even if file deletion fails
        console.error('Failed to delete sticker file:', e);
      }
    }

    // Delete the database record
    const { error } = await supabaseAdmin
      .from('stickers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
