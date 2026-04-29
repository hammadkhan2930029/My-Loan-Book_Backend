const nodemailer = require('nodemailer');

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const {SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS} = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is incomplete');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const getPurposeCopy = purpose => {
  if (purpose === 'register') {
    return {
      subject: 'Digital Loan Tracker registration verification code',
      title: 'Verify your Digital Loan Tracker account',
      eyebrow: 'Secure Access',
      message: 'Use the verification code below to complete your account setup.',
    };
  }

  return {
    subject: 'Digital Loan Tracker password reset verification code',
    title: 'Verify your password reset request',
    eyebrow: 'Password Reset',
    message: 'Use the verification code below to continue resetting your password.',
  };
};

const sendOtpEmail = async (email, code, purpose) => {
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!smtpFrom) {
    throw new Error('SMTP_FROM or SMTP_USER must be configured');
  }

  const {subject, title, eyebrow, message} = getPurposeCopy(purpose);
  const html = `
    <div style="margin:0; padding:32px 16px; background-color:#f6f8fb; font-family:Arial, sans-serif; color:#203049;">
      <div style="max-width:560px; margin:0 auto;">
        <div style="margin-bottom:18px; text-align:center;">
          <span style="display:inline-block; background-color:#203049; color:#ffffff; font-size:12px; font-weight:700; letter-spacing:0.8px; padding:8px 14px; border-radius:999px;">
            ${eyebrow}
          </span>
        </div>

        <div style="background-color:#ffffff; border:1px solid #c5ced9; border-radius:28px; box-shadow:0 14px 32px rgba(32,48,73,0.08); overflow:hidden;">
          <div style="position:relative; padding:28px 28px 22px; background:linear-gradient(180deg, #eef3f8 0%, #ffffff 100%);">
            <div style="position:absolute; top:-34px; right:-20px; width:112px; height:112px; border-radius:999px; background-color:#ffe2c7;"></div>
            <div style="position:absolute; bottom:-36px; left:-18px; width:96px; height:96px; border-radius:999px; background-color:#dce6f0;"></div>

            <div style="position:relative; z-index:1;">
              <div style="font-size:24px; line-height:30px; font-weight:700; color:#203049; margin-bottom:10px;">
                ${title}
              </div>
              <div style="font-size:15px; line-height:22px; color:#607086;">
                ${message}
              </div>
            </div>
          </div>

          <div style="padding:24px 28px 28px;">
            <div style="background-color:#fff4ea; border:1px solid #ffc28a; border-radius:24px; padding:22px 18px; text-align:center;">
              <div style="font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#d9620f; margin-bottom:10px;">
                Verification Code
              </div>
              <div style="font-size:32px; line-height:38px; font-weight:700; letter-spacing:8px; color:#ec7418;">
                ${code}
              </div>
            </div>

            <div style="margin-top:18px; background-color:#eef2f6; border-radius:20px; padding:14px 16px;">
              <div style="font-size:13px; line-height:18px; color:#607086;">
                This code will expire in <strong style="color:#203049;">3 minutes</strong>. Only the latest OTP sent to your email will work.
              </div>
            </div>

            <div style="margin-top:22px; font-size:13px; line-height:20px; color:#8a97a8;">
              If you did not request this code, you can safely ignore this email.
            </div>

            <div style="margin-top:24px; padding-top:18px; border-top:1px solid #dce3ea; font-size:12px; line-height:18px; color:#8a97a8; text-align:center;">
              Digital Loan Tracker
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: smtpFrom,
    to: email,
    subject,
    html,
    text: `${title}. ${message} Your verification code is ${code}. This code expires in 3 minutes. Only the latest OTP sent to your email will work.`,
  });

  if (!isProduction) {
    console.log(`OTP email sent to ${email} for ${purpose}.`);
  }
};

module.exports = {
  sendOtpEmail,
};
