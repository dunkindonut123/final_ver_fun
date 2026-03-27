This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase Setup

1. Create a Supabase project.
2. In Supabase, open SQL Editor and run [supabase/schema.sql](supabase/schema.sql).
3. In Authentication -> Providers -> Email, enable email/password auth.
4. For the current client-side signup flow, turn off Confirm Email (Authentication -> Providers -> Email -> Confirm email).
5. Copy [.env.example](.env.example) to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

6. Restart the dev server after updating env vars.

## Auth Flow Implemented

- Student sign up: creates user in Auth, creates a `profiles` row with role `student`, validates `teacher_code`, then creates a `students` row.
- Teacher sign up: creates user in Auth, creates a `profiles` row with role `teacher`, then creates a `teachers` row with generated teacher code.
- Sign in: checks `profiles.role` and redirects to the matching dashboard.
- Dashboard guards: server-side role check prevents accessing the wrong dashboard URL.

## Troubleshooting

- If sign in shows profile not found:
	- Ensure the user exists in `auth.users`.
	- Ensure `profiles.id` is exactly the same UUID as `auth.users.id`.
	- Ensure `profiles.role` is either `student` or `teacher`.
- If teacher/student sign up says no session was created:
	- In Supabase, disable Confirm Email for this current client-side flow.
	- Then sign up again.

## Getting Started

First, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
