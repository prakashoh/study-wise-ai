import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  documentId: { type: Schema.Types.ObjectId, ref: "Document", default: null }, // null means chat across all documents
  messages: { type: [MessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
