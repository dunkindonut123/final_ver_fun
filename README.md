# Fun Mandarin - Language Learning Platform

A modern, interactive Mandarin Chinese language learning platform built with [Next.js](https://nextjs.org), featuring role-based authentication, gamified learning experiences, and comprehensive course management.

## 🎯 Features

- **Role-Based Access**: Separate experiences for students and teachers
- **Interactive Lessons**: Assignments and exercises with progress tracking
- **Gamification**: Typing games and challenges to reinforce learning
- **Teacher Management**: Teacher approval system and student code validation
- **Admin Dashboard**: Teacher approval and platform management
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS and Radix UI

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Email/Password Auth
- **Database**: Supabase PostgreSQL
- **UI Components**: Lucide React icons, custom Radix UI components

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- A [Supabase](https://supabase.com) account and project
- Git

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd template-web
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. In the Supabase dashboard, navigate to **SQL Editor**
3. Create a new query and paste the contents of [supabase/schema.sql](supabase/schema.sql)
4. Execute the query to create all required tables and functions
5. In **Authentication → Providers → Email**:
   - Enable email/password auth
   - **Disable** "Confirm email" (required for current signup flow)

### 3. Configure Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in **Supabase → Settings → API**

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 📁 Project Structure

- `app/` - Next.js App Router pages and layouts
  - `auth/` - Sign up and authentication pages
  - `student/` - Student dashboard and features
  - `teacher/` - Teacher dashboard and management
  - `admin/` - Admin approval system
  - `assignment/` - Lesson and exercise pages
  - `game/` - Gamified learning experiences
  - `api/` - API routes for backend operations
- `components/` - Reusable React components
  - `ui/` - Base UI components (Button, Card, Dialog, etc.)
  - `student/`, `teacher/`, `admin/` - Feature-specific components
- `lib/` - Utility functions and Supabase clients
  - `supabase/` - Supabase configuration and middleware
  - `courses-data.ts` - Course content definitions
  - `hanzi-data.ts` - Chinese character data
  - `actions.ts` - Server actions
- `supabase/` - Database schema

## 🔐 Authentication Flow

### Student Sign Up
1. User creates account with email/password
2. System creates `profiles` row with role `student`
3. User must provide valid teacher code
4. System creates `students` row linked to teacher
5. Redirects to student dashboard

### Teacher Sign Up
1. User creates account with email/password
2. System creates `profiles` row with role `teacher`
3. System generates unique teacher code
4. System creates `teachers` row
5. Redirects to teacher dashboard

### Sign In
- System checks `profiles.role` and redirects to appropriate dashboard
- Server-side guards prevent accessing wrong dashboard URLs

## 📦 Available Scripts

- `npm run dev` - Start development server (with hot reload)
- `npm run build` - Build for production
- `npm start` - Start production server

## 🔧 Development

The app uses hot module replacement, so changes to files automatically refresh the browser. Edit files in the `app/` directory to see changes immediately.

Key development files:
- `middleware.ts` - Request middleware and Supabase session handling
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

## 🚨 Troubleshooting

### Sign in shows "Profile not found"
- Verify user exists in `auth.users` (Supabase → Authentication → Users)
- Ensure `profiles.id` matches the user's UUID exactly
- Verify `profiles.role` is either `student` or `teacher`

### Sign up returns "No session was created"
1. Go to Supabase Dashboard
2. Navigate to **Authentication → Providers → Email**
3. Disable the "Confirm email" option
4. Try signing up again

### Environment variables not loading
- Ensure `.env.local` file exists in the root directory
- Verify variable names match exactly (case-sensitive)
- Restart the development server after updating `.env.local`

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

## 📄 License

This project is private and proprietary.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
