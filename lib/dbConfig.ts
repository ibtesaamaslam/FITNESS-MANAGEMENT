
// ⚠️ SECURITY WARNING: 
// This file contains sensitive database credentials.
// It is strictly for reference or server-side scripts (Node.js/Python).
// DO NOT import this file into client-side components (React), or your password will be exposed to the public.

export const DB_CONFIG = {
  host: 'db.btbtfehrfcyakfcpefey.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'DFxMaukIgZwhTbzV' 
};

export const CONNECTION_STRINGS = {
  // Use this for Transaction Pooler (IPv4 compatible, best for serverless functions)
  pooler: "postgres://postgres.btbtfehrfcyakfcpefey:DFxMaukIgZwhTbzV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true",
  
  // Use this for Direct Connection (Session Mode)
  direct: "postgres://postgres.btbtfehrfcyakfcpefey:DFxMaukIgZwhTbzV@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
};

// ⚠️ SERVICE ROLE KEY (SUPER ADMIN ACCESS - DO NOT USE IN FRONTEND)
// SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YnRmZWhyZmN5YWtmY3BlZmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDExMTM5MiwiZXhwIjoyMDg1Njg3MzkyfQ.Aj0Yye0LyBqSkVW9yuV6NBWm6XhovcHkPV-UkJriSnI"
