import Joi from "joi";
import axios from 'axios';
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AdminUser } from "../models/AdminUseSchema.model.js";
import sendSMS from "../services/sendSMS.js";
import otpModel from "../models/otp.model.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET

const emailVerificationSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password should have at least 6 characters',
        'any.required': 'Password is required',
    }),
});

// Joi schema for validating OTP verification
const otpVerificationSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
        'string.length': 'OTP should be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required',
    }),
});

export const emailVerify = async (req, res) => {
    const { error } = emailVerificationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    // console.log("🚀 ~ emailVerify ~ email:", email)

    try {
        const user = await AdminUser.findOne({ email });
        // console.log("🚀 ~ emailVerify ~ user:", user)
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        // console.log("🚀 ~ emailVerify ~ isMatch:", isMatch)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now

        console.log("🚀 ~ Generated OTP:", otp);
        console.log("🚀 ~ OTP Expiry (ms):", otpExpiry);

        //  Save OTP to otpModel
        const otpDoc = await otpModel.findOneAndUpdate(
            { mobileNumber: user.phoneNumber },
            {
                mobileNumber: user.phoneNumber,
                otp,
                otpExpiry: otpExpiry.toString(),
            },
            { upsert: true, new: true }
        );

        // Send SMS
        const smsMessage = `${otp} is your OTP to login to LittleMoney portal.`;
        await sendSMS(user.phoneNumber, smsMessage);
        // console.log("🚀 ~ emailVerify ~ otp:", otp)

        const phoneHint = '****' + user.phoneNumber.slice(-4);
        return res.json({
            message: 'OTP sent to registered mobile number',
            phoneHint,
            phoneNumber: user.phoneNumber,
            email: user.email,
        });

    } catch (error) {
        console.error("Error in email verification:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// /api/resend-otp
export const resendOtp = async (req, res) => {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        const user = await AdminUser.findOne({ phoneNumber: mobileNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        await otpModel.findOneAndUpdate(
            { mobileNumber },
            { mobileNumber, otp, otpExpiry: otpExpiry.toString() },
            { upsert: true, new: true }
        );

        await sendSMS(mobileNumber, `${otp} is your OTP to login to LittleMoney portal.`);

        return res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error("Error in resend OTP:", error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const verifyOtp = async (req, res) => {
    const schema = Joi.object({
        mobileNumber: Joi.string().required(),
        otp: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { mobileNumber, otp } = req.body;

    try {
        const record = await otpModel.findOne({ mobileNumber });

        if (!record) {
            return res.status(400).json({ message: 'No OTP sent to this number' });
        }

        const expiryTime = new Date(record.otpExpiry).getTime();
        const currentTime = Date.now();

        if (currentTime > expiryTime) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        //  OTP verified, now generate token
        const token = jwt.sign(
            { mobileNumber }, // You can add more user data if available
            JWT_SECRET,
        );
        // console.log("🚀 ~ verifyOtp ~ token:", token)
        // console.log("Payload:", { mobileNumber });
        // console.log("JWT_SECRET:", JWT_SECRET);
        // console.log("Generated token:", token);

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token, // Send the token to frontend
        });

    } catch (err) {
        console.error(" Server error during OTP verification:", err);
        return res.status(500).json({ message: 'Server error during OTP verification' });
    }
};