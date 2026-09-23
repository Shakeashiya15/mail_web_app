import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");

    if (!query) {
      return NextResponse.json({
        success: true,
        emails: [],
      });
    }

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

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 20,
    });

    const messages = response.data.messages || [];

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
    console.error("Gmail search error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search Gmail",
      },
      { status: 500 }
    );
  }
}