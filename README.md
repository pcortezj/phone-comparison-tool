# Smartphone Comparison Tool

A local-first smartphone comparison app backed by SQLite and Prisma. Import scraped or open-source JSON datasets into your own catalog, then browse and compare phones without depending on a third-party specs API.

## Features

- Browse brands and devices from your own catalog
- Compare up to 4 phones side by side
- Ask an AI comparison copilot using OpenAI or local Ollama
- Import raw JSON datasets from `data/imports`
- Store normalized phone specs in SQLite through Prisma
- Re-import datasets safely with upsert behavior

## Stack

- Next.js 14
- React 18
- TypeScript
- Prisma
- SQLite

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate the Prisma client

```bash
npm run db:generate
```

### 3. Create the SQLite database

```bash
npm run db:init
```

This creates `dev.db` with the schema expected by Prisma.
In this repo, Prisma resolves that to `prisma/dev.db`.

If Prisma schema sync works cleanly in your environment, you can also use:

```bash
npm run db:push
```

### 4. Add import files

Put one or more JSON files inside `data/imports/`.

Each file should contain a JSON array. The importer is flexible, but each phone should ideally provide:

```json
[
  {
    "brand": "Samsung",
    "model": "Galaxy S24",
    "name": "Samsung Galaxy S24",
    "image": "https://example.com/s24.jpg",
    "specs": {
      "display": {
        "size": "6.2 inches",
        "resolution": "1080 x 2340 pixels"
      },
      "performance": {
        "processor": "Snapdragon 8 Gen 3",
        "ram": "8GB",
        "storage": "128GB"
      },
      "battery": {
        "capacity": "4000 mAh",
        "charging": "25W wired"
      }
    }
  }
]
```

The importer also understands more GSMArena-style payloads that use a `specifications` array.

### 5. Import data

Import everything in `data/imports`:

```bash
npm run import:phones
```

Or import a single file:

```bash
node scripts/import-phone-data.mjs my-file.json
```

### 6. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Comparison Copilot Setup

The compare page can answer natural-language questions about the phones you selected.

### Hosted open-model setup: Hugging Face

Add an `.env.local` file with a Hugging Face token:

```bash
HF_TOKEN=your_hugging_face_token_here
COMPARE_ASSISTANT_PROVIDER=huggingface
HUGGINGFACE_MODEL=deepseek-ai/DeepSeek-R1:fastest
```

`HF_TOKEN` uses Hugging Face Inference Providers through their OpenAI-compatible chat API. You can also use `HUGGINGFACE_API_KEY` instead of `HF_TOKEN`.

### Fastest hosted setup: OpenAI

Add an `.env.local` file with:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

With `OPENAI_API_KEY` present, the comparison assistant will use OpenAI by default.

### Local setup: Ollama

If you want a local model instead, start Ollama and optionally set:

```bash
COMPARE_ASSISTANT_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

### Provider selection

- `COMPARE_ASSISTANT_PROVIDER=openai` tries OpenAI first, then Hugging Face, then Ollama
- `COMPARE_ASSISTANT_PROVIDER=huggingface` tries Hugging Face first, then Ollama, then OpenAI
- `COMPARE_ASSISTANT_PROVIDER=ollama` tries Ollama first, then Hugging Face, then OpenAI
- If neither provider is available, the app returns a grounded spec-based fallback summary instead of failing silently

## Admin Workflow

The admin page at `/admin` lets you:

- See how many brands and devices are in the catalog
- Detect JSON files currently present in `data/imports`
- Import one file or all files into SQLite

## API Endpoints

- `GET /api/phones` returns brands from the local catalog
- `GET /api/phones/[brand]` returns devices for a brand
- `GET /api/phones/device/[id]` returns normalized device details
- `GET /api/phones/download` returns admin/import metadata
- `POST /api/phones/download` imports one file or all files

## Prisma Commands

```bash
npm run db:generate
npm run db:init
npm run db:push
npm run db:studio
```

## Notes

- The source of truth is now your local SQLite database, not a hosted phone-spec API.
- Raw import files in `data/imports` are gitignored by default.
- The Prisma database file is gitignored by default.
