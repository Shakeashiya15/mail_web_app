import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI assistant for a Gmail application.

Determine whether the user wants to SEARCH their emails.

Return ONLY valid JSON.

If the user wants to search emails, return:
{
  "action": "search",
  "query": "Gmail search query"
}

If the user is asking a normal question about emails, return:
{
  "action": "answer",
  "query": ""
}

Examples:

User: Find emails about security
Output:
{"action":"search","query":"security"}

User: Show emails from Google
Output:
{"action":"search","query":"from:google"}

User: Search for Windows emails
Output:
{"action":"search","query":"Windows"}

User: Find emails with subject Security Alert
Output:
{"action":"search","query":"subject:Security Alert"}

User: What happened in the security alert?
Output:
{"action":"answer","query":""}

User: Summarize my emails
Output:
{"action":"answer","query":""}

User question:
${question}

Return ONLY JSON.
`;

    const response = await ollama.chat({
      model: "llama3.2:1b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      format: "json",
    });

    const result = JSON.parse(response.message.content);

    return NextResponse.json({
      success: true,
      action: result.action,
      query: result.query || "",
    });
  } catch (error: any) {
    console.error("AI action error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process AI action",
      },
      { status: 500 }
    );
  }
}