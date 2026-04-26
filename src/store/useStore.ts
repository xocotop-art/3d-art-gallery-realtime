import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Player, Artwork } from '../lib/supabase';
import throttle from 'lodash.throttle';

interface State {
  currentUser: Player;
  players: Record<string, Player>;
  artworks: Artwork[];
  initUser: (name: string) => void;
  updatePosition: (x: number, y: number, z: number, rotationY: number) => void;
  setViewingArtwork: (id: string | null) => void;
  updatePlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  fetchArtworks: () => Promise<void>;
  updateHeartbeat: () => void;
  teleportTo: (x: number, y: number, z: number) => void;
  likeArtwork: (artwork_id: string) => Promise<void>;
  updateArtwork: (artwork: Artwork) => void;
  sendReaction: (reaction: string) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const useStore = create<State>((set, get) => ({
  currentUser: {
    id: '',
    name: '',
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 0,
    y: 1.6,
    z: 5,
    rotationY: 0,
    room_id: 'main',
    artwork_id: null,
    reaction: null,
    updated_at: new Date().toISOString()
  },
  players: {},
  artworks: [],

  initUser: (name: string) => {
    const id = uuidv4();
    const newUser = { ...get().currentUser, id, name };
    set({ currentUser: newUser });
    supabase.from('players').insert([newUser]).then();
  },

  updatePosition: throttle((x: number, y: number, z: number, rotationY: number) => {
    const state = get();
    if (!state.currentUser.id) return;
    const updatedUser = { ...state.currentUser, x, y, z, rotationY, updated_at: new Date().toISOString() };
    set({ currentUser: updatedUser });
    supabase.from('players').update({ x, y, z, rotationY, updated_at: updatedUser.updated_at }).eq('id', updatedUser.id).then();
  }, 100),

  setViewingArtwork: (id: string | null) => {
    const state = get();
    if (!state.currentUser.id) return;
    const updatedUser = { ...state.currentUser, artwork_id: id, updated_at: new Date().toISOString() };
    set({ currentUser: updatedUser });
    supabase.from('players').update({ artwork_id: id, updated_at: updatedUser.updated_at }).eq('id', updatedUser.id).then();
  },

  updatePlayer: (player: Player) => {
    if (player.id === get().currentUser.id) return;
    set((state) => ({ players: { ...state.players, [player.id]: player } }));
  },

  removePlayer: (id: string) => {
    set((state) => {
      const newPlayers = { ...state.players };
      delete newPlayers[id];
      return { players: newPlayers };
    });
  },

  fetchArtworks: async () => {
    const { data, error } = await supabase.from('artworks').select('*').eq('room_id', 'main');
    if (!error && data) { set({ artworks: data }); }
  },

  updateHeartbeat: throttle(() => {
    const state = get();
    if (!state.currentUser.id) return;
    supabase.from('players').update({ updated_at: new Date().toISOString() }).eq('id', state.currentUser.id).then();
  }, 2000),

  teleportTo: (x: number, y: number, z: number) => {
    const state = get();
    if (!state.currentUser.id) return;
    const updatedUser = { ...state.currentUser, x, y, z };
    set({ currentUser: updatedUser });
    supabase.from('players').update({ x, y, z }).eq('id', updatedUser.id).then();
  },

  likeArtwork: async (artwork_id: string) => {
    const { artworks } = get();
    const artwork = artworks.find(a => a.id === artwork_id);
    if (!artwork) return;
    const newLikes = (artwork.likes || 0) + 1;
    set({ artworks: artworks.map(a => a.id === artwork_id ? { ...a, likes: newLikes } : a) });
    await supabase.rpc('increment_likes', { artwork_id_param: artwork_id });
  },

  updateArtwork: (artwork: Artwork) => {
    set((state) => ({ artworks: state.artworks.map(a => a.id === artwork.id ? { ...a, ...artwork } : a) }));
  },
  
  sendReaction: (reaction: string) => {
    const state = get();
    if (!state.currentUser.id) return;
    supabase.from('players').update({ reaction }).eq('id', state.currentUser.id).then();
    setTimeout(() => {
      if (get().currentUser.reaction === reaction) {
        supabase.from('players').update({ reaction: null }).eq('id', state.currentUser.id).then();
      }
    }, 3000);
  }
}));
