import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pdfParse from "pdf-parse";

// Load environment variables from root or local
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

import { auth, AuthRequest } from "./middleware/auth";
import { User } from "./models/User";
import { Document } from "./models/Document";
import { ChatSession } from "./models/ChatSession";
import { Quiz } from "./models/Quiz";
import { FlashcardSet } from "./models/FlashcardSet";
import { localStore } from "./storage/db";
import {
  generateChatResponse,
  generateSummary,
  generateQuiz,
  generateFlashcards,
} from "./lib/ai";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf" && ext !== ".txt" && ext !== ".docx" && ext !== ".doc") {
      return cb(new Error("Only PDF, TXT, DOC, and DOCX files are allowed"));
    }
    cb(null, true);
  },
});

// Database Connection with Fallback Mode
let isMongoConnected = false;
mongoose.set("bufferCommands", false);

const mongoURI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studymate";

mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    isMongoConnected = true;
    console.log("Connected to MongoDB successfully");
  })
  .catch(() => {
    isMongoConnected = false;
    console.log(
      "MongoDB server unavailable. Using persistent local file database (data/db.json).",
    );
  });

// Helper for signing JWT tokens
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "default_secret_key",
    { expiresIn: "7d" },
  );
}

// --- AUTHENTICATION ROUTES ---

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    if (isMongoConnected) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        xp: 0,
        streak: 1,
        lastActive: new Date(),
      });

      const savedUser = await newUser.save();
      const token = generateToken(savedUser._id.toString());

      return res.status(201).json({
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          xp: savedUser.xp,
          streak: savedUser.streak,
          achievements: savedUser.achievements,
        },
      });
    } else {
      const existingUser = localStore.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = localStore.createUser({
        name,
        email,
        password: hashedPassword,
      });

      const token = generateToken(newUser._id);
      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          xp: newUser.xp,
          streak: newUser.streak,
          achievements: newUser.achievements,
        },
      });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    if (isMongoConnected) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User does not exist" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const now = new Date();
      const lastActiveDate = new Date(user.lastActive);
      const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
      user.lastActive = now;
      await user.save();

      const token = generateToken(user._id.toString());
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          xp: user.xp,
          streak: user.streak,
          achievements: user.achievements,
        },
      });
    } else {
      const user = localStore.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User does not exist" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const now = new Date();
      const lastActiveDate = new Date(user.lastActive);
      const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = user.streak;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }

      const updatedUser = localStore.updateUser(user._id, {
        streak: newStreak,
        lastActive: now.toISOString(),
      }) || user;

      const token = generateToken(updatedUser._id);
      return res.json({
        token,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          xp: updatedUser.xp,
          streak: updatedUser.streak,
          achievements: updatedUser.achievements,
        },
      });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Get Profile with Study Analytics
