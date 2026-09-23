import { google } from "googleapis";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // Get the saved Gmail account
    const result = await pool.query(
      `SELECT * FROM google_tokens ORDER BY updated_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Gmail account not connected" },
        { status: 401 }
      );
    }

    const token = result.rows[0];

    // Create Google OAuth client
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

    // Gmail API
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    // Get inbox messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
      labelIds: ["INBOX"],
    });

    const messages = response.data.messages || [];

    // Get details of each email
    const emails = await Promise.all(
      messages.map(async (message) => {
        if (!message.id) return null;

        const emailResponse = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers =
          emailResponse.data.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find(
            (header) =>
              header.name?.toLowerCase() === name.toLowerCase()
          )?.value || "";

        return {
          id: message.id,
          threadId: message.threadId,
          from: getHeader("From"),
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
    console.error("Gmail inbox error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Gmail inbox",
      },
      { status: 500 }
    );
  }
}