import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rxqeikkreprruiulzmrg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Player = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  room_id: string;
  artwork_id: string | null;
  reaction: string | null;
  updated_at: string;
};

export type Artwork = {
  id: string;
  title: string;
  artist: string;
  image_url: string;
  x: number;
  y: number;
  z: number;
  rotation_y?: number;
  link_url?: string;
  likes?: number;
};
