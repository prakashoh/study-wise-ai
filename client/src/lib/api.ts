// API helper client to communicate with Express server

const API_BASE = "/api";

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg =
      data?.message || data?.error || response.statusText || "Request failed";
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse<{ token: string; user: any }>(res);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ token: string; user: any }>(res);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateProfile(updates: {
    name?: string;
    bio?: string;
    avatar?: string;
    institution?: string;
    fieldOfStudy?: string;
    studyGoal?: string;
    preferredTone?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await handleResponse<any>(res);
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...existing, ...data }));
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Documents
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async uploadDocument(file: File, title?: string, subject?: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name.replace(/\.[^/.]+$/, ""));
    formData.append("subject", subject || "General");

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<any>(res);
  },

  async deleteDocument(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // AI Chat
  async sendMessage(
    documentId: string | null,
    question: string,
    simplify = false,
  ) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ documentId, question, simplify }),
    });
    return handleResponse<{ answer: string; messages: any[] }>(res);
  },

  async getChatHistory(documentId: string | null) {
    const docParam = documentId || "null";
    const res = await fetch(`${API_BASE}/ai/chat/history/${docParam}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<{ messages: any[] }>(res);
  },

  // Summaries
  async getSummary(documentId: string, length: "short" | "medium" | "detailed") {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ documentId, length }),
    });
    return handleResponse<{ summary: string }>(res);
  },

  // Quizzes
  async generateQuiz(documentId: string, title?: string) {
    const res = await fetch(`${API_BASE}/ai/quiz`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ documentId, title }),
    });
    return handleResponse<any>(res);
  },

  async getQuizzes(documentId?: string) {
    const path = documentId ? `/ai/quiz/list/${documentId}` : "/ai/quiz/list";
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getQuizDetails(id: string) {
    const res = await fetch(`${API_BASE}/ai/quiz/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async submitQuizAttempt(
    quizId: string,
    score: number,
    totalQuestions: number,
    answers: Record<number, string>,
  ) {
    const res = await fetch(`${API_BASE}/ai/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ score, totalQuestions, answers }),
    });
    return handleResponse<any>(res);
  },

  // Flashcards
  async generateFlashcardSet(documentId: string, title?: string) {
    const res = await fetch(`${API_BASE}/ai/flashcards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ documentId, title }),
    });
    return handleResponse<any>(res);
  },

  async getFlashcardSets(documentId?: string) {
    const path = documentId
      ? `/ai/flashcards/list/${documentId}`
      : "/ai/flashcards/list";
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getFlashcardSetDetails(id: string) {
    const res = await fetch(`${API_BASE}/ai/flashcards/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateCardMastery(setId: string, cardId: string, mastered: boolean) {
    const res = await fetch(`${API_BASE}/ai/flashcards/${setId}/card/${cardId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ mastered }),
    });
    return handleResponse<any>(res);
  },

  async createCustomFlashcardSet(title: string, cards: { front: string; back: string }[]) {
    const res = await fetch(`${API_BASE}/ai/flashcards/custom`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, cards }),
    });
    return handleResponse<any>(res);
  },

  async addCardToFlashcardSet(setId: string, front: string, back: string) {
    const res = await fetch(`${API_BASE}/ai/flashcards/${setId}/card`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ front, back }),
    });
    return handleResponse<any>(res);
  },

  async deleteCardFromFlashcardSet(setId: string, cardId: string) {
    const res = await fetch(`${API_BASE}/ai/flashcards/${setId}/card/${cardId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async deleteFlashcardSet(setId: string) {
    const res = await fetch(`${API_BASE}/ai/flashcards/${setId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Helper auth utilities
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  },

  getCurrentUser() {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  },
};
