import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function getGmailClient() {
  const result = await pool.query(
    `SELECT * FROM google_tokens ORDER BY updated_at DESC LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new Error("Gmail account not connected");
  }

  const token = result.rows[0];

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: Number(token.expiry_date),
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}

// GET - Fetch sent emails
export async function GET() {
  try {
    const gmail = await getGmailClient();

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
      labelIds: ["SENT"],
    });

    const messages = response.data.messages || [];

    const emails = await Promise.all(
      messages.map(async (message) => {
        if (!message.id) return null;

        const emailResponse = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });

        const headers = emailResponse.data.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find(
            (header) =>
              header.name?.toLowerCase() === name.toLowerCase()
          )?.value || "";

        return {
          id: message.id,
          threadId: message.threadId,
          from: getHeader("From"),
          to: getHeader("To"),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          snippet: emailResponse.data.snippet || "",
        };
      })
    );

    return NextResponse.json({
      success: true,
      emails: emails.filter(Boolean),
    });
  } catch (error) {
    console.error("Gmail sent error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch sent emails",
      },
      { status: 500 }
    );
  }
}

// POST - Send an email
export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "To, subject and message are required" },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient();

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      message,
    ].join("\r\n");

    const encodedMessage = Buffer.from(email).toString("base64url");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error("Gmail send error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send email",
      },
      { status: 500 }
    );
  }
}