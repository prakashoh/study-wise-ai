import mongoose, { Schema } from "mongoose";

const DocumentSchema = new Schema({
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  extractedText: { type: String, default: "" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["Processing", "Ready", "Failed"],
    default: "Processing",
  },
  subject: { type: String, default: "General" },
  createdAt: { type: Date, default: Date.now },
});

export const Document = mongoose.model("Document", DocumentSchema);
