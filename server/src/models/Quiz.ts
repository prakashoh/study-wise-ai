import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true }, // The option text that is correct
  explanation: { type: String, default: "" },
});

const AttemptSchema = new Schema({
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: { type: Map, of: String }, // questionIndex -> user's selected answer
  takenAt: { type: Date, default: Date.now },
});

const QuizSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
  title: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] },
  attempts: { type: [AttemptSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = mongoose.model("Quiz", QuizSchema);
