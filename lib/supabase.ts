import { createClient } from "@supabase/supabase-js";

// La URL y la clave "anon" de Supabase están pensadas para exponerse en el
// cliente (el acceso real lo controlan las políticas RLS de la base de
// datos), por eso llevan un valor por defecto además de poder venir de env.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://aqghbbyydwhfihshtiyf.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZ2hiYnl5ZHdoZmloc2h0aXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjAxNjUsImV4cCI6MjEwMjgzNjE2NX0.ZqMwY7ab16GWxUwFNuI9jPM4vE5cK1y5id31z8Kts6U";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Destination = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  cover_image_url: string | null;
  description: string | null;
  accent_color: string | null;
  visited_on: string | null;
  created_at: string;
};

export type Photo = {
  id: string;
  destination_id: string;
  image_url: string;
  caption: string | null;
  uploader_name: string | null;
  created_at: string;
};
