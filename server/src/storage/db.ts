import fs from "fs";
import path from "path";

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  password: string;
  xp: number;
  streak: number;
  lastActive: string;
  achievements: string[];
  bio?: string;
  avatar?: string;
  institution?: string;
  fieldOfStudy?: string;
  studyGoal?: string;
  preferredTone?: string;
  createdAt: string;
}

export interface DocumentRecord {
  _id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  extractedText: string;
  userId: string;
  status: "Processing" | "Ready" | "Failed";
  subject: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSessionRecord {
  _id: string;
  userId: string;
  documentId: string | null;
  messages: ChatMessage[];
  createdAt: string;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizAttempt {
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  takenAt: string;
}

export interface QuizRecord {
  _id: string;
  userId: string;
  documentId: string;
  title: string;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  createdAt: string;
}

export interface Flashcard {
  _id: string;
  front: string;
  back: string;
  mastered: boolean;
  reviewCount: number;
}

export interface FlashcardSetRecord {
  _id: string;
  userId: string;
  documentId: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  documents: DocumentRecord[];
  chatSessions: ChatSessionRecord[];
  quizzes: QuizRecord[];
  flashcardSets: FlashcardSetRecord[];
}

const dataDir = path.join(__dirname, "../../data");
const dbFilePath = path.join(dataDir, "db.json");

function generateId(): string {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function loadDB(): DatabaseSchema {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    const initial: DatabaseSchema = {
      users: [],
      documents: [],
      chatSessions: [],
      quizzes: [],
      flashcardSets: [],
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const data = fs.readFileSync(dbFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      users: [],
      documents: [],
      chatSessions: [],
      quizzes: [],
      flashcardSets: [],
    };
  }
}

function saveDB(db: DatabaseSchema) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), "utf-8");
}

