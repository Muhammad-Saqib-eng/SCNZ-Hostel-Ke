# System Architecture & Technical Specifications

This document outlines the internal logic, data structures, and implementation details of the SCNZ Hostel Ke application.

---

## 1. Core Logic: Financial Connectivity

The most significant technical feature of the system is the **Debt-to-Cashflow Integration**. Unlike traditional trackers where expenses and debts are isolated modules, this system treats them as part of a single liquidity pool.

### The Calculation Engine (`App.tsx`)
The `totalSpent` variable is calculated dynamically using both the `expenses` collection and the `debts` collection:

$$TotalSpent = \sum(Expenses) + \text{DebtAdjustments}$$

**DebtAdjustments logic:**
- **Lending (`owes_me` + `!settled`)**: When you give 500 PKR to Ali, it is immediate cash outflow. The system adds this to `totalSpent`.
- **Payment (`i_owe` + `settled`)**: When you pay back a debt you owed to someone else, that cash is finally gone. The system adds this to `totalSpent`.
- **Repayment Received (`owes_me` + `settled`)**: This acts as a cash inflow, reducing the `totalSpent` (or neutralizing the initial loan outflow).

---

## 2. AI Intelligence Layer (`geminiService.ts`)

The application uses the **Gemini 2.0 Flash** model to transform unstructured text into validated JSON.

### Parsing Workflow
1. **Prompt Engineering**: The system uses a system instruction that defines the "Hostel Vibe" and strict schema requirements.
2. **Entity Extraction**:
   - **Expenses**: Identified by value + category keywords.
   - **Debts**: Detected via NLP patterns (e.g., "lie", "diye", "udhaar", "owes", "paid back").
3. **Roman Urdu Support**: The model is specifically instructed to understand Pakistani slang and Roman Urdu transliteration common in student life.
4. **Structured Response**: The output is constrained by a JSON schema using `responseSchema` to ensure 100% compatibility with the TypeScript interfaces.

---

## 3. Data Infrastructure (`dbService.ts`)

Built on **Firebase Firestore**, using a relational sub-collection pattern for multi-user isolation.

### Schema
- `users/{userId}`: Root document for user metadata and allowance.
- `users/{userId}/expenses/{expenseId}`: Individual transaction records.
- `users/{userId}/debts/{debtId}`: Social debt records including metadata like `peerName` and `settled` status.

### Real-time Sync
The system utilizes `onSnapshot` listeners in `App.tsx` to provide a reactive UI. Any change in the database (even from another device) reflects instantly in the metrics and transaction ledger without a page refresh.

---

## 4. UI Design Philosophy

The interface follows a **"High-Density Tech-Brutalist"** aesthetic:
- **Ledger Groups**: Transactions are grouped and use hover-scaling effects for better readability of dense data.
- **Micro-Animations**: Uses `motion` (Framer Motion) for layout transitions (staggered list entries, layout shifting when settling debts).
- **Interactive Metrics**: Metrics cards provide "Hover Insights" into why the "Total Outflow" is higher than the sum of expenses (mentioning debt adjustments).

---

## 5. Security & Isolation

- **Authentication**: Google Auth ensures `userId` is verifiable.
- **Rule Enforcement**: Firestore security rules ensure that `request.auth.uid` must match the `userId` in the document path, preventing cross-user data leaks.
- **API Key Safety**: The Gemini API key is managed on the server-side/environment level, never exposed directly in client-side hardcoding.
