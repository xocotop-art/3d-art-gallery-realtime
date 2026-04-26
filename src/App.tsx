import { useEffect } from 'react';
import { Gallery3D } from './components/Gallery3D';
import { UI } from './components/UI';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import type { Player } from './lib/supabase';

function App() {
  const currentUser = useStore(state => state.currentUser);
  const updatePlayer = useStore(state => state.updatePlayer);
  const removePlayer = useStore(state => state.removePlayer);
  const updateHeartbeat = useStore(state => state.updateHeartbeat);

  useEffect(() => {
    if (!currentUser.id) return;
    const interval = setInterval(() => { updateHeartbeat(); }, 5000);
    const playerSubscription = supabase.channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        if (payload.eventType === 'DELETE') { removePlayer((payload.old as Player).id); }
        else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') { updatePlayer(payload.new as Player); }
      }).subscribe();
    const artworkSubscription = supabase.channel('public:artworks')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'artworks' }, (payload) => {
        useStore.getState().updateArtwork(payload.new as any);
      }).subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(playerSubscription);
      supabase.removeChannel(artworkSubscription);
      supabase.from('players').delete().eq('id', currentUser.id).then();
    };
  }, [currentUser.id, updatePlayer, removePlayer, updateHeartbeat]);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <Gallery3D />
      <UI />
    </div>
  );
}
export default App;
