# SCNZ Hostel Ke - AI Khata Intelligence

**SCNZ Hostel Ke** is a zero-friction, AI-powered financial management companion designed specifically for hostel students. It bridges the gap between messy manual "brain dumps" and structured financial tracking by leveraging Gemini 2.0 to parse mixed Roman Urdu and English ledger entries.

## 🚀 Key Features

- **AI Khata Parser**: Paste your daily "brain dump" (e.g., "Biryani 300, Rickshaw 150, Ali ko 500 diye") and let Gemini 2.0 categorize and extract structured data.
- **Social Debt Settler**: Track who owes you money and who you owe with a dedicated settlement engine.
- **Financial Connectivity**: Debts are strictly connected to your "Remaining Fuel" (Monthly Budget).
  - Loans given to others are treated as out-of-pocket outflows.
  - Paying your own debts also reduces your available cash.
- **Visual Ledger**: A high-density, polished transaction ledger with hover effects and detailed categorization.
- **Vibe Advice**: AI-generated financial coaching with a "Hostel Vibe" (using Roman Urdu/English mix).

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Motion (Framer Motion)
- **Database/Auth**: Firebase (Firestore & Google Auth)
- **AI Engine**: Google Gemini 2.0 (via `@google/genai`)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Gemini API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_PROJECT_ID=your_id
   GEMINI_API_KEY=your_gemini_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture
For a deep dive into how the system works under the hood, see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).
