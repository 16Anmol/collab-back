import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Application from "../models/Application.js";
import Rating from "../models/Rating.js";
import CollabRequest from "../models/CollabRequest.js";
import Milestone from "../models/Milestone.js";

const router = express.Router();

// Admin check middleware — only users whose email is in ADMIN_EMAILS env var
const adminOnly = (req, res, next) => {
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  if (!admins.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ── Platform stats ────────────────────────────────────────────────────────────
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users, problems, applications, collabs, milestones, ratings] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Application.countDocuments(),
      CollabRequest.countDocuments(),
      Milestone.countDocuments(),
      Rating.countDocuments(),
    ]);

    const startups = await User.countDocuments({ role: "startup" });
    const freelancers = await User.countDocuments({ role: "freelancer" });
    const openProblems = await Problem.countDocuments({ status: "open" });
    const acceptedApps = await Application.countDocuments({ status: "accepted" });

    res.json({
      stats: {
        totalUsers: users, startups, freelancers,
        totalProblems: problems, openProblems,
        totalApplications: applications, acceptedApplications: acceptedApps,
        collabRequests: collabs, milestones, ratings,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all users ────────────────────────────────────────────────────────────
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-__v")
      .lean();

    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete a user ─────────────────────────────────────────────────────────────
router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all problems ─────────────────────────────────────────────────────────
router.get("/problems", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const problems = await Problem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Problem.countDocuments(filter);
    res.json({ problems, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete a problem ──────────────────────────────────────────────────────────
router.delete("/problems/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all ratings ──────────────────────────────────────────────────────────
router.get("/ratings", authMiddleware, adminOnly, async (req, res) => {
  try {
    const ratings = await Rating.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("reviewerId", "fullName email")
      .populate("revieweeId", "fullName email")
      .lean();
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