export const localStore = {
  // --- USERS ---
  findUserByEmail(email: string): UserRecord | null {
    const db = loadDB();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id: string): UserRecord | null {
    const db = loadDB();
    return db.users.find((u) => u._id === id) || null;
  },

  createUser(userData: { name: string; email: string; password: string }): UserRecord {
    const db = loadDB();
    const newUser: UserRecord = {
      _id: generateId(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      xp: 0,
      streak: 1,
      lastActive: new Date().toISOString(),
      achievements: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDB(db);
    return newUser;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const db = loadDB();
    const user = db.users.find((u) => u._id === id);
    if (!user) return null;
    Object.assign(user, updates);
    saveDB(db);
    return user;
  },

  // --- DOCUMENTS ---
  findDocumentsByUserId(userId: string): DocumentRecord[] {
    const db = loadDB();
    return db.documents
      .filter((d) => d.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  findDocumentById(id: string, userId: string): DocumentRecord | null {
    const db = loadDB();
    return db.documents.find((d) => d._id === id && d.userId === userId) || null;
  },

  createDocument(docData: Omit<DocumentRecord, "_id" | "createdAt">): DocumentRecord {
    const db = loadDB();
    const newDoc: DocumentRecord = {
      _id: generateId(),
      ...docData,
      createdAt: new Date().toISOString(),
    };
    db.documents.push(newDoc);
    saveDB(db);
    return newDoc;
  },

  updateDocument(id: string, updates: Partial<DocumentRecord>): DocumentRecord | null {
    const db = loadDB();
    const doc = db.documents.find((d) => d._id === id);
    if (!doc) return null;
    Object.assign(doc, updates);
    saveDB(db);
    return doc;
  },

  deleteDocument(id: string, userId: string): boolean {
    const db = loadDB();
    const initialLen = db.documents.length;
    db.documents = db.documents.filter((d) => !(d._id === id && d.userId === userId));
    if (db.documents.length !== initialLen) {
      db.chatSessions = db.chatSessions.filter((c) => c.documentId !== id);
      db.quizzes = db.quizzes.filter((q) => q.documentId !== id);
      db.flashcardSets = db.flashcardSets.filter((f) => f.documentId !== id);
      saveDB(db);
      return true;
    }
    return false;
  },

  // --- CHAT SESSIONS ---
  findChatSession(userId: string, documentId: string | null): ChatSessionRecord | null {
    const db = loadDB();
    return (
      db.chatSessions.find(
        (c) => c.userId === userId && (c.documentId === documentId || (documentId === null && c.documentId === null)),
      ) || null
    );
  },

  saveChatMessage(
    userId: string,
    documentId: string | null,
    role: "user" | "assistant",
    content: string,
  ): ChatSessionRecord {
    const db = loadDB();
    let session = db.chatSessions.find(
      (c) => c.userId === userId && (c.documentId === documentId || (documentId === null && c.documentId === null)),
    );
    if (!session) {
      session = {
        _id: generateId(),
        userId,
        documentId: documentId || null,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      db.chatSessions.push(session);
    }
    session.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    saveDB(db);
    return session;
  },

  // --- QUIZZES ---
  findQuizzesByUserId(userId: string, documentId?: string): QuizRecord[] {
    const db = loadDB();
    return db.quizzes
      .filter((q) => q.userId === userId && (!documentId || q.documentId === documentId))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  findQuizById(id: string, userId: string): QuizRecord | null {
    const db = loadDB();
    return db.quizzes.find((q) => q._id === id && q.userId === userId) || null;
  },

  createQuiz(quizData: Omit<QuizRecord, "_id" | "createdAt">): QuizRecord {
    const db = loadDB();
    const newQuiz: QuizRecord = {
      _id: generateId(),
      ...quizData,
      createdAt: new Date().toISOString(),
    };
    db.quizzes.push(newQuiz);
    saveDB(db);
    return newQuiz;
  },

  addQuizAttempt(
    id: string,
    userId: string,
    attempt: QuizAttempt,
  ): QuizRecord | null {
    const db = loadDB();
    const quiz = db.quizzes.find((q) => q._id === id && q.userId === userId);
    if (!quiz) return null;
    quiz.attempts.push(attempt);
    saveDB(db);
    return quiz;
  },

  // --- FLASHCARDS ---
  findFlashcardSets(userId: string, documentId?: string): FlashcardSetRecord[] {
    const db = loadDB();
    return db.flashcardSets
      .filter((f) => f.userId === userId && (!documentId || f.documentId === documentId))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  findFlashcardSetById(id: string, userId: string): FlashcardSetRecord | null {
    const db = loadDB();
    return (
      db.flashcardSets.find((f) => f._id === id && f.userId === userId) || null
    );
  },

  createFlashcardSet(
    setData: Omit<FlashcardSetRecord, "_id" | "createdAt">,
  ): FlashcardSetRecord {
    const db = loadDB();
    const newSet: FlashcardSetRecord = {
      _id: generateId(),
      ...setData,
      cards: setData.cards.map((c) => ({
        ...c,
        _id: c._id || generateId(),
      })),
      createdAt: new Date().toISOString(),
    };
    db.flashcardSets.push(newSet);
    saveDB(db);
    return newSet;
  },

  updateCardMastery(
    setId: string,
    cardId: string,
    userId: string,
    mastered: boolean,
  ): FlashcardSetRecord | null {
    const db = loadDB();
    const set = db.flashcardSets.find((f) => f._id === setId && f.userId === userId);
    if (!set) return null;
    const card = set.cards.find((c) => c._id === cardId);
    if (card) {
      card.mastered = mastered;
      card.reviewCount = (card.reviewCount || 0) + 1;
      saveDB(db);
    }
    return set;
  },

  addCardToSet(
    setId: string,
    userId: string,
    card: { front: string; back: string },
  ): FlashcardSetRecord | null {
    const db = loadDB();
    const set = db.flashcardSets.find((f) => f._id === setId && f.userId === userId);
    if (!set) return null;
    const newCard: Flashcard = {
      _id: generateId(),
      front: card.front,
      back: card.back,
      mastered: false,
      reviewCount: 0,
    };
    set.cards.push(newCard);
    saveDB(db);
    return set;
  },

  deleteCardFromSet(
    setId: string,
    cardId: string,
    userId: string,
  ): FlashcardSetRecord | null {
    const db = loadDB();
    const set = db.flashcardSets.find((f) => f._id === setId && f.userId === userId);
    if (!set) return null;
    set.cards = set.cards.filter((c) => c._id !== cardId);
    saveDB(db);
    return set;
  },

  deleteFlashcardSet(setId: string, userId: string): boolean {
    const db = loadDB();
    const initialLen = db.flashcardSets.length;
    db.flashcardSets = db.flashcardSets.filter(
      (f) => !(f._id === setId && f.userId === userId),
    );
    if (db.flashcardSets.length !== initialLen) {
      saveDB(db);
      return true;
    }
    return false;
  },

  // --- ANALYTICS ---
  getAnalytics(userId: string) {
    const db = loadDB();
    const user = db.users.find((u) => u._id === userId);
    const documents = db.documents.filter((d) => d.userId === userId);
    const quizzes = db.quizzes.filter((q) => q.userId === userId);
    const flashcardSets = db.flashcardSets.filter((f) => f.userId === userId);
    const chats = db.chatSessions.filter((c) => c.userId === userId);

    const questionsAsked = chats.reduce(
      (sum, s) => sum + s.messages.filter((m) => m.role === "user").length,
      0,
    );

    const studyTimeWeek = [
      { day: "Mon", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Tue", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Wed", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Thu", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Fri", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Sat", minutes: Math.floor(Math.random() * 45) + 15 },
      { day: "Sun", minutes: Math.floor(Math.random() * 45) + 15 },
    ];

    const quizAttempts = quizzes.map((q) => {
      const last = q.attempts[q.attempts.length - 1];
      return {
        quizTitle: q.title,
        score: last ? last.score : 0,
        total: last ? last.totalQuestions : 5,
        percentage: last
          ? Math.round((last.score / last.totalQuestions) * 100)
          : 0,
      };
    });

    return {
      streak: user?.streak || 1,
      xp: user?.xp || 0,
      achievements: user?.achievements || [],
      documentsUploaded: documents.length,
      quizzesTaken: quizzes.length,
      flashcardSets: flashcardSets.length,
      questionsAsked,
      weeklyStudyTime: studyTimeWeek,
      quizPerformances: quizAttempts,
    };
  },
};
