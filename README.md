# WelfareX

An internal welfare management system for member registration, loan and grant
workflows, document verification, monthly fees, installments, approvals, and
finance operations.

## Getting Started

Copy `.env.example` to `.env.local` and configure at least `MONGODB_URI` and
`JWT_ACCESS_SECRET`. Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

Connect this repository to the Vercel project and add the same required
environment variables for Production, Preview, and Development. Optional Blob,
SMS, and cron variables are documented in `.env.example`.
