# Elora AI

**Intelligence made simple.**

Elora AI is a powerful, multimodal AI assistant that brings together the best AI models in one seamless experience. Built for real conversations, creative work, and intelligent assistance.

*Powered by [Elenor](https://elenor.io)*

---

## Features

- **Multi-Model AI** - Powered by GPT-5, Claude 4.5 (Haiku & Sonnet), Gemini 2.5 (Flash, Flash Lite, Pro) - seamlessly integrated as Elora Flash, Elora Core, and Elora Think
- **Voice Conversations** - Real-time voice chat with natural speech recognition
- **Image Generation** - Create stunning images with state-of-the-art Gemini 2.5 Flash Image
- **PDF Export** - Save conversations as professionally formatted PDFs
- **Web Search Integration** - Get current information with Google Search grounding
- **Interactive Artifacts** - Generate and preview HTML apps directly in chat
- **Multilingual** - Support for 6 languages (Czech, English, Romanian, German, Russian, Polish)
- **Real-time Sync** - Seamlessly sync conversations across all your devices
- **Offline-First** - Works offline with IndexedDB storage
- **PWA Support** - Install as a native app on any platform

---

## Tech Stack

- **Frontend**: React 19 + Vite 7
- **Database**: Supabase (PostgreSQL + Realtime)
- **Local Storage**: IndexedDB (Dexie v9)
- **AI Models**:
  - OpenAI GPT-5
  - Anthropic Claude 4.5 Haiku & Sonnet
  - Google Gemini 2.5 Flash, Flash Lite & Pro
  - Google Gemini 2.5 Flash Image
- **Voice**: ElevenLabs TTS/STT + Google Cloud Speech
- **Deployment**: Vercel (serverless functions)
- **PWA**: Vite PWA plugin with service workers

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- API keys for AI services (Gemini, Claude, ElevenLabs)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/elora-app.git
cd elora-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and Supabase credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI APIs (configured in backend)
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_claude_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
elora-app/
├── src/
│   ├── components/      # React components
│   ├── services/        # Business logic & API calls
│   │   ├── ai/         # AI service integrations
│   │   ├── storage/    # IndexedDB operations
│   │   └── sync/       # Supabase sync & realtime
│   ├── utils/          # Helper functions
│   ├── contexts/       # React contexts
│   └── App.jsx         # Main app component
├── api/                # Vercel serverless functions
├── public/             # Static assets
├── supabase/           # Database migrations & docs
└── package.json
```

---

## Documentation

- **[Database README](./supabase/database-readme.md)** - Realtime configuration and setup guide
- **[Database Schema](./supabase/database-schema.md)** - Complete database schema documentation
- **[Development Guidelines](./CLAUDE.md)** - Code architecture and best practices

---

## Development

### Available Scripts

- `npm run dev` - Start development server (Vite + proxy server)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Features Implementation

- **Hierarchical Memory**: Auto-summarizes conversations after 29 messages
- **Real-time Sync**: Supabase Realtime for cross-device synchronization
- **Offline Support**: IndexedDB caching with intelligent sync
- **Voice Chat**: WebRTC + ElevenLabs for natural voice conversations
- **File Upload**: Direct GCS upload for files ≥3MB

---

## Contributing

This is a proprietary project developed by Elenor. For questions or support, contact us at [support@elenor.io](mailto:support@elenor.io).

---

## License

Proprietary - All rights reserved by Elenor © 2025

---

## Links

- **Website**: [elenor.io](https://elenor.io)
- **Support**: [support@elenor.io](mailto:support@elenor.io)

---

*Built with intelligence. Powered by Elenor.*
