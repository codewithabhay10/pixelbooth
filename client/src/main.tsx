import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// No StrictMode on purpose: its double-invoke of effects would double-acquire
// the camera and spin up two RTCPeerConnections in dev.
createRoot(document.getElementById('root')!).render(<App />);
