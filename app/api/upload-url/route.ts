import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { eventId, fileType = 'image/png' } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${eventId}/${timestamp}-${randomStr}.png`;

    // Create signed upload URL (valid for 2 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from('composites')
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error('Signed URL error:', error);
      return NextResponse.json(
        { error: `Failed to create upload URL: ${error.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the file (will be valid after upload)
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('composites')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: fileName,
        publicUrl: publicUrl
      }
    });

  } catch (error: any) {
    console.error('Upload URL API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
