import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private resend: Resend
  private fromEmail: string

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get('RESEND_API_KEY')
    this.resend = new Resend(resendApiKey) ?? null;
    this.fromEmail = this.configService.get('FROM_EMAIL')
  }

  /**
   * Sends a password reset email with verification code
   */
  async sendPasswordResetEmail(
    email: string,
    verificationCode: string,
    name: string
  ) {
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Password Reset Request',
      html: this.getPasswordResetTemplate(verificationCode, name),
    })

    if (error) {
      throw new InternalServerErrorException('Failed to send email. Please try again later.');
    }

    return data
  }

  /**
   * Generate the HTML template for password reset emails
   */
  private getPasswordResetTemplate(code: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h2 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .code-container {
            text-align: center;
            margin: 30px 0;
          }
          .code {
            display: inline-block;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #e74c3c;
            padding: 15px 25px;
            background-color: #f8f9fa;
            border: 2px dashed #e74c3c;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
          }
          .content {
            color: #555;
            font-size: 16px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            font-size: 14px;
            color: #7f8c8d;
            margin-top: 30px;
            text-align: center;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Password Reset Request</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Please use the verification code below to complete the password reset process:</p>
          </div>
          
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This code will expire in 5 minutes for security reasons.
          </div>
          
          <div class="content">
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>For security reasons, please do not share this code with anyone.</p>
            <p>Best regards,<br><strong>The Support Team</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email, please do not reply to this message.</p>
          <p>If you need assistance, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;
  }
}