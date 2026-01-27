# 💪 Fitness Helper V2

A personal fitness journal supporting goal tracking and workout logging to help users achieve their fitness goals.

## 🌐 Live demo
https://fitness-helper-v2.vercel.app/

## Features

- **Goal Management 🏆** — Set, track, and manage your fitness goals with progress visualization
- **Workout Logging 📝** — Record workout entries with timestamps and details for future reference
- **User Authentication 🧑‍💻** — Secure authentication powered by Supabase
- **Dark Mode 🌑** — Sleek dark-themed interface for comfortable viewing
- **Mobile Responsive 📱** — Fully responsive design that works on desktop and mobile devices

## Tech Stack 🛠️

- React 18 with TypeScript Frontend
- Vite (build tool)
- Tailwind CSS (styling)
- Supabase (authentication, database, and backend REST)
- Vercel Deployment

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fitness-ai-coach
```

2. Navigate to the frontend directory:
```bash
cd frontend
```

3. Install dependencies:
```bash
npm install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will start at `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
pnpm build
```

### Running Tests

```bash
npm run test
# or
pnpm test
```

## Environment Setup

Create a `.env.local` file in the `frontend` directory with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components for routing
│   ├── services/        # API and Supabase integration
│   ├── contexts/        # React context for global state (Auth)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── App.tsx          # Main app component
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Key Pages

- **Auth** — Login and signup functionality
- **Goals** — Create and manage fitness goals
- **Entries** — Log and view workout entries


Built for UofT Hacks 13
