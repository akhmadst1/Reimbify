const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendActivationEmail = async (email, activationLink) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Activate Your Account',
        text: `Click the link to activate your account: ${activationLink}`,
        html: `<p>Click the link below to activate your account:</p>
               <a href="${activationLink}">Activate Account</a>`,
    };
    await transporter.sendMail(mailOptions);
};

exports.sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'OTP Code Reimbify',
        text: `Your OTP code for Reimbify is ${otp}, it will expire in 5 minutes.
        Do not share it with anyone and report to admin if this is not you.`,
    };
    await transporter.sendMail(mailOptions);
};
