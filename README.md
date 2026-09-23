Mail Assistant
An AI-powered Gmail web application that provides a modern email interface with real Gmail integration and natural-language AI assistance.

Overview
Mail Assistant is a full-stack email application built with Next.js and the Gmail API.

Users can:
•	Connect their Gmail account using Google OAuth
•	View real Gmail inbox emails
•	Open individual emails
•	Search emails
•	Compose and send emails
•	View sent emails
•	Ask questions about their emails using an AI assistant
•	Use natural-language commands for selected email actions

The AI assistant uses a local LLM through Ollama, allowing the application to perform AI operations without requiring a paid external AI API.

Features

Google OAuth Authentication
•	Connects the application to a Gmail account using Google OAuth 2.0.
•	Uses Gmail API authentication instead of storing Gmail passwords.

Gmail Inbox
•	Retrieves real emails from Gmail.
•	Displays sender, subject, date, and email snippet.

Email Details
•	Opens individual Gmail messages.
•	Displays sender, recipient, subject, date, and email content.

Email Search
•	Searches emails using Gmail search queries.
•	Supports natural-language search through the AI assistant.

Compose Email
•	Provides an email composition interface.
•	Supports recipient, subject, and message content.

Send Email
•	Sends emails directly through the Gmail API.

Sent Mail
•	Retrieves and displays emails from the Gmail Sent folder.

AI Email Assistant
•	Answers questions using the available email context.
•	Summarizes email information.
•	Identifies information from emails.
•	Uses natural-language requests.

AI UI Actions
The assistant supports selected navigation and search actions, including:
•	Go to Inbox
•	Go to Sent
•	Compose an email
•	Search emails using natural-language requests

PostgreSQL
•	Stores Gmail OAuth token information required for Gmail API access.

Local AI
•	Uses Ollama for local AI processing.
•	Uses the Llama 3.2 1B model.
•	Does not require a paid AI API for the assistant.

Tech Stack

Frontend

•	Next.js 16
•	React
•	TypeScript
•	Tailwind CSS
•	Lucide React

Backend
•	Next.js App Router API Routes
•	Gmail API
•	Google OAuth 2.0
•	PostgreSQL

AI
•	Ollama
•	Llama 3.2 1B

Development Tools
•	Node.js
•	npm
•	Git
•	GitHub

Application Architecture
                    ┌─────────────────────┐
                    │    Mail Assistant   │
                    │    Next.js Client   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Gmail API Routes    AI API Routes    UI Pages
              │                │                │
              ▼                ▼                ▼
        Gmail Account        Ollama          React
              │                │
              │                ▼
              │            Local LLM
              │
              ▼
          PostgreSQL
       OAuth Token Storage

Project Structure

mail_web_app/
│
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── action/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   │
│   │   ├── auth/
│   │   │   └── google/
│   │   │       ├── callback/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   │
│   │   └── gmail/
│   │       ├── email/[id]/
│   │       │   └── route.ts
│   │       ├── inbox/
│   │       │   └── route.ts
│   │       ├── search/
│   │       │   └── route.ts
│   │       ├── send/
│   │       │   └── route.ts
│   │       └── sent/
│   │           └── route.ts
│   │
│   ├── compose/
│   │   └── page.tsx
│   │
│   ├── email/[id]/
│   │   └── page.tsx
│   │
│   ├── sent/
│   │   └── page.tsx
│   │
│   └── page.tsx
│
├── lib/
│   └── db.ts
│
├── .env.example
├── .gitignore
├── package.json
└── README.md

How the AI Assistant Works
The AI assistant has three main flows.

1. Natural-Language Email Search
Example:
Find emails about security
The request is sent to the AI action endpoint.
The AI determines that the user wants to search emails and generates an appropriate Gmail search query.
The application then calls the Gmail search API and displays the matching messages.

2. Email Questions
Example:
What happened in the security alert?
The application sends the question together with the available email information to the AI endpoint.
The local Ollama model generates an answer based on the provided email context.

3. UI Actions
The assistant recognizes selected navigation commands such as:
Go to Sent
Go to Inbox
Compose an email
These commands trigger the corresponding application navigation.
Gmail Integration
The application uses the Gmail API for:
Google OAuth
     ↓
Access Token
     ↓
Gmail API
     ↓
Inbox / Search / Email Details / Send / Sent
OAuth tokens required for Gmail API access are stored in PostgreSQL.

Environment Variables
Create a .env.local file in the project root.

Use:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
DATABASE_URL=
Do not commit .env.local or any file containing real credentials.

A template is provided in:
.env.example

PostgreSQL Setup
Create a PostgreSQL database named:
nebula_mail

Create the required OAuth token table:

CREATE TABLE google_tokens (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Configure the database connection in .env.local:
DATABASE_URL=postgresql://username:password@localhost:5432/nebula_mail

Ollama Setup

Install Ollama and download the model:
ollama pull llama3.2:1b
Make sure Ollama is running before using the AI assistant.
The application communicates with Ollama through the Ollama JavaScript package.

Installation
Clone the repository:

git clone https://github.com/Shakeashiya15/mail_web_app.git
Navigate into the project:
cd mail_web_app
Install dependencies:
npm install
Create .env.local and add the required environment variables.

Start the development server:
npm run dev

Open:
http://localhost:3000

Google OAuth Configuration
In Google Cloud Console:
1.	Create or select a Google Cloud project.
2.	Enable the Gmail API.
3.	Configure the Google OAuth consent screen.
4.	Create an OAuth 2.0 Web Application client.
5.	Add this authorized JavaScript origin:
http://localhost:3000
6.	Add this authorized redirect URI:
http://localhost:3000/api/auth/google/callback
7.	Configure the Gmail API scopes used by the application.
8.	If the OAuth application is in testing mode, add the Gmail account used for testing as a test user.

Available Routes
Pages
Route	Purpose
/	Gmail Inbox
/compose	Compose email
/sent	Sent emails
/email/[id]	Email details
API Routes
API Route	Method	Purpose
/api/auth/google	GET	Start Google OAuth
/api/auth/google/callback	GET	Handle OAuth callback
/api/gmail/inbox	GET	Fetch Inbox emails
/api/gmail/email/[id]	GET	Fetch individual email
/api/gmail/search	GET	Search Gmail
/api/gmail/send	POST	Send email
/api/gmail/sent	GET	Fetch Sent emails
/api/ai	POST	Answer email-related questions
/api/ai/action	POST	Detect AI email actions

Security
•	OAuth credentials are stored in environment variables.
•	.env.local is excluded from Git using .gitignore.
•	Only .env.example is committed as a configuration template.
•	Gmail passwords are never stored by the application.
•	Gmail access is performed through Google OAuth.
•	OAuth tokens are stored in PostgreSQL.

Production Build

Create a production build using:
npm run build
The project has been successfully tested with the Next.js production build.

Future Improvements
Possible future enhancements include:
•	Starred email management
•	Trash management
•	Email labels
•	Thread/conversation view
•	Attachments
•	Rich-text email composition
•	More advanced AI actions
•	Streaming AI responses
•	Improved authentication and session management
•	Production deployment

Repository: https://github.com/Shakeashiya15/mail_web_app

