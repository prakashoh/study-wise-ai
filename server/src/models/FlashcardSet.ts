import mongoose, { Schema } from "mongoose";

const CardSchema = new Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  mastered: { type: Boolean, default: false },
  reviewCount: { type: Number, default: 0 },
});

const FlashcardSetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
  title: { type: String, required: true },
  cards: { type: [CardSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const FlashcardSet = mongoose.model("FlashcardSet", FlashcardSetSchema);
