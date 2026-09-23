"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type Email = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
};

export default function EmailPage() {
  const params = useParams();
  const router = useRouter();

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch(
          `/api/gmail/email/${params.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch email");
        }

        setEmail(data.email);
      } catch (error) {
        console.error(error);
        setError("Failed to load email");
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" size={24} />
        <span className="ml-2 text-sm text-gray-500">
          Loading email...
        </span>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-red-500">
          {error || "Email not found"}
        </p>

        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="flex h-16 items-center border-b px-6">

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back to Inbox
        </button>

        <div className="ml-4 flex items-center gap-2">
          <Mail size={20} />
          <span className="font-semibold">
  Mail Assistant
</span>
        </div>

      </header>

      {/* Email */}
      <main className="mx-auto max-w-4xl px-6 py-8">

        <h1 className="text-2xl font-semibold">
          {email.subject || "(No subject)"}
        </h1>

        <div className="mt-6 flex items-start justify-between border-b pb-5">

          <div>
            <p className="text-sm font-medium">
              {email.from}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              To: {email.to}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            {new Date(email.date).toLocaleString()}
          </p>

        </div>

        {/* Body */}
        <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-800">
          {email.body}
        </div>

      </main>

    </div>
  );
}