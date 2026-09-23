import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: NextRequest) {
  try {
    const { question, emails } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    const emailContext = (emails || [])
      .map(
        (email: {
          from?: string;
          to?: string;
          subject?: string;
          date?: string;
          snippet?: string;
          body?: string;
        }) => `
EMAIL
From: ${email.from || ""}
To: ${email.to || ""}
Subject: ${email.subject || ""}
Date: ${email.date || ""}

Email Content:
${email.body || email.snippet || ""}
`
      )
      .join("\n----------------------\n");

    const prompt = `
You are an AI email assistant.

Answer the user's question ONLY using the email information provided below.

IMPORTANT:
- Read the email content carefully.
- You CAN answer questions about the emails.
- You CAN summarize emails.
- You CAN identify what happened in an email.
- Never say "I cannot provide information" if the answer exists in the email.
- Never invent information.
- If the answer is not present in the emails, say:
  "I couldn't find that information in the provided emails."
- Give a short, direct answer.

USER QUESTION:
${question}

EMAIL DATA:
${emailContext}

ANSWER:
`;

    const response = await ollama.chat({
      model: "llama3.2:1b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      answer: response.message.content.trim(),
    });
  } catch (error: any) {
    console.error("Ollama AI error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get AI response",
      },
      { status: 500 }
    );
  }
}