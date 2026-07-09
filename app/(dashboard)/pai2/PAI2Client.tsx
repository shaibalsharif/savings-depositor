"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Send,
  Mic,
  MicOff,
  Paperclip,
  Menu,
  X,
  MessageSquare,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  FolderPlus,
  ChevronRight,
  AlertCircle,
  Bot,
  Copy,
  Check,
  BarChart2,
  Loader2,
  RefreshCw,
  BrainCircuit,
  Square,
  ArrowDown,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "./pai2.css";
import { PAI2AnalyticsClient } from "./PAI2AnalyticsClient";

// ─── Types ────────────────────────────────────────────────────────────

interface Conversation {
  chatId: string;
  title: string;
  folderId: string | null;
  provider: string;
  model: string;
  status: string;
  draftPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatFolder {
  folderId: string;
  name: string;
  createdAt: string;
}

interface Message {
  messageId: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  inputType: string;
  status: string;
  createdAt: string;
}

interface ProviderInfo {
  key: string;
  label: string;
  defaultModel: string;
  models: { id: string; label: string }[];
}

interface PAI2ClientProps {
  user: { id: string; name: string; picture: string | null };
  isManager: boolean;
}

// ─── Chart rendering ──────────────────────────────────────────────────

interface ChartPoint {
  label: string;
  value: number;
}
interface ChartSpec {
  type?: "bar" | "line" | "pie" | "donut";
  title?: string;
  data?: ChartPoint[];
}

const CHART_COLORS = [
  "hsl(173 58% 45%)",
  "hsl(200 70% 50%)",
  "hsl(45 93% 55%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 58%)",
  "hsl(140 60% 45%)",
  "hsl(320 60% 58%)",
  "hsl(30 90% 55%)",
];

const CHART_TOOLTIP_STYLE = {
  background: "hsl(222 47% 12%)",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
} as const;

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const;

/** Renders a chart from an AI ```chart``` JSON block, honouring its `type`. */
function Pai2Chart({ chart }: { chart: ChartSpec }) {
  const data = (Array.isArray(chart.data) ? chart.data : []).filter(
    (d) => d && typeof d.value === "number" && Number.isFinite(d.value)
  );
  if (data.length === 0) return null;

  const type = (chart.type || "bar").toLowerCase();
  const fmt = (v: unknown) => `৳${Number(v).toLocaleString()}`;

  let inner: React.ReactElement;
  if (type === "pie" || type === "donut") {
    inner = (
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={88}
          innerRadius={type === "donut" ? 46 : 0}
          label={(e: { name?: string }) => e.name ?? ""}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={fmt} contentStyle={CHART_TOOLTIP_STYLE} />
      </PieChart>
    );
  } else if (type === "line") {
    inner = (
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} width={52} />
        <Tooltip formatter={fmt} contentStyle={CHART_TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    );
  } else {
    inner = (
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} width={52} />
        <Tooltip formatter={fmt} contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--accent))" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  }

  return (
    <div className="pai2-chart-container">
      <div className="pai2-chart-title">{chart.title || "Chart"}</div>
      <ResponsiveContainer width="100%" height={250}>
        {inner}
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function PAI2Client({ user, isManager }: PAI2ClientProps) {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [selectedModel, setSelectedModel] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    chatId: string;
  } | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "default";
    confirmLabel?: string;
  } | null>(null);

  // Memory Personalization State
  const [memories, setMemories] = useState<string[]>([]);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState("");
  const [editingMemoryIdx, setEditingMemoryIdx] = useState<number | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState("");

  // Scroll-to-bottom affordance
  const [showScrollButton, setShowScrollButton] = useState(false);

  const MEMORY_MAX_LEN = 280;

  // Load provider and memories from local storage
  useEffect(() => {
    const savedProvider = localStorage.getItem("pai2-provider");
    if (savedProvider) setSelectedProvider(savedProvider);
    
    try {
      const savedMemories = localStorage.getItem("pai2-memories");
      if (savedMemories) setMemories(JSON.parse(savedMemories));
    } catch {
      // Ignore parse error
    }
  }, []);

  // Save memories to localStorage when changed
  useEffect(() => {
    localStorage.setItem("pai2-memories", JSON.stringify(memories));
  }, [memories]);

