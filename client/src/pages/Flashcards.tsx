import React, { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import { useLocation } from "react-router-dom";
import {
  Layers,
  BookOpen,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Clock,
  RotateCw,
  Trophy,
  Upload,
  FileText,
  CheckCircle2,
  Volume2,
  Shuffle,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Gamepad2,
  Brain,
  Star,
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Lightbulb,
  CheckSquare,
  Search,
} from "lucide-react";
import { toast } from "sonner";

// Pre-built starter decks for instant practice
const sampleDecks = [
  {
    title: "Python & Full-Stack Essentials",
    cards: [
      {
        front: "List Comprehension (Python)",
        back: "A concise syntax for creating lists from iterables: [x*2 for x in numbers if x > 0].",
      },
      {
        front: "Dynamic Typing",
        back: "Variable types are checked at runtime without needing explicit variable type declarations.",
      },
      {
        front: "FastAPI / Express.js",
        back: "Modern backend frameworks used to build high-performance, asynchronous REST APIs.",
      },
      {
        front: "MongoDB Document Model",
        back: "A flexible NoSQL database storing records in JSON-like BSON format with dynamic schemas.",
      },
      {
        front: "JWT (JSON Web Token)",
        back: "A compact, URL-safe token format consisting of Header, Payload, and Signature for stateless authentication.",
      },
      {
        front: "Active Recall",
        back: "A cognitive learning method where you stimulate memory retrieval by actively testing yourself rather than passive rereading.",
      },
      {
        front: "Virtual DOM (React)",
        back: "An in-memory representation of real DOM elements that React diffs to minimize expensive browser re-renders.",
      },
      {
        front: "pdf-parse",
        back: "A Node.js library for extracting text streams from PDF files locally for AI grounding.",
      },
    ],
  },
  {
    title: "AI & Machine Learning Concepts",
    cards: [
      {
        front: "Retrieval-Augmented Generation (RAG)",
        back: "An AI architecture combining relevant document retrieval with LLMs to provide grounded, factual answers.",
      },
      {
        front: "Supervised Learning",
        back: "Training algorithms on labeled input-output datasets to predict outcomes for unseen inputs.",
      },
      {
        front: "Tokens in LLMs",
        back: "Chunks of characters or sub-words that language models process as the basic unit of text.",
      },
      {
        front: "Overfitting",
        back: "When an algorithm models training data too closely, learning noise and failing to generalize.",
      },
      {
        front: "Embedding Vector",
        back: "A high-dimensional numerical representation capturing the semantic meaning of text or concepts.",
      },
      {
        front: "Spaced Repetition",
        back: "Scheduling reviews of study material at increasing intervals to combat the forgetting curve.",
      },
    ],
  },
];

export default function Flashcards() {
  const location = useLocation();
  const state = location.state as { documentId?: string } | null;

  const [documents, setDocuments] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");

  // Review & Study State
  const [activeDeck, setActiveDeck] = useState<any>(null);
  const [studyMode, setStudyMode] = useState<
    "flashcards" | "learn" | "write" | "match"
  >("flashcards");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [deckFinished, setDeckFinished] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [starredCardIds, setStarredCardIds] = useState<Set<string>>(new Set());
  const [studyStarredOnly, setStudyStarredOnly] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Table Terms List Filtering
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<
    "all" | "starred" | "mastered" | "unmastered"
  >("all");

  // Multiple Choice "Learn" Mode State
  const [learnChoices, setLearnChoices] = useState<string[]>([]);
  const [learnSelected, setLearnSelected] = useState<string | null>(null);
  const [learnScore, setLearnScore] = useState(0);

  // Write & Spell Mode State
  const [writeInput, setWriteInput] = useState("");
  const [writeFeedback, setWriteFeedback] = useState<null | {
    isCorrect: boolean;
    expected: string;
  }>(null);
  const [writeScore, setWriteScore] = useState(0);

  // Match Game Mode State
  const [matchTiles, setMatchTiles] = useState<
    Array<{
      id: string;
      cardId: string;
      type: "front" | "back";
      text: string;
      state: "idle" | "selected" | "matched";
    }>
  >([]);
  const [firstSelectedTile, setFirstSelectedTile] = useState<number | null>(null);
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchTimer, setMatchTimer] = useState(0);
  const [matchGameActive, setMatchGameActive] = useState(false);
  const matchTimerRef = useRef<any>(null);
  const autoplayTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modals & Creation State
  const [generating, setGenerating] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [customCards, setCustomCards] = useState<
    Array<{ front: string; back: string }>
  >([
    { front: "", back: "" },
    { front: "", back: "" },
  ]);
  const [singleCardFront, setSingleCardFront] = useState("");
  const [singleCardBack, setSingleCardBack] = useState("");

  // Active cards list based on starred filter
  const activeCards = (activeDeck?.cards || []).filter((c: any) => {
    if (studyStarredOnly) return starredCardIds.has(c._id);
    return true;
  });

  const currentCard = activeCards[currentCardIdx] || null;

  useEffect(() => {
    api.getDocuments().then((res) => {
      const readyDocs = res.filter((d) => d.status === "Ready");
      setDocuments(readyDocs);

      if (state?.documentId) {
        setSelectedDocId(state.documentId);
      } else if (readyDocs.length > 0) {
        setSelectedDocId(readyDocs[0]._id);
      }
    });
  }, [state]);

  const loadDecks = () => {
    setListLoading(true);
    api
      .getFlashcardSets()
      .then((res) => {
        setDecks(res);
      })
      .catch(() => {
        toast.error("Failed to load flashcard decks.");
      })
      .finally(() => {
        setListLoading(false);
      });
  };

  useEffect(() => {
    loadDecks();
  }, []);

  // Keyboard navigation for Flip mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeDeck || deckFinished) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (studyMode === "flashcards") {
        if (e.code === "Space") {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          handleNextCard();
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          handlePrevCard();
        } else if (e.key.toLowerCase() === "h") {
          setShowHint((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, studyMode, currentCardIdx, deckFinished, activeCards.length]);

  // Autoplay Slideshow Engine
  useEffect(() => {
    if (isAutoplay && studyMode === "flashcards" && !deckFinished) {
      autoplayTimerRef.current = setInterval(() => {
        setIsFlipped((flipped) => {
          if (!flipped) {
            return true; // Flip to back
          } else {
            // Move to next card
            setCurrentCardIdx((idx) => {
              if (idx < activeCards.length - 1) {
                return idx + 1;
              } else {
                setDeckFinished(true);
                setIsAutoplay(false);
                return idx;
              }
            });
            return false; // Flip back to front
          }
        });
      }, 3000);
    } else {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    }
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplay, studyMode, deckFinished, activeCards.length]);

  // Match Game Timer
  useEffect(() => {
    if (matchGameActive) {
      matchTimerRef.current = setInterval(() => {
        setMatchTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    }
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [matchGameActive]);

  // Setup Learn Multiple Choice Options
  useEffect(() => {
    if (studyMode === "learn" && currentCard && activeDeck?.cards) {
      const correct = currentCard.back;
      const otherCards = activeDeck.cards.filter(
        (c: any) => c._id !== currentCard._id,
      );
      const shuffledOthers = [...otherCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back);

      const all = [correct, ...shuffledOthers].sort(() => Math.random() - 0.5);
      setLearnChoices(all);
      setLearnSelected(null);
    }
  }, [studyMode, currentCardIdx, activeDeck]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedFileName(file.name);
    try {
      const res = await api.uploadDocument(file);
      const newDoc = res.document;

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(newDoc._id);
      toast.success(`"${file.name}" uploaded and selected for flashcards!`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload file.");
      setUploadedFileName("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // AI Flashcard Generation
  const handleCreateDeck = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document.");
      return;
    }

    setGenerating(true);
    try {
      const deck = await api.generateFlashcardSet(selectedDocId);
      toast.success("AI Flashcard Deck generated successfully!");
      setDecks((prev) => [deck, ...prev]);
      startReview(deck);
    } catch {
      toast.error("Failed to generate flashcards. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Load a Pre-Built Starter Deck
  const handleLoadSampleDeck = async (sample: (typeof sampleDecks)[0]) => {
    try {
      const created = await api.createCustomFlashcardSet(
        sample.title,
        sample.cards,
      );
      toast.success(`Sample deck "${sample.title}" created!`);
      setDecks((prev) => [created, ...prev]);
      startReview(created);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create sample deck.");
    }
  };

  // Create Manual Custom Deck
  const handleCreateCustomDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) {
      toast.error("Please provide a deck title.");
      return;
    }
    const validCards = customCards.filter(
      (c) => c.front.trim() && c.back.trim(),
    );
    if (validCards.length === 0) {
      toast.error("Please add at least one complete card (front and back).");
      return;
    }

    try {
      const created = await api.createCustomFlashcardSet(
        newDeckTitle.trim(),
        validCards,
      );
      toast.success("Custom deck created successfully!");
      setDecks((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewDeckTitle("");
      setCustomCards([
        { front: "", back: "" },
        { front: "", back: "" },
      ]);
      startReview(created);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create deck.");
    }
  };

  // Add Card to Existing Deck
  const handleAddCardToDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCardFront.trim() || !singleCardBack.trim()) {
      toast.error("Please fill in both front and back.");
      return;
    }
    try {
      const updated = await api.addCardToFlashcardSet(
        activeDeck._id,
        singleCardFront.trim(),
        singleCardBack.trim(),
      );
      setActiveDeck(updated);
      setShowAddCardModal(false);
      setSingleCardFront("");
      setSingleCardBack("");
      toast.success("Card added to deck!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to add card.");
    }
  };

  // Delete Card from Deck
  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm("Remove this card from the deck?")) return;
    try {
      const updated = await api.deleteCardFromFlashcardSet(
        activeDeck._id,
        cardId,
      );
      setActiveDeck(updated);
      if (currentCardIdx >= updated.cards.length && currentCardIdx > 0) {
        setCurrentCardIdx(currentCardIdx - 1);
      }
      toast.success("Card removed.");
    } catch {
      toast.error("Failed to delete card.");
    }
  };

  // Delete Entire Deck
  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm("Are you sure you want to delete this deck?")) return;
    try {
      await api.deleteFlashcardSet(deckId);
      setDecks((prev) => prev.filter((d) => d._id !== deckId));
      if (activeDeck?._id === deckId) {
        exitReview();
      }
      toast.success("Deck deleted.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete deck.");
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech not supported in this browser.");
    }
  };

  // Start Review Session
  const startReview = (deck: any) => {
    setActiveDeck(deck);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setDeckFinished(false);
    setStudyMode("flashcards");
    setStudyStarredOnly(false);
    setShowHint(false);
    setIsAutoplay(false);
    setLearnScore(0);
    setWriteScore(0);
    setWriteInput("");
    setWriteFeedback(null);

    const mastered = deck.cards.filter((c: any) => c.mastered).length;
    setKnownCount(mastered);
  };

  // Card Navigation
  const handleNextCard = () => {
    setShowHint(false);
    setIsFlipped(false);
    if (currentCardIdx < activeCards.length - 1) {
      setCurrentCardIdx((prev) => prev + 1);
    } else {
      setDeckFinished(true);
    }
  };

  const handlePrevCard = () => {
    setShowHint(false);
    setIsFlipped(false);
    if (currentCardIdx > 0) {
      setCurrentCardIdx((prev) => prev - 1);
    }
  };

  // Shuffle Deck
  const handleShuffle = () => {
    if (!activeDeck) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setActiveDeck({ ...activeDeck, cards: shuffled });
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setDeckFinished(false);
    toast.success("Deck shuffled!");
  };

  // Toggle Star Card
  const toggleStar = (cardId: string) => {
    setStarredCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  // 4-Tier Leitner Spaced Repetition Rating
  const handleSpacedRating = async (
    level: "again" | "hard" | "good" | "easy",
  ) => {
    if (!currentCard) return;
    const isMastered = level === "good" || level === "easy";
    try {
      const updatedDeck = await api.updateCardMastery(
        activeDeck._id,
        currentCard._id,
        isMastered,
      );
      setActiveDeck(updatedDeck);

      if (isMastered) {
        setKnownCount((prev) => prev + 1);
        toast.success(
          level === "easy"
            ? "Easy! Mastered (+10 XP) ⭐"
            : "Good Recall (+5 XP) ✓",
        );
      } else {
        toast.info(
          level === "again"
            ? "Marked to review again soon 🔄"
            : "Keep practicing! 💪",
        );
      }

      handleNextCard();
    } catch {
      toast.error("Failed to update mastery.");
    }
  };

  // Learn Mode Choice Selection
  const handleSelectLearnChoice = (choice: string) => {
    if (learnSelected || !currentCard) return;
    setLearnSelected(choice);
    const isCorrect = choice === currentCard.back;
    if (isCorrect) {
      setLearnScore((prev) => prev + 1);
      toast.success("Correct! (+5 XP)");
    } else {
      toast.error("Incorrect!");
    }
  };

  const handleLearnNext = () => {
    setLearnSelected(null);
    handleNextCard();
  };

  // Write Mode Submit
  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeInput.trim() || writeFeedback || !currentCard) return;

    const userAns = writeInput.trim().toLowerCase();
    const expected = currentCard.back.trim().toLowerCase();

    const isCorrect =
      userAns === expected ||
      expected.includes(userAns) ||
      (userAns.length > 6 &&
        expected.slice(0, 15).includes(userAns.slice(0, 10)));

    if (isCorrect) {
      setWriteScore((prev) => prev + 1);
      toast.success("Spot on recall! (+5 XP)");
    } else {
      toast.error("Not quite!");
    }

    setWriteFeedback({
      isCorrect,
      expected: currentCard.back,
    });
  };

  const handleWriteNext = () => {
    setWriteInput("");
    setWriteFeedback(null);
    handleNextCard();
  };

  // Match Game Setup
  const initMatchGame = (cards: any[]) => {
    const subset = cards.slice(0, 6);
    const tiles: Array<{
      id: string;
      cardId: string;
      type: "front" | "back";
      text: string;
      state: "idle" | "selected" | "matched";
    }> = [];

    subset.forEach((card, idx) => {
      tiles.push({
        id: `f-${idx}`,
        cardId: card._id || `c-${idx}`,
        type: "front",
        text: card.front,
        state: "idle",
      });
      tiles.push({
        id: `b-${idx}`,
        cardId: card._id || `c-${idx}`,
        type: "back",
        text: card.back,
        state: "idle",
      });
    });

    tiles.sort(() => Math.random() - 0.5);
    setMatchTiles(tiles);
    setFirstSelectedTile(null);
    setMatchMoves(0);
    setMatchTimer(0);
    setMatchGameActive(true);
  };

  const handleTileClick = (index: number) => {
    const tile = matchTiles[index];
    if (tile.state === "matched" || tile.state === "selected") return;

    if (firstSelectedTile === null) {
      setFirstSelectedTile(index);
      setMatchTiles((prev) =>
        prev.map((t, idx) => (idx === index ? { ...t, state: "selected" } : t)),
      );
    } else {
      setMatchMoves((prev) => prev + 1);
      const firstTile = matchTiles[firstSelectedTile];

      if (firstTile.cardId === tile.cardId && firstTile.type !== tile.type) {
        // MATCH!
        setMatchTiles((prev) =>
          prev.map((t, idx) =>
            idx === index || idx === firstSelectedTile
              ? { ...t, state: "matched" }
              : t,
          ),
        );
        setFirstSelectedTile(null);
        toast.success("Match!");

        setTimeout(() => {
          setMatchTiles((latest) => {
            const allMatched = latest.every(
              (t, idx) =>
                t.state === "matched" ||
                idx === index ||
                idx === firstSelectedTile,
            );
            if (allMatched) {
              setMatchGameActive(false);
              toast.success("🎉 Outstanding! All tiles matched!");
            }
            return latest;
          });
        }, 100);
      } else {
        // Mismatch
        setMatchTiles((prev) =>
          prev.map((t, idx) =>
            idx === index ? { ...t, state: "selected" } : t,
          ),
        );
        setTimeout(() => {
          setMatchTiles((prev) =>
            prev.map((t, idx) =>
              idx === index || idx === firstSelectedTile
                ? { ...t, state: "idle" }
                : t,
            ),
          );
          setFirstSelectedTile(null);
        }, 700);
      }
    }
  };

  // Print Deck Study Sheet
  const handlePrintDeck = () => {
    if (!activeDeck) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeDeck.title} - StudyMate Flashcards</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #111; }
            h1 { color: #4F46E5; margin-bottom: 5px; }
            p.sub { color: #666; margin-bottom: 25px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .card { border: 2px dashed #999; border-radius: 12px; padding: 18px; page-break-inside: avoid; }
            .front { font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1e1b4b; }
            .back { font-size: 14px; color: #4b5563; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>StudyMate AI: ${activeDeck.title}</h1>
          <p class="sub">${activeDeck.cards.length} Flashcard Terms & Definitions</p>
          <div class="grid">
            ${activeDeck.cards
              .map(
                (c: any, i: number) => `
              <div class="card">
                <div class="front">${i + 1}. ${c.front}</div>
                <div class="back">${c.back}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exitReview = () => {
    setActiveDeck(null);
    setDeckFinished(false);
    setMatchGameActive(false);
    setIsAutoplay(false);
    loadDecks();
  };

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="space-y-8 animate-fade-in pb-16 min-h-screen"
      >
        {/* --- ACTIVE DECK STUDY INTERFACE --- */}
        {activeDeck ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 1. Header Control Bar */}
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Flashcard Set
                    </span>
                    {studyStarredOnly && (
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Star className="size-3 fill-amber-500" /> Starred Only (
                        {activeCards.length})
                      </span>
                    )}
                  </div>
                  <h2 className="font-extrabold text-xl sm:text-2xl text-foreground truncate max-w-lg">
                    {activeDeck.title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                    <span>{activeDeck.cards.length} Terms</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold">
                      {knownCount} Mastered
                    </span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">
                      {starredCardIds.size} Starred
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {starredCardIds.size > 0 && (
                    <button
                      onClick={() => {
                        setStudyStarredOnly(!studyStarredOnly);
                        setCurrentCardIdx(0);
                        setIsFlipped(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        studyStarredOnly
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title="Study only starred cards"
                    >
                      <Star
                        className={`size-3.5 ${
                          studyStarredOnly ? "fill-white" : ""
                        }`}
                      />
                      {studyStarredOnly ? "All Terms" : "Starred Only"}
                    </button>
                  )}

                  <button
                    onClick={handlePrintDeck}
                    title="Print study sheet"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Printer className="size-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setShowAddCardModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl px-3.5 py-2 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add Card
                  </button>

                  <button
                    onClick={exitReview}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:bg-secondary rounded-xl px-3.5 py-2 border border-border cursor-pointer"
                  >
                    Exit
                  </button>
                </div>
              </div>

              {/* Study Mode Selector Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex bg-secondary/60 rounded-2xl p-1 border border-border/80 text-xs font-bold gap-1">
                  <button
                    onClick={() => {
                      setStudyMode("flashcards");
                      setDeckFinished(false);
                    }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      studyMode === "flashcards"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Layers className="size-3.5" /> Flashcards
                  </button>
                  <button
                    onClick={() => {
                      setStudyMode("learn");
                      setCurrentCardIdx(0);
                      setLearnScore(0);
                      setDeckFinished(false);
                    }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      studyMode === "learn"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <CheckSquare className="size-3.5" /> Learn (MCQ)
                  </button>
                  <button
                    onClick={() => {
                      setStudyMode("write");
                      setCurrentCardIdx(0);
                      setWriteScore(0);
                      setWriteInput("");
                      setWriteFeedback(null);
                      setDeckFinished(false);
                    }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      studyMode === "write"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Brain className="size-3.5" /> Write Recall
                  </button>
                  <button
                    onClick={() => {
                      setStudyMode("match");
                      initMatchGame(activeDeck.cards);
                    }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      studyMode === "match"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Gamepad2 className="size-3.5" /> Match Rush
                  </button>
                </div>

                {studyMode === "flashcards" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoplay(!isAutoplay)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isAutoplay
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title="Autoplay / Slideshow"
                    >
                      {isAutoplay ? (
                        <>
                          <Pause className="size-3.5" /> Autoplay On
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" /> Slideshow
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShuffle}
                      className="p-2 text-muted-foreground hover:text-primary rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer"
                      title="Shuffle Cards"
                    >
                      <Shuffle className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- 1. MODERN QUIZLET-STYLE FLASHCARDS MODE --- */}
            {studyMode === "flashcards" && (
              <>
                {/* Visual Progress Bar */}
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-brand h-full rounded-full transition-all duration-300 shadow-glow"
                    style={{
                      width: `${
                        activeCards.length > 0
                          ? ((currentCardIdx + 1) / activeCards.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {!deckFinished && currentCard ? (
                  <div className="space-y-6 flex flex-col items-center">
                    {/* The Hero 3D Card */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full h-96 cursor-pointer [perspective:1200px] select-none group"
                    >
                      <div
                        className={`relative w-full h-full rounded-3xl border-2 transition-all duration-500 [transform-style:preserve-3d] shadow-xl ${
                          isFlipped
                            ? "[transform:rotateY(180deg)] border-amber-500/40 bg-gradient-to-br from-card to-amber-500/5"
                            : "border-primary/30 hover:border-primary/70 bg-gradient-to-br from-card via-card to-primary/5"
                        }`}
                      >
                        {/* Front of Card (Term / Concept) */}
                        <div className="absolute inset-0 w-full h-full p-8 sm:p-10 flex flex-col justify-between items-center text-center [backface-visibility:hidden]">
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1">
                              Card {currentCardIdx + 1} of {activeCards.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(currentCard.front);
                                }}
                                className="p-2 rounded-xl bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                title="Pronounce term"
                              >
                                <Volume2 className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowHint(!showHint);
                                }}
                                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                  showHint
                                    ? "bg-amber-500/20 text-amber-600"
                                    : "bg-secondary/50 text-muted-foreground hover:text-amber-500"
                                }`}
                                title="Show Hint"
                              >
                                <Lightbulb className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(currentCard._id);
                                }}
                                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                  starredCardIds.has(currentCard._id)
                                    ? "bg-amber-500/20 text-amber-500"
                                    : "bg-secondary/50 text-muted-foreground hover:text-amber-500"
                                }`}
                                title="Star Card"
                              >
                                <Star
                                  className={`size-4 ${
                                    starredCardIds.has(currentCard._id)
                                      ? "fill-amber-500"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Term Content */}
                          <div className="space-y-4 my-auto px-4 max-w-xl">
                            <p className="text-2xl sm:text-3xl font-black text-foreground leading-snug tracking-tight">
                              {currentCard.front}
                            </p>
                            {showHint && (
                              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 animate-fade-in max-w-md mx-auto">
                                💡 <strong>Hint:</strong>{" "}
                                {currentCard.back.slice(0, 45)}...
                              </div>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground font-bold group-hover:text-primary transition-colors bg-secondary/40 px-4 py-1.5 rounded-full border border-border">
                            <RotateCw className="size-3.5" />
                            Click to flip definition • Space
                          </span>
                        </div>

                        {/* Back of Card (Definition / Explanation) */}
                        <div className="absolute inset-0 w-full h-full p-8 sm:p-10 flex flex-col justify-between items-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1">
                              Definition & Meaning
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(currentCard.back);
                                }}
                                className="p-2 rounded-xl bg-secondary/50 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                                title="Pronounce definition"
                              >
                                <Volume2 className="size-4" />
                              </button>
                            </div>
                          </div>

                          {/* Definition Content */}
                          <div className="space-y-3 my-auto px-4 max-w-xl overflow-y-auto max-h-52">
                            <p className="text-base sm:text-lg text-foreground font-semibold leading-relaxed">
                              {currentCard.back}
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground font-bold bg-secondary/40 px-4 py-1.5 rounded-full border border-border">
                            <RotateCw className="size-3.5" />
                            Click to flip back to term
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Navigation Row (Prev, Quick Jump Dots, Next) */}
                    <div className="flex items-center justify-between w-full px-2">
                      <button
                        onClick={handlePrevCard}
                        disabled={currentCardIdx === 0}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card hover:bg-secondary font-bold text-xs text-foreground shadow-sm transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ArrowLeft className="size-4" /> Previous
                      </button>

                      {/* Quick jump dot indicators */}
                      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs px-2 py-1">
                        {activeCards.map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentCardIdx(idx);
                              setIsFlipped(false);
                            }}
                            className={`size-2.5 rounded-full transition-all cursor-pointer ${
                              idx === currentCardIdx
                                ? "bg-primary scale-125 ring-2 ring-primary/30"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                            }`}
                            title={`Jump to card ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleNextCard}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-brand font-bold text-xs text-primary-foreground shadow-glow hover:opacity-95 transition-all cursor-pointer"
                      >
                        Next <ArrowRight className="size-4" />
                      </button>
                    </div>

                    {/* 3. Leitner 4-Tier Spaced Repetition Bar */}
                    <div className="w-full bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block text-center">
                        How well did you know this term?
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => handleSpacedRating("again")}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 font-bold transition-all cursor-pointer"
                        >
                          <span className="text-sm">🔴 Again</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Needs Review
                          </span>
                        </button>
                        <button
                          onClick={() => handleSpacedRating("hard")}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 text-amber-600 font-bold transition-all cursor-pointer"
                        >
                          <span className="text-sm">🟡 Hard</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Took Effort
                          </span>
                        </button>
                        <button
                          onClick={() => handleSpacedRating("good")}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-blue-600 font-bold transition-all cursor-pointer"
                        >
                          <span className="text-sm">🟢 Good</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Remembered
                          </span>
                        </button>
                        <button
                          onClick={() => handleSpacedRating("easy")}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold transition-all cursor-pointer"
                        >
                          <span className="text-sm">💎 Mastered</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            +10 XP
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Deck Finished Celebration Card
                  <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl animate-fade-in">
                    <Trophy className="size-20 text-amber-500 mx-auto fill-amber-500/10 animate-bounce" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-extrabold text-foreground">
                        Deck Review Completed!
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        You reviewed all {activeCards.length} cards. You master{" "}
                        <strong className="text-primary font-bold">
                          {knownCount}
                        </strong>{" "}
                        out of {activeDeck.cards.length} total terms in this set.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={() => startReview(activeDeck)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-xs font-bold text-primary-foreground shadow-glow cursor-pointer"
                      >
                        <RotateCw className="size-4" /> Restart Session
                      </button>
                      <button
                        onClick={handleShuffle}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                      >
                        <Shuffle className="size-4" /> Shuffle & Review
                      </button>
                      <button
                        onClick={() => {
                          setStudyMode("learn");
                          setCurrentCardIdx(0);
                          setLearnScore(0);
                          setDeckFinished(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-primary px-6 py-3 text-xs font-bold hover:bg-primary/20 cursor-pointer"
                      >
                        <CheckSquare className="size-4" /> Test in Learn Mode
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Complete Terms Table (Quizlet-Style underneath the card) */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 mt-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground">
                        Terms in this set ({activeDeck.cards.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Inspect, pronounce, star, edit, or delete any card.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search terms..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-52 font-medium"
                        />
                      </div>

                      <button
                        onClick={() => setShowAddCardModal(true)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Plus className="size-3.5" /> Add
                      </button>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {[
                      { id: "all", label: `All (${activeDeck.cards.length})` },
                      {
                        id: "starred",
                        label: `Starred (${starredCardIds.size})`,
                      },
                      { id: "mastered", label: `Mastered (${knownCount})` },
                      {
                        id: "unmastered",
                        label: `Still Learning (${
                          activeDeck.cards.length - knownCount
                        })`,
                      },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setTableFilter(f.id as any)}
                        className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          tableFilter === f.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Terms List Cards */}
                  <div className="space-y-3">
                    {activeDeck.cards
                      .filter((c: any) => {
                        if (
                          tableSearch &&
                          !c.front
                            .toLowerCase()
                            .includes(tableSearch.toLowerCase()) &&
                          !c.back
                            .toLowerCase()
                            .includes(tableSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        if (
                          tableFilter === "starred" &&
                          !starredCardIds.has(c._id)
                        )
                          return false;
                        if (tableFilter === "mastered" && !c.mastered)
                          return false;
                        if (tableFilter === "unmastered" && c.mastered)
                          return false;
                        return true;
                      })
                      .map((card: any, idx: number) => (
                        <div
                          key={card._id || idx}
                          className="p-4 sm:p-5 rounded-2xl border border-border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                #{idx + 1}
                              </span>
                              <h4 className="font-bold text-base text-foreground">
                                {card.front}
                              </h4>
                              {card.mastered && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Mastered
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {card.back}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              onClick={() => speakText(card.front)}
                              className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                              title="Listen"
                            >
                              <Volume2 className="size-4" />
                            </button>
                            <button
                              onClick={() => toggleStar(card._id)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                starredCardIds.has(card._id)
                                  ? "text-amber-500"
                                  : "text-muted-foreground hover:text-amber-500"
                              }`}
                              title="Star card"
                            >
                              <Star
                                className={`size-4 ${
                                  starredCardIds.has(card._id)
                                    ? "fill-amber-500"
                                    : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card._id)}
                              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Delete card"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* --- 2. LEARN (MULTIPLE CHOICE) MODE --- */}
            {studyMode === "learn" && (
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
                {!deckFinished && currentCard ? (
                  <>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border pb-3">
                      <span>
                        Card {currentCardIdx + 1} of {activeCards.length}
                      </span>
                      <span className="text-primary font-bold">
                        Score: {learnScore} / {currentCardIdx}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                        Which definition matches this term?
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground pt-2">
                        {currentCard.front}
                      </h3>
                    </div>

                    {/* 4 Multiple Choice Options */}
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      {learnChoices.map((choice, idx) => {
                        const isChosen = learnSelected === choice;
                        const isCorrect = choice === currentCard.back;
                        let optionStyle =
                          "border-border bg-secondary/20 hover:bg-secondary/60 text-foreground";

                        if (learnSelected) {
                          if (isCorrect) {
                            optionStyle =
                              "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold";
                          } else if (isChosen && !isCorrect) {
                            optionStyle =
                              "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectLearnChoice(choice)}
                            disabled={!!learnSelected}
                            className={`p-4 rounded-2xl border text-sm text-left transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${optionStyle}`}
                          >
                            <span className="size-6 rounded-full border border-current flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-relaxed flex-1">
                              {choice}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {learnSelected && (
                      <div className="flex justify-end pt-3">
                        <button
                          onClick={handleLearnNext}
                          className="px-6 py-3 bg-gradient-brand text-primary-foreground font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5 cursor-pointer"
                        >
                          Next Question <ArrowRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-6 py-6 animate-fade-in">
                    <Trophy className="size-20 text-amber-500 mx-auto fill-amber-500/10" />
                    <div className="space-y-1">
                      <h3 className="text-3xl font-extrabold text-foreground">
                        Learn Session Complete!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You scored{" "}
                        <strong className="text-primary font-bold">
                          {learnScore}
                        </strong>{" "}
                        out of {activeCards.length} (
                        {Math.round((learnScore / activeCards.length) * 100)}%).
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentCardIdx(0);
                        setLearnScore(0);
                        setDeckFinished(false);
                      }}
                      className="px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl text-xs shadow-glow cursor-pointer"
                    >
                      Practice Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- 3. WRITE & SPELL MODE --- */}
            {studyMode === "write" && (
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
                {!deckFinished && currentCard ? (
                  <>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border pb-3">
                      <span>
                        Card {currentCardIdx + 1} of {activeCards.length}
                      </span>
                      <span className="text-primary font-bold">
                        Score: {writeScore} / {currentCardIdx}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                        Type the definition of:
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                        {currentCard.front}
                      </h3>
                    </div>

                    <form onSubmit={handleWriteSubmit} className="space-y-4">
                      <textarea
                        rows={3}
                        value={writeInput}
                        onChange={(e) => setWriteInput(e.target.value)}
                        disabled={!!writeFeedback}
                        placeholder="Type the definition or meaning here..."
                        className="w-full rounded-2xl border border-border bg-background p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      />

                      {!writeFeedback ? (
                        <button
                          type="submit"
                          disabled={!writeInput.trim()}
                          className="w-full py-3.5 bg-gradient-brand text-primary-foreground font-bold rounded-xl text-sm shadow-glow disabled:opacity-50 cursor-pointer"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className={`p-5 rounded-2xl border ${
                              writeFeedback.isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            <p className="font-bold text-sm mb-1">
                              {writeFeedback.isCorrect
                                ? "✓ Perfect Active Recall!"
                                : "✗ Exact Definition:"}
                            </p>
                            <p className="text-xs leading-relaxed">
                              {writeFeedback.expected}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleWriteNext}
                            className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-glow cursor-pointer"
                          >
                            Next Card →
                          </button>
                        </div>
                      )}
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-6 py-6 animate-fade-in">
                    <Trophy className="size-20 text-amber-500 mx-auto fill-amber-500/10" />
                    <div className="space-y-1">
                      <h3 className="text-3xl font-extrabold text-foreground">
                        Write Practice Complete!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You scored{" "}
                        <strong className="text-primary font-bold">
                          {writeScore}
                        </strong>{" "}
                        out of {activeCards.length}.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentCardIdx(0);
                        setWriteScore(0);
                        setWriteInput("");
                        setWriteFeedback(null);
                        setDeckFinished(false);
                      }}
                      className="px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl text-xs shadow-glow cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- 4. MATCH RUSH TILES GAME --- */}
            {studyMode === "match" && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border pb-3">
                  <span>⏱️ Time: {matchTimer}s</span>
                  <span>Moves: {matchMoves}</span>
                  <button
                    onClick={() => initMatchGame(activeDeck.cards)}
                    className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="size-3" /> Reset Grid
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {matchTiles.map((tile, idx) => {
                    return (
                      <button
                        key={tile.id}
                        onClick={() => handleTileClick(idx)}
                        disabled={tile.state === "matched"}
                        className={`p-4 rounded-2xl border text-xs font-semibold text-center h-28 flex flex-col items-center justify-center transition-all select-none cursor-pointer ${
                          tile.state === "matched"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 opacity-40 cursor-default"
                            : tile.state === "selected"
                              ? "bg-primary text-primary-foreground border-primary scale-105 shadow-glow"
                              : "bg-secondary/30 border-border hover:border-primary/40 hover:bg-secondary/60 text-foreground"
                        }`}
                      >
                        <span className="line-clamp-4 leading-relaxed">
                          {tile.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          // --- DECKS DIRECTORY & GENERATOR PANEL ---
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Smart Flashcards
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Turn study notes into interactive recall cards. Flip, quiz
                  yourself, or speed-match definitions.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-brand text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer self-start md:self-auto"
              >
                <Plus className="size-4" />
                Create Custom Deck
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Generator Panel */}
              <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl p-6 shadow-sm h-fit space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="size-4.5 text-primary" />
                  Generate New Deck
                </h3>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="size-3.5" />
                        Target Notes
                      </label>
                      {documents.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {documents.length} available
                        </span>
                      )}
                    </div>

                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold focus:outline-none"
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    >
                      <option value="" disabled>
                        Choose notes...
                      </option>
                      {documents.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.title}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex py-0.5 items-center">
                      <div className="flex-grow border-t border-border/70"></div>
                      <span className="flex-shrink mx-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        or upload notes
                      </span>
                      <div className="flex-grow border-t border-border/70"></div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {/* Choose File Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span className="truncate">
                            Uploading {uploadedFileName}...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          <span>Choose File (PDF, TXT, DOCX)</span>
                        </>
                      )}
                    </button>

                    {documents.find((d) => d._id === selectedDocId) && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {
                              documents.find((d) => d._id === selectedDocId)
                                ?.title
                            }
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          <CheckCircle2 className="size-3" /> Ready
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreateDeck}
                    disabled={generating || !selectedDocId}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Generating Deck...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" /> Assemble AI Deck
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Starter Decks Section */}
                <div className="border-t border-border/80 pt-5 space-y-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Quick Start Sample Decks
                  </span>
                  <div className="space-y-2">
                    {sampleDecks.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadSampleDeck(sample)}
                        className="w-full text-left p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/30 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {sample.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {sample.cards.length} Core Study Terms
                          </p>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decks Directory List */}
              <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-bold text-lg">My Flashcard Decks</h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    {decks.length} Decks
                  </span>
                </div>

                {listLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : decks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-secondary/10 text-center space-y-3">
                    <Layers className="size-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        No decks found
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Choose notes on the left to generate an AI deck, or click
                        any of the Quick Start Sample Decks below to begin
                        reviewing instantly.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleLoadSampleDeck(sampleDecks[0])}
                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Load Python Essentials Deck
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {decks.map((deck) => {
                      const masteredCount = deck.cards.filter(
                        (c: any) => c.mastered,
                      ).length;
                      const percentage =
                        deck.cards.length > 0
                          ? Math.round(
                              (masteredCount / deck.cards.length) * 100,
                            )
                          : 0;

                      return (
                        <div
                          key={deck._id}
                          className="border border-border/70 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 hover:shadow-card transition-all bg-secondary/10"
                        >
                          <div className="space-y-2 max-w-md">
                            <h4 className="font-bold text-base text-foreground truncate">
                              {deck.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span>
                                {new Date(deck.createdAt).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>{deck.cards.length} Terms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-28 bg-border rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {masteredCount} / {deck.cards.length} mastered (
                                {percentage}%)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            <button
                              onClick={() => handleDeleteDeck(deck._id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl border border-border transition-colors cursor-pointer"
                              title="Delete Deck"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => startReview(deck)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-glow px-4 py-2 text-xs font-semibold hover:opacity-90 select-none cursor-pointer"
                            >
                              Study Deck
                              <ArrowRight className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- MODAL: CREATE CUSTOM DECK --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Plus className="size-5 text-primary" /> Create Custom Deck
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomDeck} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Deck Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Flashcards
                  </label>
                  {customCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-secondary/30 border border-border rounded-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary">
                          Card {idx + 1}
                        </span>
                        {customCards.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCustomCards((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Front (Term or Question)"
                        value={card.front}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomCards((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, front: val } : c,
                            ),
                          );
                        }}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Back (Definition or Explanation)"
                        value={card.back}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomCards((prev) =>
                            prev.map((c, i) =>
                              i === idx ? { ...c, back: val } : c,
                            ),
                          );
                        }}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCustomCards((prev) => [
                        ...prev,
                        { front: "", back: "" },
                      ])
                    }
                    className="w-full py-2 border border-dashed border-border rounded-xl text-xs font-bold text-primary hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    + Add Another Card
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-gradient-brand text-primary-foreground rounded-xl shadow-glow cursor-pointer"
                  >
                    Save & Review Deck
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: ADD CARD TO EXISTING DECK --- */}
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">
                  Add Card to "{activeDeck?.title}"
                </h3>
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleAddCardToDeck} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Front (Question or Term)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asynchronous I/O"
                    value={singleCardFront}
                    onChange={(e) => setSingleCardFront(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Back (Answer or Definition)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Non-blocking input/output operations..."
                    value={singleCardBack}
                    onChange={(e) => setSingleCardBack(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-glow cursor-pointer"
                  >
                    Add Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
