# Podcast Learning Lab

A web application that transcribes podcast episodes and helps you learn from them. Built with React, TypeScript, and Supabase.

## Features

- Podcast episode transcription using AssemblyAI
- Real-time transcription status updates
- Speaker detection and sentiment analysis
- Interactive transcript viewer
- Secure authentication with Supabase

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase
- AssemblyAI

## Getting Started

1. Clone the repository
```bash
git clone <repository-url>
cd podcast-learning-lab
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
API_URL=your_supabase_url
SERVICE_ROLE_KEY=your_supabase_service_role_key
FUNCTIONS_URL=your_functions_url
WEBHOOK_SECRET=your_webhook_secret
```

4. Start the development server
```bash
npm run dev
```

5. Deploy Supabase Edge Functions
```bash
supabase functions deploy
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `supabase start` - Start local Supabase services
- `supabase functions serve` - Start Edge Functions locally

## License

MIT
