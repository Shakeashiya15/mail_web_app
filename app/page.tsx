"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Star,
  Trash2,
  Settings,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

type Email = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
};

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");
const [aiQuestion, setAiQuestion] = useState("");
const [aiAnswer, setAiAnswer] = useState("");
const [aiLoading, setAiLoading] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/gmail/inbox");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      setEmails(data.emails || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };
  const searchEmails = async () => {
  if (!search.trim()) {
    fetchEmails();
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      `/api/gmail/search?q=${encodeURIComponent(search)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Search failed");
    }

    setEmails(data.emails || []);
  } catch (error) {
    console.error(error);
    setError("Failed to search emails");
  } finally {
    setLoading(false);
  }
}
const askAI = async () => {
  if (!aiQuestion.trim()) return;

  try {
    setAiLoading(true);
    setAiAnswer("");

    const question = aiQuestion.toLowerCase();

    // AI/UI navigation commands
    if (
      question.includes("go to sent") ||
      question.includes("open sent") ||
      question === "sent"
    ) {
      window.location.href = "/sent";
      return;
    }

    if (
      question.includes("compose") ||
      question.includes("write an email") ||
      question.includes("send an email")
    ) {
      window.location.href = "/compose";
      return;
    }

    if (
      question.includes("go to inbox") ||
      question.includes("open inbox") ||
      question === "inbox"
    ) {
      await fetchEmails();
      setAiAnswer("Opened your Inbox.");
      return;
    }

    // Ask AI to detect search vs normal question
    const actionResponse = await fetch("/api/ai/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: aiQuestion,
      }),
    });

    const actionData = await actionResponse.json();

    if (!actionResponse.ok) {
      throw new Error(actionData.error || "AI action failed");
    }

    // AI detected email search
    if (actionData.action === "search" && actionData.query) {
      const searchResponse = await fetch(
        `/api/gmail/search?q=${encodeURIComponent(actionData.query)}`
      );

      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error(searchData.error || "Gmail search failed");
      }

      setEmails(searchData.emails || []);

      setAiAnswer(
        `I found ${searchData.emails?.length || 0} email(s) for "${actionData.query}".`
      );

      return;
    }

    // Normal AI question
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: aiQuestion,
        emails,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }

    setAiAnswer(data.answer);
  } catch (error) {
    console.error("AI error:", error);

    setAiAnswer(
      error instanceof Error
        ? error.message
        : "Sorry, I couldn't process your request."
    );
  } finally {
    setAiLoading(false);
  }
};
  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="flex h-screen bg-white text-gray-900">

      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-gray-50 p-4">

        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
            <Mail size={20} />
          </div>
          <h1 className="text-xl font-semibold">Mail Assistant</h1>
        </div>

        <a
          href="/compose"
          className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Compose
        </a>

        <nav className="space-y-1">

          <button className="flex w-full items-center gap-3 rounded-lg bg-gray-200 px-3 py-2.5 text-sm font-medium">
            <Mail size={18} />
            Inbox
            <span className="ml-auto text-xs">
              {emails.length}
            </span>
          </button>

          <button
  onClick={() => {
    window.location.href = "/sent";
  }}
  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200"
>
  <Send size={18} />
  Sent
</button>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200">
            <Star size={18} />
            Starred
          </button>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200">
            <Trash2 size={18} />
            Trash
          </button>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200">
            <Settings size={18} />
            Settings
          </button>

        </nav>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">

        {/* Top bar */}
        <header className="flex h-16 items-center border-b px-6">

          <div className="flex w-full max-w-2xl items-center gap-3 rounded-lg bg-gray-100 px-4 py-2">
            <Search size={18} className="text-gray-500" />

            <input
                type="text"
                  placeholder="Search mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                 if (e.key === "Enter") {
                searchEmails();
                }
                 }}
                 className="w-full bg-transparent text-sm outline-none"
                />
          </div>

        </header>

        {/* Inbox header */}
        <div className="flex items-center justify-between border-b px-6 py-4">

          <div>
            <h2 className="text-lg font-semibold">Inbox</h2>
            <p className="text-sm text-gray-500">
              {emails.length} emails
            </p>
          </div>

          <button
            onClick={fetchEmails}
            className="rounded-lg p-2 hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>

        </div>

        {/* Emails */}
        <div className="flex-1 overflow-y-auto">

          {loading && (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading emails...
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && emails.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">

              <Mail size={45} className="mb-4 text-gray-300" />

              <h3 className="text-lg font-medium">
                No emails yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your Gmail inbox is empty.
              </p>

            </div>
          )}

          {!loading &&
            !error &&
            emails.map((email) => (
             <div
  key={email.id}
  onClick={() => {
    window.location.href = `/email/${email.id}`;
  }}
  className="flex cursor-pointer items-center gap-4 border-b px-6 py-4 hover:bg-gray-50"
>

                <Star
                  size={18}
                  className="text-gray-300"
                />

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between">

                    <p className="truncate text-sm font-medium">
                      {email.from}
                    </p>

                    <span className="ml-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(email.date).toLocaleDateString()}
                    </span>

                  </div>

                  <p className="mt-1 truncate text-sm font-medium">
                    {email.subject || "(No subject)"}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-500">
                    {email.snippet}
                  </p>

                </div>

              </div>
            ))}
        </div>

        {/* AI Assistant */}
       <div className="border-t bg-white p-4">

  {aiAnswer && (
    <div className="mb-3 rounded-xl border bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={18} />
        <span className="text-sm font-semibold">
  AI Assistant
</span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {aiAnswer}
      </p>
    </div>
  )}

  <div className="flex items-center gap-3 rounded-xl border bg-gray-50 px-4 py-3">

    <Sparkles size={20} />

    <input
      value={aiQuestion}
      onChange={(e) => setAiQuestion(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          askAI();
        }
      }}
      placeholder="Ask AI about your emails..."
      className="flex-1 bg-transparent text-sm outline-none"
    />

    <button
      onClick={askAI}
      disabled={aiLoading}
      className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {aiLoading ? "Thinking..." : "Ask"}
    </button>

  </div>

</div>

      </main>

    </div>
  );
}