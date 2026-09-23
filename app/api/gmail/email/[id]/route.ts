import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const response = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find(
        (header) =>
          header.name?.toLowerCase() === name.toLowerCase()
      )?.value || "";

    let body = "";

    const payload = message.payload;

    if (payload?.body?.data) {
      body = Buffer.from(
        payload.body.data,
        "base64url"
      ).toString("utf-8");
    }

    if (!body && payload?.parts) {
      const textPart = payload.parts.find(
        (part) => part.mimeType === "text/plain"
      );

      const htmlPart = payload.parts.find(
        (part) => part.mimeType === "text/html"
      );

      const part = textPart || htmlPart;

      if (part?.body?.data) {
        body = Buffer.from(
          part.body.data,
          "base64url"
        ).toString("utf-8");
      }
    }

    return NextResponse.json({
      success: true,
      email: {
        id: message.id,
        threadId: message.threadId,
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        body,
      },
    });

  } catch (error) {
    console.error("Gmail email error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch email",
      },
      { status: 500 }
    );
  }
}