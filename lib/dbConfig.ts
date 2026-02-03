// Configuration for PostgreSQL database
// Note: Direct connection from browser to port 5432 is not supported due to security sandboxing.
// These credentials are preserved here for future backend integration (e.g., Node.js, Python, or Supabase Client).

export const DB_CONFIG = {
  host: 'db.lvthagphtyigzwjwuzpd.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  // password: [YOUR_PASSWORD] 
};

// To use this database, you would typically use a backend server:
// const { Pool } = require('pg');
// const pool = new Pool(DB_CONFIG);

// Or use the Supabase JS Client with project URL:
// const supabaseUrl = 'https://lvthagphtyigzwjwuzpd.supabase.co'
// const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(supabaseUrl, supabaseKey)
