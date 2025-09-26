# Personalized Learning Platform

This is a personalized learning platform that allows users to learn at their own pace. It is built with Next.js and Supabase.

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Supabase:**

   - Create a new project on [Supabase](https://supabase.io/).
   - Go to the "SQL Editor" and run the SQL script from `database.sql` to create the necessary tables.
   - Go to "Settings" > "API" and get your Supabase URL and anon key.
   - Create a `.env.local` file in the root of your project and add the following:

     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

### `lessons`

| Column      | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| `id`        | `UUID`  | The primary key for the lesson.           |
| `title`     | `TEXT`  | The title of the lesson.                  |
| `description`| `TEXT`  | A brief description of the lesson.        |
| `difficulty`| `TEXT`  | The difficulty level of the lesson.      |
| `content`   | `TEXT`  | The content of the lesson in Markdown.    |
| `order`     | `INTEGER`| The order of the lesson in the learning path. |

### `lesson_completions`

| Column     | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| `user_id`  | `UUID`  | The ID of the user who completed the lesson.      |
| `lesson_id`| `UUID`  | The ID of the lesson that was completed.          |
| `progress` | `FLOAT` | The user's progress on the lesson (0-100).        |
