require('dotenv').config();
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '465');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM_EMAIL || user;
const fromName = process.env.SMTP_FROM_NAME || 'NaukriMili';

console.log('Testing SMTP Configuration...');
console.log('Host:', host);
console.log('Port:', port);
console.log('User:', user ? user.split('@')[0] + '@***' : 'Not set');
console.log('From:', fromEmail);
console.log('');

if (!host || !user || !pass) {
  console.error('❌ SMTP configuration missing!');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass }
});

console.log('Verifying SMTP connection...');
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP Verification Failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection: SUCCESS');
    console.log('');
    console.log('Sending test email...');
    const recipient = process.argv[2] || user;
    transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: recipient,
      subject: 'SMTP Test Email from NaukriMili',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"><h2 style="color: #2563eb;">✅ SMTP Email Test Successful!</h2><p>This email confirms that your SMTP configuration is working correctly.</p><p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p><p><strong>Method:</strong> SMTP (${host})</p></div>`,
      text: `SMTP Test Email from NaukriMili\n\nSent at: ${new Date().toLocaleString()}\n\nIf you received this email, your SMTP configuration is working correctly!`
    }, (error, info) => {
      if (error) {
        console.error('❌ Email Send Failed:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Email Sent Successfully!');
        console.log('To:', recipient);
        console.log('Message ID:', info.messageId);
        process.exit(0);
      }
    });
  }
});

