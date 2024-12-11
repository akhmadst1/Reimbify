const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendActivationEmail = async (username, email, password, role, activationLink) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Activate Your Reimbify Account',
        text: `Hello ${username},

Here are your account details:

Username: ${username}
Email: ${email}
Password: ${password}
Role: ${role}

To activate your account, click the link below:
${activationLink}

Please directly change your current password in your Reimbify app settings.

WARNING: If you did not request this account, please contact the admin immediately.

Thank you, 
Reimbify Team`,
        html: `
            <p>Hello <strong>${username}</strong>,</p>
            <p>Here are your account details:</p>
            <ul>
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
                <li><strong>Role:</strong> ${role}</li>
            </ul>
            <p>To activate your account, click the link below:</p>
            <p><a href="${activationLink}">Activate Account</a></p>
            <p>Please directly change your current password in your Reimbify app settings.</p>
            <p><strong>WARNING:</strong> If you did not request this account, please contact the admin immediately.</p>
            <p>Thank you, <br>Reimbify Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Activation email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending activation email:', error);
        throw error;
    }
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
