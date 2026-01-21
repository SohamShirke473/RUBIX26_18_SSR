# Community-Based Lost and Found Platform

A modern, intelligent web application designed to reconnect people with their lost belongings. This platform leverages AI and geolocation to match lost items with found ones, streamlining the recovery process with a secure verification system.

## 🚀 Features

- **Smart Reporting**: 
  - **Report Lost Items**: detailed forms with categories, location, and descriptions.
  - **Report Found Items**: upload photos for AI-powered automatic description generation.
- **AI-Powered Matching**:
  - Uses vector search (Google Gemini embeddings) to semantically match lost and found items.
  - scores matches to suggest the most likely candidates.
- **Secure Verification**:
  - **AI-Generated Questions**: The system generates unique questions about the item (e.g., "What is the wallpaper on the phone?") to verify ownership without revealing sensitive info.
  - claimants answer these questions to prove ownership before chat access is granted.
- **Real-Time Communication**: Secure, in-app messaging between verified parties.
- **Location Mapping**: Interactive maps to pinpoint where items were lost or found (powered by Leaflet).
- **Community Safety**: Complaint and moderation system to handle spam or abuse.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **Backend & Database**: [Convex](https://www.convex.dev/) (Realtime database, Backend functions)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) & React Leaflet

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RUBIX26_18_SSR
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   # Convex
   CONVEX_DEPLOYMENT=
   NEXT_PUBLIC_CONVEX_URL=

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=

   # Google AI
   GOOGLE_GENERATIVE_AI_API_KEY=
   ```

4. **Run the Development Server**
   Start both the Next.js frontend and Convex backend:

   **Terminal 1 (Backend):**
   ```bash
   npx convex dev
   ```

   **Terminal 2 (Frontend):**
   ```bash
   npm run dev
   ```

5. **Open the App**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

- `convex/`: Backend functions, schema, and actions.
- `src/app/`: Next.js App Router pages (report-lost, report-found, dashboard, etc.).
- `src/components/`: Reusable React components.
- `src/lib/`: Utility functions and configuration.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