  // Helper for formatting dates
  const formatChatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Load providers ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/pai2/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) {
          setProviders(data.providers);
          const saved = localStorage.getItem("pai2-provider");
          const activeKey =
            saved && data.providers.find((p: ProviderInfo) => p.key === saved)
              ? saved
              : selectedProvider;
          if (activeKey !== selectedProvider) setSelectedProvider(activeKey);
          // Restore the last-used model for that provider, if still valid
          const prov = data.providers.find((p: ProviderInfo) => p.key === activeKey);
          const savedModel = localStorage.getItem(`pai2-model-${activeKey}`);
          if (prov && savedModel && prov.models.some((m: { id: string }) => m.id === savedModel)) {
            setSelectedModel(savedModel);
          }
        }
      })
      .catch(console.error);
  }, []);

  // ── Load conversations ──────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/pai2/conversations");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
      if (data.folders) {
        setFolders(data.folders);
        setExpandedFolders(new Set(data.folders.map((f: ChatFolder) => f.folderId)));
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages for active chat ───────────────────────────────────
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    
    setIsLoadingChat(true);

    fetch(`/api/pai2/messages?chatId=${activeChatId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
        // Restore draft if any
        if (data.conversation?.draftPrompt) {
          setInputText(data.conversation.draftPrompt);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingChat(false));
  }, [activeChatId]);

  // ── Auto-scroll to bottom (only when already near the bottom) ───────
  const isNearBottom = () => {
    const el = messagesAreaRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  };

  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // ── Track scroll position to toggle the "scroll to bottom" pill ─────
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollButton(!isNearBottom());
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeChatId, isLoadingChat]);

  // ── Close modals with Escape ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmModal?.isOpen) setConfirmModal(null);
      else if (isMemoryModalOpen) setIsMemoryModalOpen(false);
      else if (editingTitle) setEditingTitle(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmModal, isMemoryModalOpen, editingTitle]);

  // ── Auto-resize textarea ───────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [inputText]);

  // ── Close context menu on click outside ─────────────────────────────
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [contextMenu]);

  // ── Save provider to localStorage ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem("pai2-provider", selectedProvider);
  }, [selectedProvider]);

  // ── Send message ───────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isStreaming) return;

    setError(null);
    setInputText("");
    setIsStreaming(true);
    setStreamingContent("");
    // Always jump to the newest message when the user sends
    setTimeout(() => scrollToBottom("smooth"), 0);

    // Optimistically add user message
    const tempUserMsg: Message = {
      messageId: `temp-${Date.now()}`,
      chatId: activeChatId || "",
      role: "user",
      content: messageText,
      inputType: "text",
      status: "complete",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Set up cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let fullContent = "";

    try {
      const res = await fetch("/api/pai2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          chatId: activeChatId,
          message: messageText,
          provider: selectedProvider,
          model: selectedModel === "default" ? undefined : selectedModel,
          inputType: "text",
          userMemories: memories,
        }),
      });

      // Check for non-streaming error response
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setMessages((prev) => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) newMsgs[newMsgs.length - 1].status = "error";
            return newMsgs;
          });
          if (data.chatId && !activeChatId) {
            setActiveChatId(data.chatId);
          }
          setIsStreaming(false);
          return;
        }
      }

      // Process SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "meta") {
              if (data.isNewConversation || !activeChatId) {
                setActiveChatId(data.chatId);
                loadConversations();
              }
            } else if (data.type === "token") {
              fullContent += data.content;
              setStreamingContent(fullContent);
            } else if (data.type === "done") {
              // Add complete assistant message
              setMessages((prev) => [
                ...prev,
                {
                  messageId: `msg-${Date.now()}`,
                  chatId: activeChatId || "",
                  role: "assistant",
                  content: fullContent,
                  inputType: "text",
                  status: "complete",
                  createdAt: new Date().toISOString(),
                },
              ]);
              setStreamingContent("");
            } else if (data.type === "error") {
              setError(data.message);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      // User-initiated stop: keep the partial answer instead of showing an error
      if (err instanceof DOMException && err.name === "AbortError") {
        if (fullContent) {
          setMessages((prev) => [
            ...prev,
            {
              messageId: `msg-${Date.now()}`,
              chatId: activeChatId || "",
              role: "assistant",
              content: fullContent,
              inputType: "text",
              status: "complete",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setStreamingContent("");
      } else {
        setError("Failed to send message. Please try again.");
        setMessages((prev) => {
          const newMsgs = [...prev];
          if (newMsgs.length > 0) newMsgs[newMsgs.length - 1].status = "error";
          return newMsgs;
        });
        console.error(err);
      }
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      loadConversations();
    }
  };

  // ── Stop an in-progress generation ─────────────────────────────────
  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  // ── Delete specific messages from the DB (for regenerate / edit) ────
  const deleteMessagesFromDb = async (chatId: string, messageIds: string[]) => {
    if (messageIds.length === 0) return;
    await fetch("/api/pai2/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, messageIds }),
    });
  };

  // ── Regenerate the most recent assistant response ──────────────────
  const regenerateLast = async () => {
    if (!activeChatId || isStreaming) return;
    try {
      // Pull canonical messages so we work with real DB ids
      const res = await fetch(`/api/pai2/messages?chatId=${activeChatId}`);
      const data = await res.json();
      const canonical: Message[] = (data.messages || []).filter(
        (m: Message) => m.role !== "system"
      );

      // Find the last user turn — resend everything from there
      let lastUserIdx = -1;
      for (let i = canonical.length - 1; i >= 0; i--) {
        if (canonical[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx < 0) return;

      const userText = canonical[lastUserIdx].content;
      const idsToDelete = canonical.slice(lastUserIdx).map((m) => m.messageId);

      await deleteMessagesFromDb(activeChatId, idsToDelete);
      setMessages(canonical.slice(0, lastUserIdx));
      await sendMessage(userText);
    } catch {
      setError("Failed to regenerate response.");
    }
  };

  // ── Edit a user message: trim it + everything after, load into input ─
  const editUserMessage = async (index: number, content: string) => {
    if (!activeChatId || isStreaming) return;
    try {
      const res = await fetch(`/api/pai2/messages?chatId=${activeChatId}`);
      const data = await res.json();
      const canonical: Message[] = (data.messages || []).filter(
        (m: Message) => m.role !== "system"
      );

      if (index >= 0 && index < canonical.length) {
        const idsToDelete = canonical.slice(index).map((m) => m.messageId);
        await deleteMessagesFromDb(activeChatId, idsToDelete);
        setMessages(canonical.slice(0, index));
      }

      setInputText(content);
      setTimeout(() => textareaRef.current?.focus(), 10);
      loadConversations();
    } catch {
      setError("Failed to edit message.");
    }
  };

  // ── Voice recording (Web Speech API) ────────────────────────────────
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD"; // Bangla (Bangladesh) — also recognizes English
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // ── File picker ────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = "";

    // Text files → extract text directly
    if (
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".csv")
    ) {
      const text = await file.text();
      setInputText(
        (prev) => prev + (prev ? "\n" : "") + text.slice(0, 4000)
      );
      return;
    }

    // Audio files → transcribe via Groq Whisper
    if (file.type.startsWith("audio/")) {
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/pai2/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.text) {
          setInputText((prev) => prev + (prev ? "\n" : "") + data.text);
        }
      } catch {
        setError("Failed to transcribe audio file.");
      }
      return;
    }

    setError(
      "Unsupported file type. Use .txt, .csv for text, or audio files (.mp3, .wav, .webm) for speech-to-text."
    );
  };

  // ── Chat CRUD operations ───────────────────────────────────────────
  const deleteChat = (chatId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Chat",
      message: "Are you sure you want to delete this conversation? This action cannot be undone.",
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await fetch("/api/pai2/conversations", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatIds: [chatId] }),
          });
          if (activeChatId === chatId) {
            setActiveChatId(null);
            setMessages([]);
          }
          loadConversations();
        } catch {
          setError("Failed to delete chat.");
        }
      }
    });
  };

  const renameChat = async (chatId: string, title: string) => {
    try {
      await fetch("/api/pai2/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, title }),
      });
      setEditingTitle(null);
      loadConversations();
    } catch {
      setError("Failed to rename chat.");
    }
  };

  const moveChatToFolder = async (chatId: string, folderId: string | null) => {
    try {
      await fetch("/api/pai2/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, folderId }),
      });
      loadConversations();
    } catch {
      setError("Failed to move chat.");
    }
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name || isCreatingFolder) return;
    
    // Check for duplicates locally
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      setError("A folder with this name already exists.");
      return;
    }

    setIsCreatingFolder(true);
    setError(null);
    try {
      await fetch("/api/pai2/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewFolderMode(false);
      setNewFolderName("");
      loadConversations();
    } catch {
      setError("Failed to create folder.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const deleteFolder = (folderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Folder",
      message: "Are you sure you want to delete this folder? Conversations inside will be unfiled.",
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await fetch("/api/pai2/folders", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId }),
          });
          loadConversations();
        } catch {
          setError("Failed to delete folder.");
        }
      }
    });
  };

  const downloadChat = async (chatIds: string[]) => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/pai2/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatIds, formatType: "md" }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pai2-export-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export chat.");
    } finally {
      setIsDownloading(false);
    }
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInputText("");
    setError(null);
    setStreamingContent("");
    setSidebarOpen(false);
    setIsAnalyticsOpen(false);
  };

  const deleteMessageLocal = (msgId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Message",
      message: "Are you sure you want to delete this failed message?",
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        setMessages(prev => prev.filter(m => m.messageId !== msgId));
      }
    });
  };

  const retryMessage = (msg: Message) => {
    setMessages(prev => prev.filter(m => m.messageId !== msg.messageId));
    setInputText(msg.content);
    // Focus the textarea after setting text
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 10);
  };

  // ── Render helpers ─────────────────────────────────────────────────
  const currentProvider = providers.find((p) => p.key === selectedProvider);

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.folderId && folders.find(f => f.folderId === c.folderId)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const unfiledChats = filteredConversations.filter((c) => !c.folderId);
  const folderChats = (folderId: string) =>
    filteredConversations.filter((c) => c.folderId === folderId);

  // ── Suggestion prompts ─────────────────────────────────────────────
  const suggestions = [
    "Show total deposits collected this year",
    "কার জমা বাকি আছে?",
    "Compare member deposits as a chart",
    "Show active investments and returns",
    "Generate a monthly summary report",
    "সকল সদস্যদের তালিকা দেখাও",
  ];

  // ── Markdown-like rendering ────────────────────────────────────────
  const renderContent = (content: string) => {
    // Very basic markdown rendering
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = "";
    let codeType = "";
    let key = 0;

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          // End code block
          if (codeType === "chart") {
            try {
              const chartData = JSON.parse(codeContent.trim()) as ChartSpec;
              if (Array.isArray(chartData.data) && chartData.data.length > 0) {
                elements.push(<Pai2Chart key={key++} chart={chartData} />);
              } else {
                elements.push(<pre key={key++}><code>{codeContent}</code></pre>);
              }
            } catch {
              elements.push(<pre key={key++}><code>{codeContent}</code></pre>);
            }
          } else if (codeType === "download") {
            try {
              const dlData = JSON.parse(codeContent.trim());
              elements.push(
                <button
                  key={key++}
                  className="pai2-download-btn"
                  onClick={() => {
                    const csvContent = [
                      dlData.headers.join(","),
                      ...dlData.rows.map((r: string[]) => r.map((c: string) => `"${c}"`).join(",")),
                    ].join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = dlData.filename || "export.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                  Download {dlData.filename || "file"}
                </button>
              );
            } catch {
              elements.push(<pre key={key++}><code>{codeContent}</code></pre>);
            }
          } else {
            elements.push(<pre key={key++}><code>{codeContent}</code></pre>);
          }
          inCodeBlock = false;
          codeContent = "";
          codeType = "";
        } else {
          inCodeBlock = true;
          codeType = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + "\n";
        continue;
      }

      // Headers
      if (line.startsWith("### ")) {
        elements.push(<h4 key={key++} style={{ margin: "8px 0 4px", fontWeight: 600, fontSize: 14 }}>{line.slice(4)}</h4>);
      } else if (line.startsWith("## ")) {
        elements.push(<h3 key={key++} style={{ margin: "10px 0 4px", fontWeight: 600, fontSize: 15 }}>{line.slice(3)}</h3>);
      } else if (line.startsWith("# ")) {
        elements.push(<h2 key={key++} style={{ margin: "12px 0 6px", fontWeight: 700, fontSize: 16 }}>{line.slice(2)}</h2>);
      }
      // Table rows
      else if (line.startsWith("|") && line.endsWith("|")) {
        if (line.includes("---")) continue; // separator
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        elements.push(
          <div key={key++} style={{ display: "flex", gap: 1, fontSize: 13 }}>
            {cells.map((cell, i) => (
              <div key={i} style={{ flex: 1, padding: "4px 8px", background: "hsl(222 47% 14%)", borderRadius: i === 0 ? "4px 0 0 4px" : i === cells.length - 1 ? "0 4px 4px 0" : 0 }}>
                {cell}
              </div>
            ))}
          </div>
        );
      }
      // List items
      else if (line.match(/^[-*]\s/)) {
        elements.push(<div key={key++} style={{ paddingLeft: 12, position: "relative" }}><span style={{ position: "absolute", left: 0 }}>•</span> {renderInlineMarkdown(line.slice(2))}</div>);
      } else if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)/);
        if (match) {
          elements.push(<div key={key++} style={{ paddingLeft: 16, position: "relative" }}><span style={{ position: "absolute", left: 0 }}>{match[1]}.</span> {renderInlineMarkdown(match[2])}</div>);
        }
      }
      // Empty line
      else if (line.trim() === "") {
        elements.push(<div key={key++} style={{ height: 8 }} />);
      }
      // Regular text
      else {
        elements.push(<p key={key++} style={{ margin: 0 }}>{renderInlineMarkdown(line)}</p>);
      }
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Bold
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  // ── Key handler ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="pai2-container">
      {/* ── Mobile sidebar overlay ────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="pai2-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className={`pai2-sidebar ${sidebarOpen ? "open" : ""} ${isDesktopSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="pai2-sidebar-header">
          <button className="pai2-new-chat-btn" onClick={startNewChat}>
            <Plus size={16} />
            New Chat
          </button>
          <button
            className="pai2-input-btn"
            onClick={() => setNewFolderMode(true)}
            title="New Folder"
            aria-label="New folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        <div className="pai2-sidebar-content">
          {/* Search bar */}
          <div style={{ marginBottom: "12px", padding: "0 4px" }}>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "hsl(222 47% 12%)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                padding: "6px 8px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          {/* New folder input */}
          {newFolderMode && (
            <div style={{ padding: "4px 4px 8px", display: "flex", gap: 4 }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                placeholder="Folder name..."
                autoFocus
                style={{
                  flex: 1,
                  background: "hsl(222 47% 14%)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  padding: "6px 8px",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button className="pai2-input-btn" onClick={createFolder}>
                <Check size={14} />
              </button>
              <button
                className="pai2-input-btn"
                onClick={() => {
                  setNewFolderMode(false);
                  setNewFolderName("");
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Folders */}
          {folders.map((folder) => {
            const hasChats = folderChats(folder.folderId).length > 0;
            // If searching and this folder has no matches (and its name doesn't match either), skip it
            if (searchQuery && !hasChats && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return null;
            }
            return (
            <div 
              key={folder.folderId} 
              className="pai2-folder-group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const chatId = e.dataTransfer.getData("chatId");
                if (chatId) moveChatToFolder(chatId, folder.folderId);
              }}
            >
              <div
                className="pai2-folder-header"
                onClick={() => {
                  setExpandedFolders((prev) => {
                    const next = new Set(prev);
                    next.has(folder.folderId)
                      ? next.delete(folder.folderId)
                      : next.add(folder.folderId);
                    return next;
                  });
                }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    transform: expandedFolders.has(folder.folderId)
                      ? "rotate(90deg)"
                      : "none",
                    transition: "transform 0.15s",
                  }}
                />
                <Folder size={12} />
                <span style={{ flex: 1 }}>{folder.name}</span>
                <button
                  className="pai2-chat-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.folderId);
                  }}
                  title="Delete folder"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              <div className="pai2-folder-children">
                {expandedFolders.has(folder.folderId) &&
                  folderChats(folder.folderId).map((conv) =>
                    renderChatItem(conv)
                  )}
              </div>
            </div>
            );
          })}

          {/* Unfiled chats */}
          {unfiledChats.length > 0 && (
            <div 
              className="pai2-folder-group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const chatId = e.dataTransfer.getData("chatId");
                if (chatId) moveChatToFolder(chatId, null);
              }}
            >
              {folders.length > 0 && (
                <div className="pai2-folder-header">
                  <MessageSquare size={12} />
                  <span>Chats</span>
                </div>
              )}
              <div className="pai2-folder-children">
                {unfiledChats.map((conv) => renderChatItem(conv))}
              </div>
            </div>
          )}

          {conversations.length === 0 && !newFolderMode && (
            <div className="pai2-empty-sidebar">
              No conversations yet. Start chatting!
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ────────────────────────────────────────────── */}
      <main className="pai2-main">
        {isAnalyticsOpen ? (
          <PAI2AnalyticsClient />
        ) : (
          <>
            {/* Chat header */}
            <div className="pai2-chat-header">
              <div className="pai2-chat-title">
                <button
                  className="pai2-sidebar-toggle"
                  title="Toggle sidebar"
                  aria-label="Toggle sidebar"
                  onClick={() => {
                    if (window.innerWidth <= 768) {
                      setSidebarOpen(!sidebarOpen);
                    } else {
                      setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
                    }
                  }}
                >
                  <Menu size={18} />
                </button>
                <Bot size={18} style={{ color: "hsl(173 58% 50%)" }} />
                {activeChatId
                  ? conversations.find((c) => c.chatId === activeChatId)?.title ||
                    "Chat"
                  : "PAI2 পাইটু"}
              </div>
              <div className="pai2-header-actions">
                <button
                  className="pai2-icon-btn"
                  onClick={() => setIsMemoryModalOpen(true)}
                  title="Memory & Personalization"
                  aria-label="Memory and personalization"
                >
                  <BrainCircuit size={18} />
                </button>
                {isManager && (
                  <button
                    className="pai2-icon-btn"
                    onClick={() => setIsAnalyticsOpen(true)}
                    title="Analytics"
                    aria-label="Analytics"
                  >
                    <BarChart2 size={18} />
                  </button>
                )}
                {activeChatId && (
                  <button
                    className="pai2-icon-btn"
                    onClick={() => downloadChat([activeChatId])}
                    title="Download chat"
                    aria-label="Download chat"
                    disabled={isDownloading}
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                )}
              </div>
            </div>

            {/* Messages or welcome */}
        {!activeChatId && messages.length === 0 ? (
          <div className="pai2-welcome">
            <div className="pai2-welcome-icon" style={{ background: 'transparent' }}>
              <img src="/pai2-logo.png" alt="PAI2" style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }} />
            </div>
            <h2>PAI2 পাইটু</h2>
            <p>
              Your intelligent assistant for Savings & Deposit Management. Ask me
              about members, deposits, investments, reports — in English or
              বাংলা!
            </p>
            <div className="pai2-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="pai2-suggestion-btn"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pai2-messages-area" ref={messagesAreaRef}>
            {isLoadingChat ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--muted-foreground))' }}>
                <Loader2 className="animate-spin w-8 h-8" />
              </div>
            ) : (
              <>
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, idx, arr) => {
                const isLastAssistant =
                  msg.role === "assistant" && idx === arr.length - 1;
                return (
                <div
                  key={msg.messageId}
                  className={`pai2-message ${msg.role}`}
                >
                  <div className="pai2-message-avatar" style={{ background: 'transparent' }}>
                    {msg.role === "assistant" ? (
                      <img src="/pai2-logo.png" alt="PAI2" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : user.picture ? (
                      <img src={user.picture} alt="User" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="pai2-message-bubble">
                      {msg.role === "assistant"
                        ? renderContent(msg.content)
                        : msg.content}
                    </div>
                    {msg.status === "error" && (
                      <div className="pai2-error-inline">
                        <AlertCircle size={12} /> Message failed to send
                        <button onClick={() => retryMessage(msg)} className="pai2-retry-inline">
                          <RefreshCw size={12} /> Retry
                        </button>
                      </div>
                    )}
                    <div className="pai2-message-meta">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.status === "error" && (
                        <>
                          <button
                            className="pai2-chat-action-btn"
                            onClick={() => deleteMessageLocal(msg.messageId)}
                            title="Delete Message"
                            style={{ color: "hsl(0 72% 50%)" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                      {msg.role === "assistant" && (
                        <button
                          className="pai2-chat-action-btn"
                          onClick={() =>
                            copyMessage(msg.messageId, msg.content)
                          }
                          title="Copy"
                          aria-label="Copy message"
                        >
                          {copiedId === msg.messageId ? (
                            <Check size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                      {isLastAssistant && !isStreaming && activeChatId && (
                        <button
                          className="pai2-chat-action-btn"
                          onClick={regenerateLast}
                          title="Regenerate response"
                          aria-label="Regenerate response"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      {msg.role === "user" &&
                        msg.status !== "error" &&
                        !isStreaming &&
                        activeChatId && (
                          <button
                            className="pai2-chat-action-btn"
                            onClick={() => editUserMessage(idx, msg.content)}
                            title="Edit & resend"
                            aria-label="Edit and resend message"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
                );
              })}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="pai2-message assistant">
                <div className="pai2-message-avatar" style={{ background: 'transparent' }}>
                  <img src="/pai2-logo.png" alt="PAI2" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <div>
                  <div className="pai2-message-bubble">
                    {renderContent(streamingContent)}
                    <span className="pai2-caret" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming && !streamingContent && (
              <div className="pai2-message assistant">
                <div className="pai2-message-avatar" style={{ background: 'transparent' }}>
                  <img src="/pai2-logo.png" alt="PAI2" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <div className="pai2-message-bubble">
                  <div className="pai2-typing">
                    <span className="pai2-typing-label">PAI2 is thinking</span>
                    <div className="pai2-typing-dot" />
                    <div className="pai2-typing-dot" />
                    <div className="pai2-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="pai2-error">
            <AlertCircle size={16} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              className="pai2-error-retry"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="pai2-input-area">
          {showScrollButton && activeChatId && (
            <button
              className="pai2-scroll-bottom"
              onClick={() => scrollToBottom("smooth")}
              title="Scroll to latest"
              aria-label="Scroll to latest message"
            >
              <ArrowDown size={18} />
            </button>
          )}
          <div className="pai2-input-container">
            <button
              className="pai2-input-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file (.txt, .csv, .mp3, .wav)"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.mp3,.wav,.webm,.ogg,.m4a,.flac"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <textarea
              ref={textareaRef}
              className="pai2-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message PAI2... (Shift+Enter for new line)"
              rows={1}
              disabled={isStreaming}
            />

            <button
              className={`pai2-input-btn ${isRecording ? "recording" : ""}`}
              onClick={toggleRecording}
              title={isRecording ? "Stop recording" : "Voice input"}
              aria-label={isRecording ? "Stop voice recording" : "Start voice input"}
              disabled={isStreaming}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {isStreaming ? (
              <button
                className="pai2-input-btn stop"
                onClick={stopGeneration}
                title="Stop generating"
                aria-label="Stop generating"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                className="pai2-input-btn send"
                onClick={() => sendMessage()}
                disabled={!inputText.trim()}
                title="Send message"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>

          {/* Provider selector */}
          <div className="pai2-provider-bar">
            <span>Provider:</span>
            <select
              className="pai2-provider-select"
              value={selectedProvider}
              onChange={(e) => {
                const key = e.target.value;
                setSelectedProvider(key);
                const prov = providers.find((p) => p.key === key);
                const savedModel = localStorage.getItem(`pai2-model-${key}`);
                if (prov) {
                  setSelectedModel(
                    savedModel && prov.models.some((m) => m.id === savedModel)
                      ? savedModel
                      : prov.defaultModel
                  );
                }
              }}
            >
              {providers.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            {currentProvider && currentProvider.models.length > 1 && (
              <>
                <span>Model:</span>
                <select
                  className="pai2-provider-select"
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    localStorage.setItem(`pai2-model-${selectedProvider}`, e.target.value);
                  }}
                >
                  {currentProvider.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* ── Context menu ──────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="pai2-context-menu"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 190),
            top: Math.min(contextMenu.y, window.innerHeight - 230),
          }}
        >
          <button
            onClick={() => {
              const conv = conversations.find(
                (c) => c.chatId === contextMenu.chatId
              );
              if (conv) {
                setEditingTitle(conv.chatId);
                setEditTitleValue(conv.title);
              }
              setContextMenu(null);
            }}
          >
            <Pencil size={14} />
            Rename
          </button>
          {folders.length > 0 && (
            <div className="pai2-context-item-has-submenu">
              <button onClick={(e) => e.preventDefault()}>
                <Folder size={14} />
                Move to Collection <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              </button>
              <div className="pai2-context-submenu">
                {folders.map((f) => (
                  <button
                    key={f.folderId}
                    onClick={() => {
                      moveChatToFolder(contextMenu.chatId, f.folderId);
                      setContextMenu(null);
                    }}
                  >
                    <Folder size={14} />
                    {f.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    moveChatToFolder(contextMenu.chatId, null);
                    setContextMenu(null);
                  }}
                >
                  <MessageSquare size={14} />
                  Remove from collection
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              downloadChat([contextMenu.chatId]);
              setContextMenu(null);
            }}
          >
            <Download size={14} />
            Download
          </button>
          <button
            className="danger"
            onClick={() => {
              deleteChat(contextMenu.chatId);
              setContextMenu(null);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* ── Inline rename modal ───────────────────────────────────────── */}
      {editingTitle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "hsl(0 0% 0% / 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setEditingTitle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "hsl(222 47% 12%)",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              padding: 20,
              width: 320,
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 600,
                color: "hsl(var(--foreground))",
              }}
            >
              Rename Chat
            </h3>
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingTitle)
                  renameChat(editingTitle, editTitleValue);
              }}
              autoFocus
              style={{
                width: "100%",
                background: "hsl(222 47% 16%)",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "8px 12px",
                color: "hsl(var(--foreground))",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                className="pai2-input-btn"
                onClick={() => setEditingTitle(null)}
                style={{ width: "auto", padding: "6px 14px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                className="pai2-input-btn send"
                onClick={() =>
                  editingTitle && renameChat(editingTitle, editTitleValue)
                }
                style={{ width: "auto", padding: "6px 14px", fontSize: 13 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div
          className="pai2-modal-overlay"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="pai2-modal-content"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="pai2-confirm-header">
              <div
                className={`pai2-confirm-icon ${
                  confirmModal.variant === "default" ? "default" : "danger"
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <h3>{confirmModal.title}</h3>
            </div>
            <p style={{ marginTop: 14, marginBottom: 0, color: "hsl(var(--muted-foreground))" }}>
              {confirmModal.message}
            </p>
            <div className="pai2-modal-actions">
              <button
                className="pai2-btn pai2-btn-secondary"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className={`pai2-btn ${
                  confirmModal.variant === "default"
                    ? "pai2-btn-primary"
                    : "pai2-btn-danger"
                }`}
                autoFocus
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                {confirmModal.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Personalization Modal */}
      {isMemoryModalOpen && (
        <div
          className="pai2-modal-overlay"
          onClick={() => {
            setIsMemoryModalOpen(false);
            setEditingMemoryIdx(null);
          }}
        >
          <div
            className="pai2-modal-content pai2-memory-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={20} style={{ color: 'hsl(173 58% 55%)' }} />
                <h3 style={{ margin: 0 }}>Memory &amp; Context</h3>
                {memories.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'hsl(173 58% 39% / 0.18)',
                      color: 'hsl(173 58% 60%)',
                    }}
                  >
                    {memories.length}
                  </span>
                )}
              </div>
              <button
                className="pai2-icon-btn"
                onClick={() => setIsMemoryModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="pai2-memory-hint" style={{ marginTop: 8, marginBottom: 16 }}>
              PAI2 remembers these details and preferences across all your chats.
              They&apos;re stored only on this device.
            </p>

            <div className="pai2-memory-add-row">
              <input
                type="text"
                className="pai2-input"
                placeholder="E.g., Always respond in a professional tone"
                value={newMemoryText}
                maxLength={MEMORY_MAX_LEN}
                onChange={(e) => setNewMemoryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMemoryText.trim()) {
                    setMemories((prev) => [...prev, newMemoryText.trim()]);
                    setNewMemoryText("");
                  }
                }}
              />
              <button
                className="pai2-btn pai2-btn-primary"
                onClick={() => {
                  if (newMemoryText.trim()) {
                    setMemories((prev) => [...prev, newMemoryText.trim()]);
                    setNewMemoryText("");
                  }
                }}
                disabled={!newMemoryText.trim()}
              >
                <Plus size={15} /> Add
              </button>
            </div>
            <div className="pai2-memory-hint" style={{ marginBottom: 16, textAlign: 'right' }}>
              {newMemoryText.length}/{MEMORY_MAX_LEN}
            </div>

            <div className="pai2-memory-list">
              {memories.length === 0 ? (
                <div className="pai2-memory-empty">
                  <BrainCircuit size={28} style={{ opacity: 0.4 }} />
                  <span>No memories yet. Add something PAI2 should remember.</span>
                </div>
              ) : (
                memories.map((mem, idx) => (
                  <div key={idx} className="pai2-memory-item">
                    {editingMemoryIdx === idx ? (
                      <>
                        <input
                          type="text"
                          className="pai2-input"
                          value={editingMemoryText}
                          maxLength={MEMORY_MAX_LEN}
                          autoFocus
                          onChange={(e) => setEditingMemoryText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingMemoryText.trim()) {
                              setMemories((prev) =>
                                prev.map((m, i) =>
                                  i === idx ? editingMemoryText.trim() : m
                                )
                              );
                              setEditingMemoryIdx(null);
                            } else if (e.key === "Escape") {
                              setEditingMemoryIdx(null);
                            }
                          }}
                        />
                        <div className="pai2-memory-item-actions">
                          <button
                            className="pai2-icon-btn"
                            title="Save"
                            aria-label="Save memory"
                            onClick={() => {
                              if (editingMemoryText.trim()) {
                                setMemories((prev) =>
                                  prev.map((m, i) =>
                                    i === idx ? editingMemoryText.trim() : m
                                  )
                                );
                              }
                              setEditingMemoryIdx(null);
                            }}
                          >
                            <Check size={16} style={{ color: 'hsl(173 58% 55%)' }} />
                          </button>
                          <button
                            className="pai2-icon-btn"
                            title="Cancel"
                            aria-label="Cancel edit"
                            onClick={() => setEditingMemoryIdx(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="pai2-memory-item-text">{mem}</span>
                        <div className="pai2-memory-item-actions">
                          <button
                            className="pai2-icon-btn"
                            title="Edit"
                            aria-label="Edit memory"
                            onClick={() => {
                              setEditingMemoryIdx(idx);
                              setEditingMemoryText(mem);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="pai2-icon-btn"
                            title="Delete memory"
                            aria-label="Delete memory"
                            onClick={() =>
                              setMemories((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 size={15} style={{ color: 'hsl(0 72% 55%)' }} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {memories.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
                <button
                  className="pai2-btn pai2-btn-secondary"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Clear All Memory",
                      message: "Are you sure you want to clear all personalized memories? This action cannot be undone.",
                      variant: "danger",
                      confirmLabel: "Clear All",
                      onConfirm: () => setMemories([]),
                    });
                  }}
                >
                  <Trash2 size={15} /> Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── Helper: render a chat item in sidebar ──────────────────────────
  function renderChatItem(conv: Conversation) {
    return (
      <div
        key={conv.chatId}
        className={`pai2-chat-item ${activeChatId === conv.chatId ? "active" : ""}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("chatId", conv.chatId);
        }}
        onClick={() => {
          setActiveChatId(conv.chatId);
          setIsAnalyticsOpen(false);
          setSidebarOpen(false);
          setError(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, chatId: conv.chatId });
        }}
      >
        <MessageSquare size={14} />
        <span className="pai2-chat-item-title">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {conv.title}
          </span>
          {conv.draftPrompt ? (
            <span className="pai2-draft-badge">Draft</span>
          ) : (
            <span className="pai2-chat-item-date">{formatChatDate(conv.createdAt)}</span>
          )}
        </span>
        <div className="pai2-chat-item-actions">
          <button
            className="pai2-chat-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                chatId: conv.chatId,
              });
            }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
    );
  }
}
