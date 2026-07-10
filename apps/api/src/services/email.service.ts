import nodemailer from 'nodemailer'
import type { FastifyBaseLogger } from 'fastify'

/**
 * Configuração do transporter de email
 * Em desenvolvimento usa Mailpit (localhost:1025)
 * Em produção usa SMTP configurado via env vars
 */
const createTransporter = () => {
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    // Mailpit para desenvolvimento
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
      auth: undefined, // Mailpit não requer autenticação
    })
  }

  // Produção com SMTP real
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true para porta 465, false para outras
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  })
}

const transporter = createTransporter()

/**
 * Envia email de recuperação de senha
 * @param to Email do destinatário
 * @param resetLink Link completo de recuperação
 * @param name Nome do usuário
 * @param logger Logger do Fastify para auditoria
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  name: string,
  logger: FastifyBaseLogger
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@localhost',
      to,
      subject: 'Recuperação de Senha - WA SaaS',
      html: generatePasswordResetEmailHTML(name, resetLink),
      text: generatePasswordResetEmailText(name, resetLink),
    })

    logger.info(
      {
        event: 'email_sent',
        type: 'password_reset',
        to,
        messageId: info.messageId,
      },
      'Password reset email sent successfully'
    )
  } catch (error) {
    logger.error(
      {
        event: 'email_send_failed',
        type: 'password_reset',
        to,
        error,
      },
      'Failed to send password reset email'
    )
    throw error
  }
}

/**
 * Gera HTML do email de recuperação de senha
 */
function generatePasswordResetEmailHTML(name: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      color: #2563eb;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Recuperação de Senha</h2>
    
    <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
    
    <p>Você solicitou a recuperação de senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
    
    <a href="${escapeHtml(resetLink)}" class="button">Redefinir Senha</a>
    
    <div class="warning">
      <strong>⚠️ Importante:</strong> Este link expira em <strong>1 hora</strong> e pode ser usado apenas uma vez.
    </div>
    
    <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
    <p style="word-break: break-all; color: #2563eb;">${escapeHtml(resetLink)}</p>
    
    <div class="footer">
      <p><strong>Não solicitou esta recuperação?</strong></p>
      <p>Se você não pediu para redefinir sua senha, ignore este email. Sua senha permanecerá a mesma.</p>
      <p style="margin-top: 20px;">WA SaaS - Sistema de Gerenciamento WhatsApp</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Gera versão texto plano do email
 */
function generatePasswordResetEmailText(name: string, resetLink: string): string {
  return `
Recuperação de Senha - WA SaaS

Olá, ${name}!

Você solicitou a recuperação de senha da sua conta.

Para redefinir sua senha, acesse o link abaixo:
${resetLink}

IMPORTANTE: Este link expira em 1 hora e pode ser usado apenas uma vez.

Não solicitou esta recuperação?
Se você não pediu para redefinir sua senha, ignore este email.
Sua senha permanecerá a mesma.

---
WA SaaS - Sistema de Gerenciamento WhatsApp
  `.trim()
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * Verifica se o serviço de email está configurado corretamente
 */
export async function verifyEmailService(logger: FastifyBaseLogger): Promise<boolean> {
  try {
    await transporter.verify()
    logger.info('Email service is ready')
    return true
  } catch (error) {
    logger.warn({ error }, 'Email service is not configured or not available')
    return false
  }
}
