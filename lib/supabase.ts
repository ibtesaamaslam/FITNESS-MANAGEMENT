
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely using optional chaining
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://btbtfehrfcyakfcpefey.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YnRmZWhyZmN5YWtmY3BlZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTEzOTIsImV4cCI6MjA4NTY4NzM5Mn0.Rmh-LU-fEQ7CDLgF-IhevOBy6vT9lojlGqclmSliLIc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Environment Variables are missing.");
} else {
  console.log("✅ Supabase Client Initialized", { url: supabaseUrl });
}

// Initialize Supabase client
export const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey
);
