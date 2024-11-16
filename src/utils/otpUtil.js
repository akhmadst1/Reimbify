const { updateOtp } = require('../models/userModel');

exports.generateOtp = () => Math.floor(100000 + Math.random() * 900000);

exports.validateOtp = async (email, otp) => {
    const user = await findUserByEmail(email);
    return user && user.otp === otp;
};
