import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ["startup", "freelancer"], default: null },
    onboarded: { type: Boolean, default: false },

    // Up to 15 niche tags — used for matching startups ↔ freelancers
    // e.g. ["fintech", "react", "saas", "ui-design"]
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 15,
        message: "Maximum 15 tags allowed",
      },
    },
  },
  { timestamps: true },
);

// Index tags for fast matching queries
userSchema.index({ tags: 1 });
userSchema.index({ role: 1, tags: 1 });

export default mongoose.model("User", userSchema);
