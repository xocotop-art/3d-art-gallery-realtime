import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Users, User as UserIcon, Volume2, VolumeX, Heart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UI() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const currentUser = useStore(state => state.currentUser);
  const players = useStore(state => state.players);
  const artworks = useStore(state => state.artworks);
  const initUser = useStore(state => state.initUser);
  const currentArtwork = artworks.find(a => a.id === currentUser.artwork_id);

  return (
    <div className="ui-overlay">
      {!joined ? (
        <div className="join-screen"><div className="join-card"><h1>Galería</h1><input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre..." /><button onClick={() => { initUser(name); setJoined(true); }}>Entrar</button></div></div>
      ) : (
        <div className="main-ui">
          <header className="flex justify-between p-6">
            <h1 className="text-xl text-white">MUSEO VIRTUAL</h1>
            <div className="flex gap-4 text-white bg-black/40 p-3 rounded-xl backdrop-blur-md">
              <span className="flex items-center gap-2"><UserIcon size={16} />{currentUser.name}</span>
              <span className="flex items-center gap-2"><Users size={16} />{Object.keys(players).length + 1} online</span>
            </div>
          </header>
          <AnimatePresence>
            {currentArtwork && (
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 artwork-card text-center pointer-events-auto">
                <h2 className="text-xl text-white">{currentArtwork.title}</h2>
                <p className="text-white/60">{currentArtwork.artist}</p>
                {currentArtwork.link_url && (
                  <button onClick={() => window.open(currentArtwork.link_url, '_blank')} className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg">Ver más información</button>
                )}
                <button onClick={() => useStore.getState().likeArtwork(currentArtwork.id)} className="mt-4 flex items-center justify-center gap-2 w-full text-pink-400"><Heart size={20} />{currentArtwork.likes || 0}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
