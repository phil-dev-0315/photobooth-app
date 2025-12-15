import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { count: totalEvents } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true });

    const { count: activeEvents } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalSessions } = await supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    const today = new Date().toISOString().split('T')[0];
    const { count: todaySessions } = await supabaseAdmin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const { count: totalPhotos } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      data: {
        totalEvents: totalEvents || 0,
        activeEvents: activeEvents || 0,
        totalSessions: totalSessions || 0,
        todaySessions: todaySessions || 0,
        totalPhotos: totalPhotos || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
