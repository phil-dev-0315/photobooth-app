import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Generate a unique 6-character alphanumeric session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if session code already exists
async function isSessionCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('session_code', code)
    .single();
  return !data;
}

// Generate a unique session code (with retry)
async function getUniqueSessionCode(): Promise<string> {
  let code = generateSessionCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (!(await isSessionCodeUnique(code)) && attempts < maxAttempts) {
    code = generateSessionCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique session code');
  }

  return code;
}

export async function POST(request: NextRequest) {
  try {
    // Parse FormData instead of JSON to handle larger file uploads
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;
    const message = formData.get('message') as string | null;

    // Validate required fields
    if (!eventId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId and file are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Expected an image file.' },
        { status: 400 }
      );
    }

    // Generate unique session code
    const sessionCode = await getUniqueSessionCode();

    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${eventId}/${timestamp}-${randomStr}.png`;

    // Upload to composites bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('composites')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload composite: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('composites')
      .getPublicUrl(fileName);

    // Insert session record with generated session_code
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert([
        {
          event_id: eventId,
          session_code: sessionCode,
          composite_url: publicUrl,
          message: message || null,
          is_printed: false
        }
      ])
      .select('id, session_code, composite_url, message, created_at')
      .single();

    if (sessionError) {
      // Clean up uploaded file if session creation fails
      await supabaseAdmin.storage.from('composites').remove([fileName]);
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionCode: session.session_code,
        compositeUrl: session.composite_url,
        sessionId: session.id,
        message: session.message,
        createdAt: session.created_at
      }
    });

  } catch (error: any) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save session' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch session by code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionCode = searchParams.get('code');

    if (!sessionCode) {
      return NextResponse.json(
        { error: 'Session code is required' },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        session_code,
        composite_url,
        message,
        is_printed,
        created_at,
        events (
          id,
          name,
          logo_url
        )
      `)
      .eq('session_code', sessionCode)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error: any) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
