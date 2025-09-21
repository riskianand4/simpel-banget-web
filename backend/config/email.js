import nodemailer from "nodemailer";

async function main() {
  // konfigurasi transporter
  const transporter = nodemailer.createTransport({
    host: "mail.telnet.co.id",
    port: 465,               
    secure: true,            
    auth: {
      user: "inventori@telnet.co.id", 
      pass: "Telnet@Aceh"       
    }
  });

  try {
    let info = await transporter.sendMail({
      from: '"Inventori Telnet" <inventori@telnet.co.id>', 
      to: "rizki@telnet.co.id",            
      subject: "Tes Email Aktivasi",
      html: "<h3>Halo, ini email test dari inventori@telnet.co.id</h3>"
    });

    console.log("✅ Email terkirim:", info.messageId);
  } catch (err) {
    console.error("❌ Error kirim email:", err);
  }
}

main();
