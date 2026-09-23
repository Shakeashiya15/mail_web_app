import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code not found" },
      { status: 400 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get Gmail account information
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const profile = await gmail.users.getProfile({
      userId: "me",
    });

    const email = profile.data.emailAddress;

    if (!email || !tokens.access_token) {
      return NextResponse.json(
        { error: "Google account information not received" },
        { status: 400 }
      );
    }

    // Save tokens in PostgreSQL
    await pool.query(
      `
      INSERT INTO google_tokens
        (email, access_token, refresh_token, expiry_date, updated_at)
      VALUES
        ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (email)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(
          EXCLUDED.refresh_token,
          google_tokens.refresh_token
        ),
        expiry_date = EXCLUDED.expiry_date,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        email,
        tokens.access_token,
        tokens.refresh_token ?? null,
        tokens.expiry_date ?? null,
      ]
    );

    console.log(`Gmail tokens saved for ${email}`);

    return NextResponse.redirect(new URL("/", request.url));

  } catch (error) {
    console.error("OAuth error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to authenticate with Google",
      },
      { status: 500 }
    );
  }
}