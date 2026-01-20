# Project Workflow: Lost & Found Application

This document outlines the end-to-end workflow of the application, including user roles, key processes, and the interaction between the frontend, backend (Convex), and AI services. You can use this to create a flow diagram.

## 1. System Overview

*   **Frontend**: Next.js (SSR), TailwindCSS, React.
*   **Backend**: Convex (Database, Functions, Scheduling).
*   **Authentication**: Clerk.
*   **AI**: Integration for generating verification questions.

## 2. User Roles

*   **Founder (Finder/Owner)**: The user who lists an item (either lost or found). For a "Found" item, they possess the item.
*   **Claimant**: The user who believes a "Found" item belongs to them and initiates a claim.

## 3. Core Workflows

### A. Listing Creation & Discovery
1.  **Create Listing**: Authenticated user fills a form to report a Lost or Found item.
    *   *Data*: Stored in `listings` table.
    *   *Validation*: User ID (`clerkUserId`) attached.
2.  **Search/Browse**: Users browse listings (filtered by type, category, or search text).
    *   *Privacy*: Sensitive details (description of found items) may be hidden from non-owners to prevent fraud.

### B. Verification Process (The "Claim" Flow)
This is the critical security layer to ensure the item goes to the right owner.

1.  **Initiate Claim**:
    *   **Actor**: Claimant.
    *   **Action**: Clicks "Claim" on a specific listing.
    *   **Backend**: `verification.initiateClaim`. Creates a `verificationClaims` record with status `pending`.

2.  **Approve Claim**:
    *   **Actor**: Founder (Finder).
    *   **Action**: Reviews the claim request and approves it if they want to proceed.
    *   **Backend**: `verification.approveClaim`.
    *   **Trigger**: Schedules an AI action (`verificationActions.generateQuestions`). Status updates to `generating`.

3.  **Generate Questions (AI)**:
    *   **Actor**: System (Convex Action + AI).
    *   **Action**: Analyzes listing details to generate specific questions only the true owner would know.
    *   **Result**: Stores questions in the claim record. Status updates to `questions_generated`.

4.  **Submit Answers**:
    *   **Actor**: Claimant.
    *   **Action**: Answers the AI-generated questions via the UI.
    *   **Backend**: `verification.submitVerificationAnswers`.

5.  **Validation**:
    *   **Actor**: System.
    *   **Logic**: Compares submitted answers with AI-generated correct answers.
    *   **Result**: 
        *   If all correct: Status -> `approved`.
        *   If incorrect: Status -> `rejected`.

### C. Chat & Communication
Access to chat is strictly controlled based on the verification status.

1.  **Access Check**:
    *   **Founder**: Always has access to chat for their listing.
    *   **Claimant**: Access **LOCKED** until claim status is `approved`.
    *   **Unlock**: Once approved, the chat interface unlocks.

2.  **Messaging**:
    *   **Components**: `ListingChat.tsx`.
    *   **Backend**: `conversations.sendMessage`, `conversations.getMessages`.
    *   **Features**: Real-time updates, persistency.

### D. Resolution
1.  **Exchange**: Users arrange a meeting via chat.
2.  **Resolve**:
    *   **Actor**: Founder.
    *   **Action**: Marks listing as "Resolved".
    *   **Backend**: `verification.resolveListing`. Listing status updates to `resolved`.
