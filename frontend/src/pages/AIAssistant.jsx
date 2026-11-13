
import { useEffect, useState } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  Database,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  askChatQuestion,
  getChatSession,
} from "../services/api";

const suggestions = [
  "How many products are in this dataset?",
  "What is the average product price?",
  "Show me the top 5 products by stock",
  "Give me a category breakdown",
  "What is the total inventory stock?",
];

// Safely convert any response into text React can render.
function getDisplayText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (content === null || content === undefined) {
    return "";
  }

  if (typeof content === "object") {
    if (typeof content.answer === "string") {
      return content.answer;
    }

    if (typeof content.message === "string") {
      return content.message;
    }

    if (content.success === true) {
      return "Your query was executed successfully.";
    }

    return JSON.stringify(content, null, 2);
  }

  return String(content);
}

// Normalize API and saved-session messages.
function normalizeMessage(message) {
  const content = message?.content;

  if (message?.role === "assistant" && content && typeof content === "object") {
    return {
      ...message,
      content: getDisplayText(content),
      plan: message.plan || content.plan,
      result: message.result ?? content.result,
      evidence: message.evidence || content.evidence,
    };
  }

  return {
    ...message,
    content: getDisplayText(content),
  };
}

export default function AIAssistant() {
  const [dataset, setDataset] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedDataset = localStorage.getItem("retailiq_dataset");
      const savedSession = localStorage.getItem("retailiq_chat_session");

      if (savedDataset) {
        setDataset(JSON.parse(savedDataset));
      }

      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setSessionId(parsedSession.sessionId);

        if (parsedSession.sessionId) {
          loadSession(parsedSession.sessionId);
        }
      }
    } catch {
      setError("Could not load saved workspace information.");
    }
  }, []);

  const loadSession = async (id) => {
    try {
      const response = await getChatSession(id);

      const safeMessages = (response.messages || []).map(
        normalizeMessage
      );

      setMessages(safeMessages);
    } catch {
      localStorage.removeItem("retailiq_chat_session");
      setSessionId(null);
    }
  };

  const handleAsk = async (text = question) => {
    const trimmedQuestion = text.trim();

    if (!trimmedQuestion || !dataset?.dataset_id || loading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await askChatQuestion(
        dataset.dataset_id,
        trimmedQuestion,
        sessionId,
        "cleaned"
      );

      if (response.session_id) {
        setSessionId(response.session_id);

        localStorage.setItem(
          "retailiq_chat_session",
          JSON.stringify({
            sessionId: response.session_id,
          })
        );
      }

      // Support both flat and nested API response structures.
      const data =
        response.answer && typeof response.answer === "object"
          ? response.answer
          : response;

      const assistantMessage = normalizeMessage({
        role: "assistant",
        content:
          typeof data.answer === "string"
            ? data.answer
            : typeof response.answer === "string"
              ? response.answer
              : "Your query was executed successfully.",
        plan: data.plan || response.plan,
        result: data.result ?? response.result,
        evidence: data.evidence || response.evidence,
      });

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail;

      const errorMessage =
        typeof detail === "string"
          ? detail
          : detail?.message || "Unable to process your question.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setError("");

    localStorage.removeItem("retailiq_chat_session");
  };

  if (!dataset) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <Database
          size={36}
          className="mx-auto text-slate-400"
        />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          No dataset found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Upload a CSV dataset before asking questions.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            CONVERSATIONAL INTELLIGENCE
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            AI Retail Assistant
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ask questions about your retail dataset and inspect the execution evidence.
          </p>
        </div>

        <button
          onClick={startNewChat}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          New conversation
        </button>
      </div>

      {/* Connected dataset */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Database size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {dataset.filename || "Retail dataset"}
          </p>

          <p className="break-all text-xs text-slate-400">
            Dataset ID: {dataset.dataset_id}
          </p>
        </div>

        <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Connected
        </span>
      </div>

      {/* Chat window */}
      <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <Bot size={21} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Retail Intelligence
            </h2>

            <p className="text-xs text-slate-400">
              Structured query assistant
            </p>
          </div>

          <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ready
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5">

          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Sparkles size={27} />
              </div>

              <h3 className="mt-4 font-bold text-slate-800">
                What would you like to know?
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Ask about product counts, prices, inventory and category performance.
              </p>

              <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAsk(suggestion)}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={`flex gap-3 ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {message.role !== "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Bot size={19} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold opacity-70">
                  {message.role === "user" ? (
                    <User size={14} />
                  ) : (
                    <Bot size={14} />
                  )}

                  {message.role === "user"
                    ? "You"
                    : "Retail Assistant"}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {getDisplayText(message.content)}
                </p>

                {message.plan && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <FileText size={14} />
                      Execution plan
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      Operation: {message.plan.operation}
                    </p>

                    {message.result !== undefined && (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">
                        {JSON.stringify(message.result, null, 2)}
                      </pre>
                    )}

                    {message.evidence && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-indigo-600">
                          View execution evidence
                        </summary>

                        <pre className="mt-2 max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                          {JSON.stringify(message.evidence, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={19}
                className="animate-spin text-indigo-600"
              />
              Analysing your question...
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />
            {error}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAsk();
          }}
          className="flex gap-3 border-t border-slate-100 bg-white p-4"
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask something about your retail data..."
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={17} />
            <span className="hidden sm:inline">
              Send
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
