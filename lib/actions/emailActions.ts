'use server'

export async function sendSupportEmail(formData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return { success: false, error: 'Identity Bridge Failure: Email API key not found.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Smart Notes Support <smart@notes.biz.id>',
        to: ['damnbayu@gmail.com'], // Notification destination
        reply_to: formData.email,
        subject: `[SUPPORT] ${formData.subject}`,
        html: `
          <div style="font-family: sans-serif; padding: 40px; background-color: #f9fafb; border-radius: 20px;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #7c3aed; font-size: 10px;">Support Matrix Notification</p>
            <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin-top: 10px; margin-bottom: 20px;">New Inquiry Received</h1>
            
            <div style="background-color: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; margin-bottom: 10px; font-size: 14px;"><strong>From:</strong> ${formData.name} (${formData.email})</p>
              ${formData.phone ? `<p style="margin: 0; margin-bottom: 10px; font-size: 14px;"><strong>Phone:</strong> ${formData.phone}</p>` : ''}
              <p style="margin: 0; margin-bottom: 20px; font-size: 14px;"><strong>Subject:</strong> ${formData.subject}</p>
              
              <div style="height: 1px; background-color: #f3f4f6; margin-bottom: 20px;"></div>
              
              <p style="margin: 0; font-style: italic; color: #4b5563; line-height: 1.6;">"${formData.message}"</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Resend API error');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email action error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendManuscriptEmail(params: {
  to: string;
  shareUrl: string;
  fileName: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return { success: false, error: 'Identity Bridge Failure: Email API key not found.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'SpyMaster Intelligence <smart@notes.biz.id>',
        to: [params.to],
        subject: `[INTELLIGENCE] Manuscript Shared: ${params.fileName}`,
        html: `
          <div style="font-family: sans-serif; padding: 40px; background-color: #0f172a; color: #f8fafc; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="background: #1e293b; padding: 8px 16px; border-radius: 99px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: #38bdf8; border: 1px solid #334155;">SOVEREIGNTY PROTOCOL ACTIVATED</span>
            </div>
            
            <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; text-align: center; margin-bottom: 20px;">Manuscript Transmission</h1>
            
            <div style="background-color: #1e293b; padding: 32px; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
              <p style="margin: 0; margin-bottom: 15px; font-size: 16px; color: #94a3b8;">A secure intelligence document has been shared with you:</p>
              <p style="margin: 0; margin-bottom: 30px; font-size: 20px; font-weight: 700; color: #38bdf8;">${params.fileName}</p>
              
              <div style="text-align: center;">
                <a href="${params.shareUrl}" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 14px 0 rgba(56, 189, 248, 0.39);">ACCESS MANUSCRIPT</a>
              </div>
            </div>
            
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #64748b;">
              This transmission is peer-to-peer and encrypted. The link provided may have an expiration period.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Resend API error');
    }

    return { success: true };
  } catch (error) {
    const err = error as Error;
    console.error('Manuscript email error:', err);
    return { success: false, error: err.message };
  }
}
