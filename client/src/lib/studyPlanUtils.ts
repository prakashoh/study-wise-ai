export interface ExamDetail {
  id: string;
  title: string;
  subject: string;
  date: string; // Format: YYYY-MM-DD
  portion: string; // Topics/chapters to cover
  documentId?: string;
  documentTitle?: string;
  document2Id?: string;
  document2Title?: string;
  priority: "High" | "Medium" | "Low";
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

export interface DailyScheduleItem {
  day: string;
  dateLabel: string;
  topic: string;
  status: "done" | "today" | "upcoming";
}

const STORAGE_KEY_EXAMS = "studymate_exams";
const STORAGE_KEY_TASKS = "studymate_tasks";

export const DEFAULT_EXAMS: ExamDetail[] = [
  {
    id: "exam-1",
    title: "Physics Midterm: Classical Mechanics & Dynamics",
    subject: "Physics",
    date: "2026-09-07", // Upcoming Monday
    portion: "Newton's 2nd Law (F = m × a), Momentum & Impulse, Work-Energy Theorem",
    documentTitle: "Newton's Laws of Motion.pdf",
    priority: "High",
  },
  {
    id: "exam-2",
    title: "Calculus Chapter Test: Integration & Series",
    subject: "Mathematics",
    date: "2026-09-15",
    portion: "Integration by Parts, Power Series, Convergence Tests",
    documentTitle: "Calculus Lecture Notes.pdf",
    priority: "Medium",
  },
  {
    id: "exam-3",
    title: "Full-Stack Web Engineering Assignment Evaluation",
    subject: "Computer Science",
    date: "2026-09-10",
    portion: "REST APIs, MongoDB Schemas, Express Middleware, React Hooks",
    documentTitle: "Tap_Earn_Page_task_Full_Stack.pdf",
    priority: "High",
  },
];

export function getSavedExams(): ExamDetail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading saved exams:", e);
  }
  return DEFAULT_EXAMS;
}

export function saveExams(exams: ExamDetail[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
  } catch (e) {
    console.error("Error saving exams:", e);
  }
}

export function getExamCountdown(examDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(examDateStr);
  examDate.setHours(0, 0, 0, 0);

  const diffMs = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const examDayName = dayNames[examDate.getDay()] || "Exam Day";

  let badgeText = "";
  if (diffDays < 0) {
    badgeText = "Exam Completed";
  } else if (diffDays === 0) {
    badgeText = "Today!";
  } else if (diffDays === 1) {
    badgeText = "Tomorrow!";
  } else {
    badgeText = `In ${diffDays} days`;
  }

  return {
    diffDays,
    examDayName,
    badgeText,
    isUrgent: diffDays >= 0 && diffDays <= 5,
  };
}

export function getClosestUpcomingExam(exams: ExamDetail[]): {
  exam: ExamDetail | null;
  diffDays: number;
  examDayName: string;
  badgeText: string;
  todaysTopic: string;
} {
  const activeExams = exams.map((e) => {
    const countdown = getExamCountdown(e.date);
    return { ...e, countdown };
  });

  // Filter exams that are today or in future, sort by closest date
  const upcoming = activeExams
    .filter((e) => e.countdown.diffDays >= 0)
    .sort((a, b) => a.countdown.diffDays - b.countdown.diffDays);

  if (upcoming.length === 0) {
    const fallback = exams[0] || DEFAULT_EXAMS[0];
    const countdown = getExamCountdown(fallback.date);
    return {
      exam: fallback,
      diffDays: countdown.diffDays,
      examDayName: countdown.examDayName,
      badgeText: countdown.badgeText,
      todaysTopic: getDailyTopicForExam(fallback, countdown.diffDays),
    };
  }

  const closest = upcoming[0];
  const todaysTopic = getDailyTopicForExam(closest, closest.countdown.diffDays);

  return {
    exam: closest,
    diffDays: closest.countdown.diffDays,
    examDayName: closest.countdown.examDayName,
    badgeText: closest.countdown.badgeText,
    todaysTopic,
  };
}

