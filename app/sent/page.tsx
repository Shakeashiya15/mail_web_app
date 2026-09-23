"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";

type Email = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
};

export default function SentPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSentEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/gmail/sent");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sent emails");
      }

      setEmails(data.emails || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load sent emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentEmails();
  }, []);

  return (
    <div className="flex h-screen bg-white text-gray-900">
      
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-gray-50 p-4">
        
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
            <Mail size={20} />
          </div>

          <h1 className="text-xl font-semibold">
  Mail Assistant
</h1>
        </div>

        <a
          href="/"
          className="mb-5 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back to Inbox
        </a>

        <div className="rounded-lg bg-gray-200 px-3 py-2.5 text-sm font-medium">
          Sent
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Sent
            </h2>

            <p className="text-sm text-gray-500">
              {emails.length} sent emails
            </p>
          </div>

          <button
            onClick={fetchSentEmails}
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
              Loading sent emails...
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
                No sent emails
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                You haven't sent any emails yet.
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
                <Mail
                  size={18}
                  className="text-gray-400"
                />

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">
                      To: {email.to}
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

      </main>
    </div>
  );
}