import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    // who gave the rating
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // who received the rating
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// One rating per reviewer per application
ratingSchema.index({ applicationId: 1, reviewerId: 1 }, { unique: true });
ratingSchema.index({ revieweeId: 1 });

export default mongoose.model("Rating", ratingSchema);