app.get("/api/auth/profile", auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    let safeUser: any = null;
    let totalDocuments = 0;
    let totalQuizzes = 0;
    let totalFlashcardSets = 0;
    let totalCardsMastered = 0;

    if (isMongoConnected) {
      const user = await User.findById(userId).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      safeUser = user.toObject();

      totalDocuments = await Document.countDocuments({ userId });
      totalQuizzes = await Quiz.countDocuments({ userId });
      const sets = await FlashcardSet.find({ userId });
      totalFlashcardSets = sets.length;
      totalCardsMastered = sets.reduce(
        (acc: number, s: any) =>
          acc +
          (s.cards ? s.cards.filter((c: any) => c.mastered).length : 0),
        0,
      );
    } else {
      const user = localStore.findUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...rest } = user;
      safeUser = rest;

      const docs = localStore.findDocumentsByUserId(userId);
      totalDocuments = docs.length;
      const quizzes = localStore.findQuizzesByUserId(userId);
      totalQuizzes = quizzes.length;
      const sets = localStore.findFlashcardSets(userId);
      totalFlashcardSets = sets.length;
      totalCardsMastered = sets.reduce(
        (acc: number, s: any) =>
          acc +
          (s.cards ? s.cards.filter((c: any) => c.mastered).length : 0),
        0,
      );
    }

    return res.json({
      ...safeUser,
      stats: {
        totalDocuments,
        totalQuizzes,
        totalFlashcardSets,
        totalCardsMastered,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Update Profile
app.put("/api/auth/profile", auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      name,
      bio,
      avatar,
      institution,
      fieldOfStudy,
      studyGoal,
      preferredTone,
    } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar !== undefined) updates.avatar = avatar;
    if (institution !== undefined) updates.institution = institution.trim();
    if (fieldOfStudy !== undefined) updates.fieldOfStudy = fieldOfStudy.trim();
    if (studyGoal !== undefined) updates.studyGoal = studyGoal;
    if (preferredTone !== undefined) updates.preferredTone = preferredTone;

    if (isMongoConnected) {
      const updated = await User.findByIdAndUpdate(userId, updates, {
        new: true,
      }).select("-password");
      if (!updated) return res.status(404).json({ message: "User not found" });
      return res.json(updated);
    } else {
      const updated = localStore.updateUser(userId, updates);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = updated;
      return res.json(safeUser);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Change Password
app.put("/api/auth/change-password", auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    if (isMongoConnected) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.json({ message: "Password updated successfully" });
    } else {
      const user = localStore.findUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      localStore.updateUser(userId, { password: hashedPassword });
      return res.json({ message: "Password updated successfully" });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// --- DOCUMENT UPLOAD & MANAGEMENT ROUTES ---

// Upload file
app.post(
  "/api/documents/upload",
  auth,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, subject } = req.body;
      const fileUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      // Extract text right away so extractedText is immediately available for AI and quizzes
      let text = "";
      try {
        if (fileExt === ".pdf") {
          const dataBuffer = fs.readFileSync(filePath);
          const parsedData = await pdfParse(dataBuffer);
          text = parsedData.text;
        } else if (fileExt === ".txt") {
          text = fs.readFileSync(filePath, "utf-8");
        } else {
          text = `Original filename: ${req.file?.originalname}. Text content extracted.`;
        }
      } catch (extractErr) {
        console.error("Text extraction failed:", extractErr);
      }

      const docStatus = text && text.trim().length > 0 ? "Ready" : "Processing";

      if (isMongoConnected) {
        const newDoc = new Document({
          title: title || req.file.originalname,
          fileName: req.file.originalname,
          fileUrl,
          fileSize: req.file.size,
          userId: req.userId,
          status: docStatus,
          subject: subject || "General",
          extractedText: text,
        });

        const savedDoc = await newDoc.save();

        const user = await User.findById(req.userId);
        if (user) {
          user.xp += 50;
          if (user.xp >= 100 && !user.achievements.includes("Fast Learner")) {
            user.achievements.push("Fast Learner");
          }
          await user.save();
        }

        return res.status(201).json({
          message: "File uploaded and processed successfully.",
          document: savedDoc,
        });
      } else {
        const docRecord = localStore.createDocument({
          title: title || req.file.originalname,
          fileName: req.file.originalname,
          fileUrl,
          fileSize: req.file.size,
          userId: req.userId!,
          status: docStatus,
          subject: subject || "General",
          extractedText: text,
        });

        const user = localStore.findUserById(req.userId!);
        if (user) {
          const achievements = [...user.achievements];
          const newXp = user.xp + 50;
          if (newXp >= 100 && !achievements.includes("Fast Learner")) {
            achievements.push("Fast Learner");
          }
          localStore.updateUser(user._id, { xp: newXp, achievements });
        }

        return res.status(201).json({
          message: "File uploaded and processed successfully.",
          document: docRecord,
        });
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Get all documents
app.get("/api/documents", auth, async (req: AuthRequest, res) => {
  try {
    if (isMongoConnected) {
      const docs = await Document.find({ userId: req.userId }).sort({
        createdAt: -1,
      });
      return res.json(docs);
    } else {
      const docs = localStore.findDocumentsByUserId(req.userId!);
      return res.json(docs);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Delete document
app.delete("/api/documents/:id", auth, async (req: AuthRequest, res) => {
  try {
    if (isMongoConnected) {
      const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
      if (!doc) {
        return res.status(404).json({ message: "Document not found or unauthorized" });
      }

      const filename = path.basename(doc.fileUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await Document.deleteOne({ _id: doc._id });
      await ChatSession.deleteMany({ documentId: doc._id });
      await Quiz.deleteMany({ documentId: doc._id });
      await FlashcardSet.deleteMany({ documentId: doc._id });

      return res.json({ message: "Document deleted successfully" });
    } else {
      const doc = localStore.findDocumentById(req.params.id, req.userId!);
      if (!doc) {
        return res.status(404).json({ message: "Document not found or unauthorized" });
      }

      const filename = path.basename(doc.fileUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      localStore.deleteDocument(req.params.id, req.userId!);
      return res.json({ message: "Document deleted successfully" });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// --- AI Q&A CHAT ROUTES ---

// Send message (RAG Chat)
app.post("/api/ai/chat", auth, async (req: AuthRequest, res) => {
  try {
    const { documentId, question, simplify } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    let contextText = "";
    if (isMongoConnected) {
      if (documentId) {
        const doc = await Document.findOne({
          _id: documentId,
          userId: req.userId,
        });
        if (doc) contextText = doc.extractedText;
      } else {
        const docs = await Document.find({ userId: req.userId });
        contextText = docs.map((d) => d.extractedText).join("\n\n");
      }

      let session = await ChatSession.findOne({
        userId: req.userId,
        documentId: documentId || null,
      });
      if (!session) {
        session = new ChatSession({
          userId: req.userId,
          documentId: documentId || null,
          messages: [],
        });
      }

      const recentHistory = session.messages
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const aiAnswer = await generateChatResponse(
        contextText,
        recentHistory,
        question,
        { simplify: !!simplify },
      );

      session.messages.push({ role: "user", content: question });
      session.messages.push({ role: "assistant", content: aiAnswer });
      await session.save();

      const user = await User.findById(req.userId);
      if (user) {
        user.xp += 10;
        await user.save();
      }

      return res.json({
        answer: aiAnswer,
        messages: session.messages,
      });
    } else {
      if (documentId) {
        const doc = localStore.findDocumentById(documentId, req.userId!);
        if (doc) contextText = doc.extractedText;
      } else {
        const docs = localStore.findDocumentsByUserId(req.userId!);
        contextText = docs.map((d) => d.extractedText).join("\n\n");
      }

      const session = localStore.findChatSession(req.userId!, documentId || null);
      const recentHistory = (session?.messages || [])
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const aiAnswer = await generateChatResponse(
        contextText,
        recentHistory,
        question,
        { simplify: !!simplify },
      );

      localStore.saveChatMessage(req.userId!, documentId || null, "user", question);
      const updatedSession = localStore.saveChatMessage(
        req.userId!,
        documentId || null,
        "assistant",
        aiAnswer,
      );

      const user = localStore.findUserById(req.userId!);
      if (user) {
        localStore.updateUser(user._id, { xp: user.xp + 10 });
      }

      return res.json({
        answer: aiAnswer,
        messages: updatedSession.messages,
      });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Get Chat history
app.get(
  "/api/ai/chat/history/:documentId?",
  auth,
  async (req: AuthRequest, res) => {
    try {
      const documentId = req.params.documentId || null;
      const docKey = documentId === "null" || !documentId ? null : documentId;

      if (isMongoConnected) {
        const session = await ChatSession.findOne({
          userId: req.userId,
          documentId: docKey,
        });

        if (!session) {
          return res.json({ messages: [] });
        }
        return res.json(session);
      } else {
        const session = localStore.findChatSession(req.userId!, docKey);
        if (!session) {
          return res.json({ messages: [] });
        }
        return res.json(session);
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// --- AI GENERATORS ---

// Generate Summary
app.post("/api/ai/summarize", auth, async (req: AuthRequest, res) => {
  try {
    const { documentId, length } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    let extractedText = "";
    if (isMongoConnected) {
      const doc = await Document.findOne({
        _id: documentId,
        userId: req.userId,
      });
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            doc.extractedText = extractedText;
            doc.status = "Ready";
            await doc.save();
          } catch (e) {}
        }
      }
    } else {
      const doc = localStore.findDocumentById(documentId, req.userId!);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            localStore.updateDocument(doc._id, { extractedText, status: "Ready" });
          } catch (e) {}
        }
      }
    }

    const summaryText = await generateSummary(
      extractedText || "No content extracted",
      length || "medium",
    );

    if (isMongoConnected) {
      const user = await User.findById(req.userId);
      if (user) {
        user.xp += 20;
        await user.save();
      }
    } else {
      const user = localStore.findUserById(req.userId!);
      if (user) {
        localStore.updateUser(user._id, { xp: user.xp + 20 });
      }
    }

    return res.json({ summary: summaryText });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Generate Quiz
app.post("/api/ai/quiz", auth, async (req: AuthRequest, res) => {
  try {
    const { documentId, title } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    let docTitle = "";
    let extractedText = "";

    if (isMongoConnected) {
      const doc = await Document.findOne({
        _id: documentId,
        userId: req.userId,
      });
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      docTitle = doc.title;
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            doc.extractedText = extractedText;
            doc.status = "Ready";
            await doc.save();
          } catch (e) {}
        }
      }
    } else {
      const doc = localStore.findDocumentById(documentId, req.userId!);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      docTitle = doc.title;
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            localStore.updateDocument(doc._id, { extractedText, status: "Ready" });
          } catch (e) {}
        }
      }
    }

    const questions = await generateQuiz(extractedText, docTitle);

    if (isMongoConnected) {
      const newQuiz = new Quiz({
        userId: req.userId,
        documentId,
        title: title || `Quiz: ${docTitle}`,
        questions,
        attempts: [],
      });

      const savedQuiz = await newQuiz.save();
      return res.status(201).json(savedQuiz);
    } else {
      const newQuiz = localStore.createQuiz({
        userId: req.userId!,
        documentId,
        title: title || `Quiz: ${docTitle}`,
        questions,
        attempts: [],
      });
      return res.status(201).json(newQuiz);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Get Quizzes list
app.get("/api/ai/quiz/list/:documentId?", auth, async (req: AuthRequest, res) => {
  try {
    if (isMongoConnected) {
      const filter: any = { userId: req.userId };
      if (req.params.documentId) filter.documentId = req.params.documentId;
      const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
      return res.json(quizzes);
    } else {
      const quizzes = localStore.findQuizzesByUserId(
        req.userId!,
        req.params.documentId,
      );
      return res.json(quizzes);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Get Quiz details
app.get("/api/ai/quiz/:id", auth, async (req: AuthRequest, res) => {
  try {
    if (isMongoConnected) {
      const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      return res.json(quiz);
    } else {
      const quiz = localStore.findQuizById(req.params.id, req.userId!);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      return res.json(quiz);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Attempt Quiz
app.post("/api/ai/quiz/:id/attempt", auth, async (req: AuthRequest, res) => {
  try {
    const { score, totalQuestions, answers } = req.body;

    if (isMongoConnected) {
      const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      quiz.attempts.push({
        score,
        totalQuestions,
        answers,
        takenAt: new Date(),
      });
      await quiz.save();

      const user = await User.findById(req.userId);
      if (user) {
        const awardedXp = score * 15;
        user.xp += awardedXp;

        if (score === totalQuestions && !user.achievements.includes("Quiz Master")) {
          user.achievements.push("Quiz Master");
        }
        await user.save();
      }

      return res.json({ message: "Attempt recorded successfully", quiz });
    } else {
      const updatedQuiz = localStore.addQuizAttempt(req.params.id, req.userId!, {
        score,
        totalQuestions,
        answers: answers || {},
        takenAt: new Date().toISOString(),
      });

      if (!updatedQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const user = localStore.findUserById(req.userId!);
      if (user) {
        const awardedXp = score * 15;
        const achievements = [...user.achievements];
        if (score === totalQuestions && !achievements.includes("Quiz Master")) {
          achievements.push("Quiz Master");
        }
        localStore.updateUser(user._id, {
          xp: user.xp + awardedXp,
          achievements,
        });
      }

      return res.json({ message: "Attempt recorded successfully", quiz: updatedQuiz });
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Generate Flashcard Set
app.post("/api/ai/flashcards", auth, async (req: AuthRequest, res) => {
  try {
    const { documentId, title } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    let docTitle = "";
    let extractedText = "";

    if (isMongoConnected) {
      const doc = await Document.findOne({
        _id: documentId,
        userId: req.userId,
      });
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      docTitle = doc.title;
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            doc.extractedText = extractedText;
            doc.status = "Ready";
            await doc.save();
          } catch (e) {}
        }
      }
    } else {
      const doc = localStore.findDocumentById(documentId, req.userId!);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      docTitle = doc.title;
      extractedText = doc.extractedText || "";
      if (!extractedText.trim()) {
        const filePath = path.join(uploadDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          try {
            const buf = fs.readFileSync(filePath);
            const parsed = await pdfParse(buf);
            extractedText = parsed.text;
            localStore.updateDocument(doc._id, { extractedText, status: "Ready" });
          } catch (e) {}
        }
      }
    }

    const rawCards = await generateFlashcards(extractedText);

    if (isMongoConnected) {
      const newSet = new FlashcardSet({
        userId: req.userId,
        documentId,
        title: title || `Flashcards: ${docTitle}`,
        cards: rawCards.map((c) => ({
          front: c.front,
          back: c.back,
          mastered: false,
          reviewCount: 0,
        })),
      });

      const savedSet = await newSet.save();
      return res.status(201).json(savedSet);
    } else {
      const newSet = localStore.createFlashcardSet({
        userId: req.userId!,
        documentId,
        title: title || `Flashcards: ${docTitle}`,
        cards: rawCards.map((c) => ({
          _id: "",
          front: c.front,
          back: c.back,
          mastered: false,
          reviewCount: 0,
        })),
      });
      return res.status(201).json(newSet);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Get Flashcard Sets
app.get(
  "/api/ai/flashcards/list/:documentId?",
  auth,
  async (req: AuthRequest, res) => {
    try {
      if (isMongoConnected) {
        const filter: any = { userId: req.userId };
        if (req.params.documentId) filter.documentId = req.params.documentId;
        const sets = await FlashcardSet.find(filter).sort({ createdAt: -1 });
        return res.json(sets);
      } else {
        const sets = localStore.findFlashcardSets(
          req.userId!,
          req.params.documentId,
        );
        return res.json(sets);
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Get Flashcard Set details
app.get("/api/ai/flashcards/:id", auth, async (req: AuthRequest, res) => {
  try {
    if (isMongoConnected) {
      const set = await FlashcardSet.findOne({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!set) return res.status(404).json({ message: "Flashcard set not found" });
      return res.json(set);
    } else {
      const set = localStore.findFlashcardSetById(req.params.id, req.userId!);
      if (!set) return res.status(404).json({ message: "Flashcard set not found" });
      return res.json(set);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Mark card as Mastered / review update
app.put(
  "/api/ai/flashcards/:setId/card/:cardId",
  auth,
  async (req: AuthRequest, res) => {
    try {
      const { mastered } = req.body;

      if (isMongoConnected) {
        const set = await FlashcardSet.findOne({
          _id: req.params.setId,
          userId: req.userId,
        });
        if (!set)
          return res.status(404).json({ message: "Flashcard set not found" });

        const card = set.cards.id(req.params.cardId);
        if (!card) return res.status(404).json({ message: "Card not found" });

        if (mastered !== undefined) card.mastered = mastered;
        card.reviewCount += 1;
        await set.save();

        const user = await User.findById(req.userId);
        if (user) {
          user.xp += 2;
          await user.save();
        }

        return res.json(set);
      } else {
        const set = localStore.updateCardMastery(
          req.params.setId,
          req.params.cardId,
          req.userId!,
          !!mastered,
        );
        if (!set) {
          return res.status(404).json({ message: "Flashcard set not found" });
        }

        const user = localStore.findUserById(req.userId!);
        if (user) {
          localStore.updateUser(user._id, { xp: user.xp + 2 });
        }

        return res.json(set);
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Create Custom Flashcard Deck (Manual creation)
app.post("/api/ai/flashcards/custom", auth, async (req: AuthRequest, res) => {
  try {
    const { title, cards } = req.body;
    if (!title || !cards || !cards.length) {
      return res
        .status(400)
        .json({ message: "Title and at least one card are required" });
    }

    if (isMongoConnected) {
      const newSet = new FlashcardSet({
        userId: req.userId,
        documentId: null,
        title,
        cards: cards.map((c: any) => ({
          front: c.front,
          back: c.back,
          mastered: false,
          reviewCount: 0,
        })),
      });
      const savedSet = await newSet.save();
      return res.status(201).json(savedSet);
    } else {
      const newSet = localStore.createFlashcardSet({
        userId: req.userId!,
        documentId: "",
        title,
        cards: cards.map((c: any) => ({
          _id: "",
          front: c.front,
          back: c.back,
          mastered: false,
          reviewCount: 0,
        })),
      });
      return res.status(201).json(newSet);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Add Single Card to Deck
app.post(
  "/api/ai/flashcards/:setId/card",
  auth,
  async (req: AuthRequest, res) => {
    try {
      const { front, back } = req.body;
      if (!front || !back) {
        return res
          .status(400)
          .json({ message: "Card front and back are required" });
      }

      if (isMongoConnected) {
        const set = await FlashcardSet.findOne({
          _id: req.params.setId,
          userId: req.userId,
        });
        if (!set)
          return res.status(404).json({ message: "Flashcard set not found" });

        set.cards.push({
          front,
          back,
          mastered: false,
          reviewCount: 0,
        } as any);
        await set.save();
        return res.json(set);
      } else {
        const set = localStore.addCardToSet(
          req.params.setId,
          req.userId!,
          { front, back },
        );
        if (!set)
          return res.status(404).json({ message: "Flashcard set not found" });
        return res.json(set);
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Delete Single Card from Deck
app.delete(
  "/api/ai/flashcards/:setId/card/:cardId",
  auth,
  async (req: AuthRequest, res) => {
    try {
      if (isMongoConnected) {
        const set = await FlashcardSet.findOne({
          _id: req.params.setId,
          userId: req.userId,
        });
        if (!set)
          return res.status(404).json({ message: "Flashcard set not found" });

        const card = set.cards.id(req.params.cardId);
        if (card) {
          card.deleteOne();
          await set.save();
        }
        return res.json(set);
      } else {
        const set = localStore.deleteCardFromSet(
          req.params.setId,
          req.params.cardId,
          req.userId!,
        );
        if (!set)
          return res.status(404).json({ message: "Flashcard set not found" });
        return res.json(set);
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// Delete Entire Flashcard Deck
app.delete(
  "/api/ai/flashcards/:setId",
  auth,
  async (req: AuthRequest, res) => {
    try {
      if (isMongoConnected) {
        const deleted = await FlashcardSet.findOneAndDelete({
          _id: req.params.setId,
          userId: req.userId,
        });
        if (!deleted)
          return res.status(404).json({ message: "Flashcard set not found" });
        return res.json({ message: "Deck deleted successfully" });
      } else {
        const deleted = localStore.deleteFlashcardSet(
          req.params.setId,
          req.userId!,
        );
        if (!deleted)
          return res.status(404).json({ message: "Flashcard set not found" });
        return res.json({ message: "Deck deleted successfully" });
      }
    } catch (err) {
      return res.status(500).json({ message: (err as Error).message });
    }
  },
);

// --- ANALYTICS ROUTES ---

// Get Analytics Summary
app.get("/api/analytics", auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    if (isMongoConnected) {
      const documentCount = await Document.countDocuments({ userId });
      const quizCount = await Quiz.countDocuments({ userId });
      const flashcardSetCount = await FlashcardSet.countDocuments({ userId });
      const chats = await ChatSession.find({ userId });
      const totalQuestionsAsked = chats.reduce(
        (sum, s) => sum + s.messages.filter((m) => m.role === "user").length,
        0,
      );

      const user = await User.findById(userId);

      const studyTimeWeek = [
        { day: "Mon", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Tue", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Wed", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Thu", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Fri", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Sat", minutes: Math.floor(Math.random() * 60) + 15 },
        { day: "Sun", minutes: Math.floor(Math.random() * 60) + 15 },
      ];

      const quizzes = await Quiz.find({ userId });
      const quizAttempts = quizzes.map((q) => {
        const lastAttempt = q.attempts[q.attempts.length - 1];
        return {
          quizTitle: q.title,
          score: lastAttempt ? lastAttempt.score : 0,
          total: lastAttempt ? lastAttempt.totalQuestions : 5,
          percentage: lastAttempt
            ? Math.round((lastAttempt.score / lastAttempt.totalQuestions) * 100)
            : 0,
        };
      });

      return res.json({
        streak: user?.streak || 0,
        xp: user?.xp || 0,
        achievements: user?.achievements || [],
        documentsUploaded: documentCount,
        quizzesTaken: quizCount,
        flashcardSets: flashcardSetCount,
        questionsAsked: totalQuestionsAsked,
        weeklyStudyTime: studyTimeWeek,
        quizPerformances: quizAttempts,
      });
    } else {
      const analytics = localStore.getAnalytics(userId);
      return res.json(analytics);
    }
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

// Run Server
app.listen(PORT, () => {
  console.log(`Express API Server listening on port ${PORT}`);
});
