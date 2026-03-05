# Asset Hub Property Listing Web

Next.js property listing site that shares the same MongoDB and S3 backend as the Asset Ace app. Primary color: `#015c50`.

## Setup

1. Copy env example and fill in values (same as Asset Ace):

   ```bash
   cp .env.local.example .env.local
   ```

   Set `MONGODB_URI` and optionally AWS S3 vars for property images.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   App runs at [http://localhost:3001](http://localhost:3001).

## Scripts

- `npm run dev` – dev server on port 3001  
- `npm run build` – production build  
- `npm run start` – start production server on port 3001  
- `npm run lint` – run ESLint  

## Routes

- `/` – Landing with hero and search
- `/listings` – List of public listings (filters: `listingType`, `location`, pagination via `cursor`)
- `/listings/[id]` – Property detail

Public listings are those with `publicListing: true` and `status: "Available"` in the shared database.
