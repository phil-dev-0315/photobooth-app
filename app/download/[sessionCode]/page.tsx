import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import DownloadClient from './DownloadClient';

interface PageProps {
  params: Promise<{ sessionCode: string }>;
}

// Fetch session data on the server
async function getSession(sessionCode: string) {
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      id,
      session_code,
      composite_url,
      message,
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
    return null;
  }

  return session;
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionCode } = await params;
  const session = await getSession(sessionCode);

  if (!session) {
    return {
      title: 'Photo Not Found',
    };
  }

  const eventName = (session.events as any)?.name || 'Photobooth';

  return {
    title: `Download Photo - ${eventName}`,
    description: `Download your photo from ${eventName}`,
    openGraph: {
      title: `Download Photo - ${eventName}`,
      description: `Download your photo from ${eventName}`,
      images: session.composite_url ? [session.composite_url] : [],
    },
  };
}

export default async function DownloadPage({ params }: PageProps) {
  const { sessionCode } = await params;
  const session = await getSession(sessionCode);

  if (!session) {
    notFound();
  }

  // events is returned from Supabase join - cast through unknown to handle typing
  const eventData = (session.events as unknown) as { id: string; name: string; logo_url: string | null } | null;

  return (
    <DownloadClient
      session={{
        id: session.id,
        sessionCode: session.session_code,
        compositeUrl: session.composite_url,
        message: session.message,
        createdAt: session.created_at,
        event: eventData,
      }}
    />
  );
}
