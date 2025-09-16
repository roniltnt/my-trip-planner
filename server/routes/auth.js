const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const sign = (id) =>
  jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const user = new User({ email, password });
    await user.save();

    const token = sign(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = sign(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

//what the hell is this?
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ user });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;