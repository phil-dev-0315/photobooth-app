import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Basic email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, compositeUrl, sessionCode, eventName } = body;

    // Validate required fields
    if (!email || !compositeUrl || !sessionCode) {
      return NextResponse.json(
        { error: 'Missing required fields: email, compositeUrl, and sessionCode are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    // Build the download page URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const downloadUrl = `${appUrl}/download/${sessionCode}`;

    // Build email HTML
    const eventDisplayName = eventName || 'Photobooth';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Your Photobooth Photo!</h1>
                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">${eventDisplayName}</p>
              </div>

              <!-- Content -->
              <div style="padding: 32px 24px;">
                <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                  Thanks for visiting! Here's your photo from the event. Click below to view and download it.
                </p>

                <!-- Photo Preview -->
                <div style="margin: 0 0 24px; text-align: center;">
                  <img
                    src="${compositeUrl}"
                    alt="Your photobooth photo"
                    style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
                  />
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a
                    href="${downloadUrl}"
                    style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;"
                  >
                    View & Download Photo
                  </a>
                </div>

                <!-- Session Code -->
                <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                  Session Code: ${sessionCode}
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  Powered by Photobooth App
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Photobooth <onboarding@resend.dev>',
      to: [email],
      subject: `Your Photo from ${eventDisplayName}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: { id: data?.id }
    });

  } catch (error: any) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
