import mongoose from "mongoose";
import crypto from "crypto";
import user from "../models/auth.js";
import Session from "../models/session.js";
import DeviceOtp from "../models/deviceOtp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateRandomPassword from "../utils/generatePassword.js";
import { sendEmail } from "../utils/sendEmail.js";
import { getDeviceInfo } from "../utils/deviceInfo.js";
import { setAuthCookies } from "../utils/authCookies.js";
import { applyReputation } from "../utils/reputation.js";

export const Signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }

    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const deviceInfo = getDeviceInfo(req);
    let deviceId = req.cookies?.deviceId;

    const trustedSession = deviceId
      ? await Session.findOne({
          user: exisitinguser._id,
          deviceId,
          isTrusted: true,
        })
      : null;

    if (!trustedSession) {
      // unrecognized device — hold login, send OTP
      deviceId = deviceId || crypto.randomUUID();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await DeviceOtp.create({
        user: exisitinguser._id,
        deviceId,
        otp,
        deviceInfo,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendEmail(
        email,
        "Verify new device login",
        `A login was attempted from a new device (${deviceInfo.browser} on ${deviceInfo.os}, IP ${deviceInfo.ip}). Your verification code is ${otp}. It expires in 10 minutes.`
      );

      return res.status(200).json({
        requiresOtp: true,
        deviceId,
        message: "New device detected. OTP sent to your email.",
      });
    }

    // recognized device — log in normally
    const { accessToken, refreshToken } = await createSessionAndTokens(
      exisitinguser,
      deviceId,
      deviceInfo
    );

    setAuthCookies(res, { accessToken, refreshToken, deviceId });

    res.status(200).json({ data: exisitinguser, token: accessToken });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const RefreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Refresh token invalid or expired" });
    }

    const session = await Session.findOne({ refreshToken, user: decoded.id });
    if (!session) {
      // refresh token doesn't match any live session — it was revoked/deleted
      return res.status(401).json({ message: "Session no longer valid" });
    }

    session.lastActiveAt = new Date();
    await session.save();

    const newAccessToken = jwt.sign(
      { id: decoded.id, sessionId: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export const VerifyDeviceOtp = async (req, res) => {
  const { email, otp, deviceId } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const record = await DeviceOtp.findOne({
      user: exisitinguser._id,
      deviceId,
      otp,
    });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const deviceInfo = getDeviceInfo(req);

    const { accessToken, refreshToken } = await createSessionAndTokens(
      exisitinguser,
      deviceId,
      deviceInfo
    );

    setAuthCookies(res, { accessToken, refreshToken, deviceId });
    await DeviceOtp.deleteMany({ user: exisitinguser._id, deviceId });

    res.status(200).json({
      data: exisitinguser,
      token: accessToken,
      message: "Device verified, logged in.",
    });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

// helper — shared by Login + VerifyDeviceOtp
async function createSessionAndTokens(exisitinguser, deviceId, deviceInfo) {
  const refreshToken = jwt.sign(
    { id: exisitinguser._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  const session = await Session.create({
    user: exisitinguser._id,
    refreshToken,
    deviceId,
    isTrusted: true,
    ...deviceInfo,
  });

  const accessToken = jwt.sign(
    { email: exisitinguser.email, id: exisitinguser._id, sessionId: session._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken, refreshToken };
}

export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body.editForm;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  try {
    const updateprofile = await user.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags } },
      { new: true }
    );

    const isComplete =
      updateprofile.about?.trim().length > 0 && updateprofile.tags?.length > 0;

    if (isComplete && !updateprofile.profileCompletionBonusAwarded) {
      await user.findByIdAndUpdate(_id, {
        $set: { profileCompletionBonusAwarded: true },
      });

      await applyReputation({
        userId: _id,
        amount: 10,
        reason: "profile_completed",
      });
    }

    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const ForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const now = new Date();
    const lastRequest = exisitinguser.lastPasswordResetRequest;
    if (lastRequest) {
      const isSameDay = lastRequest.toDateString() === now.toDateString();
      if (isSameDay) {
        return res
          .status(429)
          .json({ message: "You can use this option only one time per day." });
      }
    }

    const newPassword = generateRandomPassword(10);
    const hashpassword = await bcrypt.hash(newPassword, 12);

    exisitinguser.password = hashpassword;
    exisitinguser.lastPasswordResetRequest = now;
    await exisitinguser.save();

    await sendEmail(
      email,
      "Your new password",
      `Your password has been reset. Your new password is: ${newPassword}\n\nPlease log in and change it.`
    );

    res.status(200).json({ message: "New password sent to your email" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const ChangePassword = async (req, res) => {
  const { userId } = req;
  const { oldPassword, newPassword } = req.body;
  try {
    const exisitinguser = await user.findById(userId);
    if (!exisitinguser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(oldPassword, exisitinguser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashpassword = await bcrypt.hash(newPassword, 12);
    exisitinguser.password = hashpassword;
    await exisitinguser.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};