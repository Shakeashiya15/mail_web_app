"use client";

import { useState } from "react";
import { ArrowLeft, Send, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!to || !subject || !message) {
      setStatus("Please fill all fields.");
      return;
    }

    try {
      setSending(true);
      setStatus("");

      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStatus("Email sent successfully!");

      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch (error) {
      console.error(error);
      setStatus("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">

      <header className="flex h-16 items-center gap-4 border-b bg-white px-6">

        <button
          onClick={() => router.push("/")}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Mail size={20} />
          <span className="font-semibold">
            Compose Email
          </span>
        </div>

      </header>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl border bg-white shadow-sm">

        <div className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold">
            New Message
          </h1>
        </div>

        <div className="space-y-4 p-6">

          <input
            type="email"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
            className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          {status && (
            <p className="text-sm text-gray-600">
              {status}
            </p>
          )}

          <div className="flex justify-end">

            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Send size={17} />
              {sending ? "Sending..." : "Send"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}