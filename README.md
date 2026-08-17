# Phone Comparison Tool

A local-first smartphone comparison app built with Next.js, Prisma, and SQLite. It replaces the earlier RapidAPI workflow with a self-owned phone catalog that can be populated from GSMArena-style JSON imports, browsed by brand and release year, and compared side by side.

## Features

- Search phones from a local SQLite catalog
- Filter results by brand and release year
- Compare up to four phones side by side
- View normalized device detail pages
- Import JSON datasets through scripts or the admin page
- Scrape curated GSMArena listings into import-ready JSON
- Ask a comparison assistant questions about selected phones
- Keep raw import files and local database files out of Git by default

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Prisma
- SQLite
- Tailwind CSS tooling

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Create the SQLite Database

```bash
npm run db:init
```

This creates `prisma/dev.db` using [scripts/init-db.sql](scripts/init-db.sql).

You can also sync from Prisma if your local environment supports it:

```bash
npm run db:push
```

### 4. Add Import Data

Place JSON files in `data/imports/`. Import files are intentionally ignored by Git, while `data/imports/.gitkeep` preserves the directory.

Each JSON file should contain an array of phone records. The importer accepts flexible payloads, including GSMArena-style records with `specifications`:

```json
[
  {
    "brand": "Samsung",
    "model": "Galaxy S24",
    "name": "Samsung Galaxy S24",
    "image": "https://example.com/galaxy-s24.jpg",
    "specifications": [
      {
        "title": "Launch",
        "specs": [{ "key": "Status", "value": "Available. Released 2024, January 24" }]
      },
      {
        "title": "Display",
        "specs": [{ "key": "Size", "value": "6.2 inches" }]
      }
    ]
  }
]
```

### 5. Import Phones

Import every `.json` file in `data/imports`:

```bash
npm run import:phones
```

Import one file:

```bash
node scripts/import-phone-data.mjs gsmarena-latest-phones.json
```

### 6. Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Common Workflows

### Browse and Compare Phones

1. Start the app with `npm run dev`.
2. Use the search box, brand dropdown, or release-year dropdown to load matching devices.
3. Add two to four phones to the comparison workspace.
4. Open the comparison page to review normalized specs and ask follow-up questions.

### Use the Admin Page

Visit `/admin` to:

- See catalog totals
- Inspect import files in `data/imports`
- Import one file or all available files
- Confirm recent import results

### Scrape Latest GSMArena Data

The scraper writes JSON files into `data/imports`.

```bash
npm run scrape:gsmarena:latest
```

The script includes curated brand and phone targets in [scripts/scrape-gsmarena.py](scripts/scrape-gsmarena.py). Be respectful of source sites and rate limits when scraping.

### Export From a Local GSMArena SQLite Dump

If you have a compatible GSMArena SQLite database at `/tmp/gsmarena2api/gsmarena.db`, export smartphone records into import format:

```bash
python3 scripts/export-gsmarena-db.py
```

The output is written to `data/imports/gsmarena-smartphones-db.json`.

## Comparison Assistant

The comparison page can answer natural-language questions using the selected phones' normalized catalog data. It supports OpenAI, Hugging Face Inference Providers, or a local Ollama server. If no provider is available, it returns a grounded fallback summary from the stored specs.

### OpenAI

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

### Hugging Face

```bash
COMPARE_ASSISTANT_PROVIDER=huggingface
HF_TOKEN=your_hugging_face_token_here
HUGGINGFACE_MODEL=deepseek-ai/DeepSeek-R1:fastest
```

`HUGGINGFACE_API_KEY` can be used instead of `HF_TOKEN`.

### Ollama

```bash
COMPARE_ASSISTANT_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

Provider selection is controlled with `COMPARE_ASSISTANT_PROVIDER`. Supported values are `openai`, `huggingface`, and `ollama`.

## Scripts

```bash
npm run dev                 # Start the Next.js dev server
npm run build               # Build for production
npm run start               # Start the production server
npm run db:generate         # Generate Prisma client
npm run db:init             # Create prisma/dev.db from SQL
npm run db:push             # Push Prisma schema to SQLite
npm run db:studio           # Open Prisma Studio
npm run import:phones       # Import all JSON files in data/imports
npm run import:phones:latest # Import gsmarena-latest-phones.json
npm run scrape:gsmarena:latest # Scrape latest curated GSMArena targets
```

## API Routes

- `GET /api/phones` returns brands and release years
- `GET /api/phones/search?q=&brand=&year=` searches catalog devices
- `GET /api/phones/[brand]` returns devices for a brand
- `GET /api/phones/device/[id]` returns normalized device details
- `GET /api/phones/download` returns admin import metadata
- `POST /api/phones/download` imports one or all local JSON files
- `POST /api/compare/chat` answers comparison assistant prompts

## Project Layout

```text
data/imports/                  JSON import drop zone
prisma/schema.prisma           Prisma data model
scripts/import-phone-data.mjs  CLI importer
scripts/scrape-gsmarena.py     GSMArena scraper
scripts/init-db.sql            SQLite bootstrap schema
src/app/                       Next.js app routes and UI
src/lib/phone-catalog.ts       Catalog queries and import helpers
src/lib/phone-normalization.js Phone payload normalization
```

## Data and Git

The repository ignores:

- `.env*`
- `data/imports/*.json`
- `prisma/dev.db`
- `prisma/dev.db-journal`
- build artifacts such as `.next/`

This keeps local API keys, scraped datasets, and SQLite databases out of source control.

## Validation

Before opening a PR or deploying, run:

```bash
npm run build
npx tsc --noEmit
```
