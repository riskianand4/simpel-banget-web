const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "mail.telnet.co.id",
      port: 465,
      secure: true,
      auth: {
        user: "inventori@telnet.co.id",
        pass: "Telnet@Aceh"
      }
    });
  }

  // Send verification code email
  async sendVerificationCode(email, code, type, userName = null, newEmail = null) {
    const emailTemplates = {
      user_creation: {
        subject: 'Kode Aktivasi Akun Inventori Telnet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Aktivasi Akun Inventori Telnet</h2>
            <p>Halo <strong>${userName || 'User'}</strong>,</p>
            <p>Akun Anda telah dibuat oleh admin. Untuk mengaktifkan akun, gunakan kode verifikasi berikut:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Kode ini berlaku selama <strong>10 menit</strong></li>
              <li>Jangan bagikan kode ini kepada siapapun</li>
              <li>Masukkan kode ini pada halaman verifikasi</li>
            </ul>
            <p>Jika Anda tidak meminta pembuatan akun ini, abaikan email ini.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Tim Inventori Telnet<br>
              Email: inventori@telnet.co.id
            </p>
          </div>
        `
      },
      email_change_old: {
        subject: 'Konfirmasi Perubahan Email - Verifikasi Email Lama',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Konfirmasi Perubahan Email</h2>
            <p>Halo <strong>${userName || 'User'}</strong>,</p>
            <p>Anda meminta perubahan email dari <strong>${email}</strong> ke <strong>${newEmail}</strong>.</p>
            <p>Untuk mengkonfirmasi perubahan ini, gunakan kode verifikasi berikut:</p>
            <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #dc2626; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            <p><strong>Langkah selanjutnya:</strong></p>
            <ol>
              <li>Masukkan kode ini untuk konfirmasi email lama</li>
              <li>Kode verifikasi akan dikirim ke email baru Anda</li>
              <li>Verifikasi email baru untuk menyelesaikan perubahan</li>
            </ol>
            <p>Kode berlaku selama <strong>10 menit</strong>. Jika Anda tidak meminta perubahan ini, segera hubungi admin.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Tim Inventori Telnet<br>
              Email: inventori@telnet.co.id
            </p>
          </div>
        `
      },
      email_change_new: {
        subject: 'Verifikasi Email Baru - Inventori Telnet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Verifikasi Email Baru</h2>
            <p>Halo <strong>${userName || 'User'}</strong>,</p>
            <p>Email ini dikirim untuk memverifikasi alamat email baru Anda: <strong>${email}</strong></p>
            <p>Gunakan kode verifikasi berikut untuk menyelesaikan perubahan email:</p>
            <div style="background: #f0fdf4; border: 2px solid #059669; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #059669; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            <p>Setelah verifikasi berhasil, email Anda akan berubah ke alamat ini.</p>
            <p>Kode berlaku selama <strong>10 menit</strong>.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Tim Inventori Telnet<br>
              Email: inventori@telnet.co.id
            </p>
          </div>
        `
      },
      password_change: {
        subject: 'Konfirmasi Perubahan Password - Inventori Telnet',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Konfirmasi Perubahan Password</h2>
            <p>Halo <strong>${userName || 'User'}</strong>,</p>
            <p>Anda meminta perubahan password untuk akun dengan email: <strong>${email}</strong></p>
            <p>Gunakan kode verifikasi berikut untuk mengkonfirmasi perubahan password:</p>
            <div style="background: #faf5ff; border: 2px solid #7c3aed; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #7c3aed; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            <p><strong>Keamanan:</strong></p>
            <ul>
              <li>Kode berlaku selama <strong>10 menit</strong></li>
              <li>Jangan bagikan kode ini kepada siapapun</li>
              <li>Jika Anda tidak meminta perubahan ini, segera hubungi admin</li>
            </ul>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Tim Inventori Telnet<br>
              Email: inventori@telnet.co.id
            </p>
          </div>
        `
      }
    };

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Invalid email template type: ${type}`);
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Inventori Telnet" <inventori@telnet.co.id>',
        to: email,
        subject: template.subject,
        html: template.html
      });

      console.log(`✅ Email sent successfully: ${info.messageId} to ${email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();