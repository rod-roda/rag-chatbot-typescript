// import { Resend } from 'resend';
// import SmtpError from '../api/errors/SmtpError.js';

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendVerificationEmail(to: string, rawToken: string): Promise<void>
// {
//     const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
//     const link = `${frontendUrl}/verify-email?token=${rawToken}`;

//     const { error } = await resend.emails.send({
//         from: process.env.FROM_EMAIL ?? 'onboarding@resend.dev',
//         to,
//         subject: 'Verify your email address',
//         html: `
//             <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
//             <a href="${link}">${link}</a>
//         `,
//     });

//     if (error) {
//         throw new SmtpError({ cause: error });
//     }
// }

import nodemailer from 'nodemailer';
import SmtpError from '../api/errors/SmtpError.js';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5_000,
    socketTimeout: 10_000,
});

export async function sendVerificationEmail(to: string, rawToken: string): Promise<void>
{
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const link = `${frontendUrl}/verify-email?token=${rawToken}`;

    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to,
            subject: 'Verify your email address',
            html: `
                <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
                <a href="${link}">${link}</a>
            `,
        });
    } catch (cause) {
        throw new SmtpError({ cause });
    }
}
