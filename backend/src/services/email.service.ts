import nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string;
  code: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(portOverride?: number): nodemailer.Transporter {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = portOverride || Number(process.env.SMTP_PORT) || (host.includes('gmail') ? 465 : 587);
    const isSecure = port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  /**
   * Sends 6-digit OTP verification email
   */
  static async sendVerificationEmail({ to, code }: SendEmailParams): Promise<boolean> {
    const htmlContent = `
        <div style="background-color: #0A0A0A; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #141414; border: 1px solid #262626; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <tr>
              <td>
                <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: -0.5px; font-style: italic;">
                  FITTER<span style="color: #FFD700;">SWEAT</span>
                </h1>
                <p style="color: #A3A3A3; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  국내 1위 HYROX 커뮤니티 커머스 FitterSweat에 오신 것을 환영합니다.<br/>
                  회원가입 인증을 위해 아래 6자리 인증번호를 5분 이내에 입력해 주세요.
                </p>
                <div style="background-color: #1F1F1F; border: 1px solid #FFD700; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <div style="font-size: 12px; color: #8A8A8A; margin-bottom: 8px; font-weight: 700; letter-spacing: 1px;">인증 코드 (5분 유효)</div>
                  <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #FFD700; font-family: monospace;">
                    ${code}
                  </span>
                </div>
                <p style="color: #737373; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
                  • 본 인증번호는 발송 시점으로부터 5분 동안만 유효합니다.<br/>
                  • 5회 이상 인증번호 입력을 실패할 경우 보안을 위해 재발송이 필요합니다.
                </p>
                <div style="border-top: 1px solid #262626; margin-top: 20px; padding-top: 16px;">
                  <p style="color: #525252; font-size: 11px; margin: 0;">
                    본 메일은 발신 전용 메일입니다. 본인이 요청하지 않은 경우 이 메일을 무시하셔도 안전합니다.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;

    // 1순위: Resend HTTPS REST API (Port 443 - Railway 방화벽에 영향받지 않는 클라우드 표준)
    // ponytail: node 18+ global fetch 사용, 무거운 외부 SDK 없이 의존성 제로로 구현
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
      try {
        const fromEmail = process.env.RESEND_FROM || 'FitterSweat <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject: '[FitterSweat] 회원가입 이메일 인증번호 안내',
            html: htmlContent,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          console.log(`✅ [RESEND SUCCESS] Verification email sent to ${to} (ID: ${(data as any).id || 'ok'})`);
          return true;
        } else {
          console.warn(`⚠️ [RESEND FAILED] Status ${response.status}:`, data);
        }
      } catch (resendErr: any) {
        console.warn(`⚠️ [RESEND EXCEPTION]: ${resendErr.message}. Trying SMTP fallback...`);
      }
    }

    // Fallback for test or missing credentials (Ponytail zero-blocker)
    if (process.env.NODE_ENV === 'test' || !process.env.SMTP_PASS) {
      console.log(`\n📧 [DEV/TEST MOCK EMAIL] To: ${to} | Verification Code: [ ${code} ] (Valid for 5 mins)\n`);
      return true;
    }

    const mailOptions = {
      from: `"FitterSweat" <${process.env.SMTP_USER || 'noreply@fittersweat.com'}>`,
      to,
      subject: '[FitterSweat] 회원가입 이메일 인증번호 안내',
      html: htmlContent,
    };

    try {
      // 1차 시도: 포트 465 (SSL)
      await this.getTransporter(465).sendMail(mailOptions);
      return true;
    } catch (err465: any) {
      console.warn('SMTP Port 465 failed, trying Port 587 fallback:', err465.message);
      try {
        // 2차 시도: 포트 587 (STARTTLS)
        await this.getTransporter(587).sendMail(mailOptions);
        return true;
      } catch (err587: any) {
        console.error('Email send failed via both Port 465 and 587:', err587);
        throw new Error(`이메일 발송에 실패했습니다: ${err587.message || err465.message || 'SMTP 통신 오류'}`);
      }
    }
  }
}
