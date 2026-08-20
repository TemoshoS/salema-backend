const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  sendUserLoginOtpEmail,
  sendUserPasswordResetEmail,
} = require("../utils/email");

exports.registerUser = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phoneNumber,
            address,
            password,
            confirmPassword,
            role,
        } = req.body;

        // 1. Check required fields
        if (
            !fullName ||
            !email ||
            !phoneNumber ||
            !address ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Password match check
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // 3. Check existing user
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // 4. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create user
        const user = await User.create({
            fullName,
            email,
            phoneNumber,
            address,
            password: hashedPassword,
            role: role || "client",
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
  } = req.body;

      const user = await User.findOne({ email });

     

      if (!user) {
          return res.status(400).json({
              message: "Invalid credentials",
          });
      }
      if (role && user.role !== role) {
        return res.status(403).json({
            message: "Invalid account type.",
        });
    }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).json({
              message: "Invalid credentials",
          });
      }

      // Check if the last OTP verification was within the last 24 hours
      const now = new Date();

      const needsOtp =
          !user.lastOtpVerifiedAt ||
          now - user.lastOtpVerifiedAt >= 24 * 60 * 60 * 1000;

      // If OTP is NOT required, log the user in immediately
      if (!needsOtp) {
          const token = jwt.sign(
              {
                  id: user._id,
                  role: user.role,
              },
              process.env.JWT_SECRET,
              {
                  expiresIn: "7d",
              }
          );

          return res.status(200).json({
              message: "Login successful",
              token,
              user: {
                  id: user._id,
                  fullName: user.fullName,
                  email: user.email,
                  role: user.role,
              },
          });
      }

      // Otherwise generate and send a new OTP
      const otp = Math.floor(
          100000 + Math.random() * 900000
      ).toString();

      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;

      await user.save();

      await sendUserLoginOtpEmail(
        {
          contactPerson: user.fullName,
          email: user.email,
        },
        otp
      );

      return res.status(200).json({
          message: "OTP sent to your email",
          requiresOtp: true,
      });

  } catch (error) {
      res.status(500).json({
          message: error.message,
      });
  }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (String(user.otp) !== String(otp)){
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // Clear OTP
        user.otp = null;
        user.otpExpires = null;
        user.isVerified = true;
        user.lastOtpVerifiedAt = new Date();
        await user.save();

        // Generate JWT after OTP success
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        // Since JWT is stateless, we just tell client to remove token
        return res.status(200).json({
            message: "Logged out successfully. Please remove token on client.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;
  
      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message: "All fields are required.",
        });
      }
  
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match.",
        });
      }
  
      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters.",
        });
      }
  
      const user = await User.findById(req.user.id);
  
      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
  
      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect.",
        });
      }
  
      const salt = await bcrypt.genSalt(10);
  
      user.password = await bcrypt.hash(
        newPassword,
        salt
      );
  
      await user.save();
  
      res.json({
        message: "Password changed successfully.",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({
        email: email.toLowerCase(),
      });
  
      if (!user) {
        return res.status(404).json({
          message: "No account found with this email.",
        });
      }
  
      const otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
  
      user.otp = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;
  
      await user.save();
  
      await sendUserPasswordResetEmail(
        {
          contactPerson: user.fullName,
          email: user.email,
        },
        otp
      );
  
      res.json({
        message: "Password reset code sent.",
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
exports.resetPassword = async (req, res) => {
    try {
      const {
        email,
        otp,
        password,
        confirmPassword,
      } = req.body;
  
      if (
        !email ||
        !otp ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message: "All fields are required.",
        });
      }
  
      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match.",
        });
      }
  
      const user = await User.findOne({
        email: email.toLowerCase(),
      });
  
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }
  
      if (String(user.otp) !== String(otp)) {
        return res.status(400).json({
          message: "Invalid OTP.",
        });
      }
  
      if (user.otpExpires < Date.now()) {
        return res.status(400).json({
          message: "OTP expired.",
        });
      }
  
      const salt = await bcrypt.genSalt(10);
  
      user.password = await bcrypt.hash(
        password,
        salt
      );
  
      user.otp = null;
      user.otpExpires = null;
  
      await user.save();
  
      res.json({
        message: "Password reset successfully.",
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -otp -otpExpires");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const {
            fullName,
            phoneNumber,
            address,
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.fullName = fullName || user.fullName;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.address = address || user.address;

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};