import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('layoutId');
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!layoutId || !bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue even if storage delete fails
    }

    // Delete event layout record
    const { error: layoutError } = await supabaseAdmin
      .from('event_layouts')
      .delete()
      .eq('id', layoutId);

    if (layoutError) {
      throw new Error(`Failed to delete layout: ${layoutError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Asset delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
