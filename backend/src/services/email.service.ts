import nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string;
  code: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT) || 587;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });
    }
    return this.transporter;
  }

  /**
   * Sends 6-digit OTP verification email
   */
  static async sendVerificationEmail({ to, code }: SendEmailParams): Promise<boolean> {
    // Fallback for test or missing credentials (Ponytail zero-blocker)
    if (process.env.NODE_ENV === 'test' || !process.env.SMTP_PASS) {
      console.log(`\n📧 [DEV/TEST MOCK EMAIL] To: ${to} | Verification Code: [ ${code} ] (Valid for 5 mins)\n`);
      return true;
    }

    const mailOptions = {
      from: `"FitterSweat" <${process.env.SMTP_USER || 'noreply@fittersweat.com'}>`,
      to,
      subject: '[FitterSweat] 회원가입 이메일 인증번호 안내',
      html: `
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
      `,
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
      return true;
    } catch (err: any) {
      console.error('Email send failed via Nodemailer:', err);
      throw new Error(`이메일 발송에 실패했습니다: ${err.message || 'SMTP 통신 오류'}`);
    }
  }
}
