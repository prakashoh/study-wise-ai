import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  achievements: { type: [String], default: [] },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "" },
  institution: { type: String, default: "" },
  fieldOfStudy: { type: String, default: "" },
  studyGoal: { type: String, default: "30 mins / day" },
  preferredTone: { type: String, default: "balanced" },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
