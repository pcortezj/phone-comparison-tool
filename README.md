# Smartphone Comparison Tool

A modern web application for comparing smartphone specifications using the RapidAPI Mobile Phone Specs Database.

## Features

- **Brand Selection**: Browse phones by manufacturer
- **Device Search**: Search for specific devices within brands
- **Side-by-Side Comparison**: Compare up to 4 devices simultaneously
- **Detailed Specifications**: View comprehensive device specs
- **Real-time Data**: Live data from RapidAPI Mobile Phone Specs Database
- **Admin Panel**: Download and manage phone data

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **API**: RapidAPI Mobile Phone Specs Database
- **Deployment**: Vercel-ready

## Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd difference-ai-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure RapidAPI
1. Get your API key from [RapidAPI Mobile Phone Specs Database](https://rapidapi.com/makingdatameaningful/api/mobile-phone-specs-database)
2. Create a `.env.local` file in the project root:
```bash
RAPIDAPI_KEY=your_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Usage

### Main App (`/`)
- Select a brand from the dropdown
- Search for devices within the brand
- Add up to 4 devices to comparison
- Click "Compare Devices" to view detailed comparison

### Admin Panel (`/admin`)
- Download phone data by brand or all phones
- View available brands and device counts
- Monitor download progress

## API Endpoints

- `GET /api/phones` - Get all brands
- `GET /api/phones/[brand]` - Get devices for a brand
- `GET /api/phones/device/[id]` - Get detailed device specifications
- `GET /api/phones/download` - Get available brands for download
- `POST /api/phones/download` - Download phone data

## Data Structure

The app uses the RapidAPI Mobile Phone Specs Database which provides:
- Basic device information (name, brand, model, image)
- Detailed specifications (display, performance, camera, battery, etc.)
- Pricing information
- Connectivity and software details

## Deployment

The app is ready for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `RAPIDAPI_KEY` environment variable in Vercel
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
