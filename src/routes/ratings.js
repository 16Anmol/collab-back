import express from "express";
import authMiddleware from "../middleware/auth.js";
import Rating from "../models/Rating.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

const router = express.Router();

// ── Submit a rating (only on accepted/completed applications) ─────────────────
router.post("/", authMiddleware, async (req, res) => {
  const { applicationId, rating, comment } = req.body;

  if (!applicationId || !rating) {
    return res.status(400).json({ error: "applicationId and rating are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const app = await Application.findOne({
      _id: applicationId,
      status: "accepted",
      $or: [
        { startupUserId: req.user._id },
        { freelancerUserId: req.user._id },
      ],
    });
    if (!app) {
      return res.status(404).json({ error: "Accepted application not found" });
    }

    // Determine who is being rated
    const revieweeId = req.user._id.toString() === app.startupUserId.toString()
      ? app.freelancerUserId
      : app.startupUserId;

    const newRating = await Rating.create({
      applicationId: app._id,
      problemId: app.problemId,
      reviewerId: req.user._id,
      revieweeId,
      rating: parseInt(rating),
      comment: comment || "",
    });

    res.status(201).json(newRating);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "You have already rated this collaboration" });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── Get ratings received by a user (for their profile) ───────────────────────
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({ revieweeId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "fullName avatar role")
      .lean();

    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;

    res.json({ ratings, averageRating: avg, totalRatings: ratings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get my received ratings ───────────────────────────────────────────────────
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find({ revieweeId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "fullName avatar role")
      .lean();

    const avg = ratings.length
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : null;

    res.json({ ratings, averageRating: avg, totalRatings: ratings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
