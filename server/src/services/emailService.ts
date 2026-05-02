import { Resend } from 'resend';
import SmtpError from '../api/errors/SmtpError.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, rawToken: string): Promise<void>
{
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const link = `${frontendUrl}/verify-email?token=${rawToken}`;

    const { error } = await resend.emails.send({
        from: process.env.FROM_EMAIL ?? 'onboarding@resend.dev',
        to,
        subject: 'Verify your email address',
        html: `
            <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
            <a href="${link}">${link}</a>
        `,
    });

    if (error) {
        throw new SmtpError({ cause: error });
    }
}
