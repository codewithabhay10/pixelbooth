import { useEffect, useState } from 'react';
import { socket } from './lib/socket';
import { FilmGrain } from './components/FilmGrain';
import { Lobby } from './components/Lobby';
import { Waiting } from './components/Waiting';
import { Booth } from './components/Booth';

type Screen = 'lobby' | 'waiting' | 'booth';

export default function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [code, setCode] = useState('');
  const [polite, setPolite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerLeft, setPartnerLeft] = useState(false);

  // Prefill the join code if someone opened a shared /?code=ABCDE link.
  const initialCode = new URLSearchParams(window.location.search).get('code')?.toUpperCase() ?? '';

  useEffect(() => {
    const onPartnerJoined = () => {
      setPartnerLeft(false);
      setScreen('booth');
    };
    const onPartnerLeft = () => setPartnerLeft(true);
    socket.on('partner-joined', onPartnerJoined);
    socket.on('partner-left', onPartnerLeft);
    return () => {
      socket.off('partner-joined', onPartnerJoined);
      socket.off('partner-left', onPartnerLeft);
    };
  }, []);

  const handleCreate = () => {
    setError(null);
    socket.emit('create', (res: { ok: boolean; code: string; polite: boolean }) => {
      if (res?.ok) {
        setCode(res.code);
        setPolite(res.polite);
        setScreen('waiting');
      }
    });
  };

  const handleJoin = (input: string) => {
    const c = input.toUpperCase().trim();
    if (c.length < 5) {
      setError('Enter the 5-letter room code.');
      return;
    }
    setError(null);
    socket.emit('join', { code: c }, (res: { ok: boolean; polite?: boolean; error?: string }) => {
      if (res?.ok) {
        setCode(c);
        setPolite(res.polite ?? false);
        // Wait for the server's partner-joined broadcast to enter the booth.
      } else {
        setError(res?.error || 'Could not join that room.');
      }
    });
  };

  const leave = () => {
    socket.emit('leave');
    setScreen('lobby');
    setCode('');
    setError(null);
    setPartnerLeft(false);
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-ink text-cream">
      <FilmGrain />
      <div key={screen} className="screen-enter">
        {screen === 'lobby' && (
          <Lobby initialCode={initialCode} error={error} onCreate={handleCreate} onJoin={handleJoin} />
        )}
        {screen === 'waiting' && <Waiting code={code} onCancel={leave} />}
        {screen === 'booth' && <Booth polite={polite} partnerLeft={partnerLeft} onExit={leave} />}
      </div>
    </div>
  );
}
