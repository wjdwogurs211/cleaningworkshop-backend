const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) 트랜스포터 생성
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // 2) 이메일 옵션 정의
  const mailOptions = {
    from: '청소공작소 <noreply@cleaninglab.co.kr>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<pre>${options.message}</pre>`
  };

  // 3) 이메일 전송
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;