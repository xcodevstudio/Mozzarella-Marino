import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL;
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.error('Missing env vars: RESEND_API_KEY or CONTACT_TO_EMAIL');
    return res.status(500).json({ error: 'Server is not configured to send email.' });
  }

  const body = req.body || {};
  const name = (body.name || '').toString().trim().slice(0, 80);
  const email = (body.email || '').toString().trim().slice(0, 120);
  const phone = (body.phone || '').toString().trim().slice(0, 30);
  const message = (body.message || '').toString().trim().slice(0, 2000);
  const honeypot = (body.website || '').toString();

  // Bot caught — pretend success
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
    return res.status(400).json({ error: 'Please fill out all required fields correctly.' });
  }

  const subject = `New inquiry from ${name} — Mozzarella Marino website`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2a2a;">
      <div style="background: #842520; color: #fef9f0; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px;">New Contact Form Submission</h1>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Mozzarella Marino website</p>
      </div>
      <div style="background: #fef9f0; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #842520;">${escapeHtml(email)}</a></p>
        ${phone ? `<p style="margin: 0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
        <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
        <div style="background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e7e1d5; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</div>
      </div>
    </div>
  `;

  const text = [
    `New contact form submission — Mozzarella Marino`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : '',
    ``,
    `Message:`,
    message,
  ].filter(Boolean).join('\n');

  try {
    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: `Mozzarella Marino <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      replyTo: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'Could not deliver the message. Please try again later.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again later.' });
  }
}