export function getDailyTopicForExam(exam: ExamDetail, diffDays: number): string {
  if (!exam.portion || !exam.portion.trim()) {
    return `Core concepts & review for ${exam.title}`;
  }

  // Split portions by comma, semicolon, bullet or newline
  const topics = exam.portion
    .split(/[,;\n•]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  if (topics.length === 0) {
    return exam.portion.slice(0, 60);
  }

  // If exam is today: final review
  if (diffDays <= 0) {
    return `Final High-Yield Formula & Concept Review (${topics[0]})`;
  }

  // Distribute topics across the countdown
  // e.g. if 4 days left and 4 topics: today is topic 0 or 1
  const topicIdx = Math.max(0, Math.min(topics.length - 1, diffDays > topics.length ? 0 : topics.length - diffDays));
  return topics[topicIdx] || topics[0];
}

export function generateTasksForExam(exam: ExamDetail, todaysTopic: string): StudyTask[] {
  const doc1Name = exam.documentTitle || "uploaded PDF material";
  const doc2Name = exam.document2Title;

  return [
    {
      id: Date.now().toString() + "-1",
      title: `Read & annotate: ${todaysTopic} (${doc1Name})`,
      subject: exam.subject || "General",
      durationMinutes: 20,
      completed: false,
      priority: "High",
    },
    {
      id: Date.now().toString() + "-2",
      title: doc2Name
        ? `Cross-reference formulas & syllabus notes in ${doc2Name}`
        : `Ask AI Tutor for concept explanation & key formulas on "${todaysTopic}"`,
      subject: exam.subject || "General",
      durationMinutes: 15,
      completed: false,
      priority: "Medium",
    },
    {
      id: Date.now().toString() + "-3",
      title: `Complete AI Quick Quiz testing "${todaysTopic}"`,
      subject: exam.subject || "General",
      durationMinutes: 10,
      completed: false,
      priority: "High",
    },
    {
      id: Date.now().toString() + "-4",
      title: `Review 8 flashcards on "${todaysTopic}" definitions & active recall`,
      subject: exam.subject || "General",
      durationMinutes: 15,
      completed: false,
      priority: "Medium",
    },
    {
      id: Date.now().toString() + "-5",
      title: `Solve quantitative practice exercises & past questions on "${todaysTopic}"`,
      subject: exam.subject || "General",
      durationMinutes: 25,
      completed: false,
      priority: "Low",
    },
  ];
}

export function generateAdaptiveWeeklySchedule(exam: ExamDetail): DailyScheduleItem[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const todayDayIdx = today.getDay();

  const topics = (exam.portion || "")
    .split(/[,;\n•]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  const fallbackTopics = [
    "Fundamental Definitions & Overview",
    "Core Principles & Mathematical Formulas",
    "Applied Problem Solving & Worksheets",
    "Advanced Edge Cases & Variations",
    "Timed Diagnostic Quiz & Score Analysis",
    "Flashcard Speed Drill & Weakness Review",
    "Final High-Yield Exam Simulation",
  ];

  const schedule: DailyScheduleItem[] = [];

  // Generate 7 days starting from Monday of current week or from today
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    // Start from Monday (or offset relative to today)
    const dayOffset = i - ((todayDayIdx + 6) % 7); // i=0 is Monday
    d.setDate(today.getDate() + dayOffset);

    const dDayIdx = d.getDay();
    const dayName = dayNames[dDayIdx];
    const isToday = d.toDateString() === today.toDateString();
    const isPast = d < today && !isToday;

    const topicIndex = i % (topics.length > 0 ? topics.length : fallbackTopics.length);
    const assignedTopic = topics.length > 0 ? topics[topicIndex] : fallbackTopics[topicIndex];

    schedule.push({
      day: dayName,
      dateLabel: `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`,
      topic: assignedTopic,
      status: isToday ? "today" : isPast ? "done" : "upcoming",
    });
  }

  return schedule;
}

export function getSavedTasks(): StudyTask[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading saved tasks:", e);
  }
  return null;
}

export function saveTasks(tasks: StudyTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error("Error saving tasks:", e);
  }
}
