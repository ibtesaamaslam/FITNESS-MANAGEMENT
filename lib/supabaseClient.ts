import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- INSTRUCTIONS ---
// 1. Create a new project at https://supabase.com/
// 2. Go to your project's "Project Settings" > "API".
// 3. Find your "Project URL" and "Project API Keys" (use the 'anon' 'public' key).
// 4. Replace the placeholder values below.
// 5. Go to the "SQL Editor" in your project and run the queries from `supabase_schema.sql` to create your tables.

const supabaseUrl = 'https://lvthagphtyigzwjwuzpd.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dGhhZ3BodHlpZ3p3and1enBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTczMTMsImV4cCI6MjA3ODYzMzMxM30.XbVrnAYczvZydBBWpCgqY0ORjcqi9zzMpMKshuXJ0sk'; // Replace with your Supabase anon key

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // A simple check to remind the user to replace the placeholders.
  // In a real app, you'd use environment variables.
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:10px;left:10px;padding:12px;background-color:#ef4444;color:white;font-family:sans-serif;border-radius:8px;z-index:1000;';
  errorDiv.innerText = 'Supabase URL or Key is not set. Please update lib/supabaseClient.ts';
  document.body.appendChild(errorDiv);
  console.error("Supabase URL or Key is not set. Please update lib/supabaseClient.ts");
}

export { supabase };
