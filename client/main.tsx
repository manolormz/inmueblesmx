import { createRoot } from 'react-dom/client';
import App from './App';

const el = document.getElementById('root') || document.getElementById('app-root') || document.body;
createRoot(el as HTMLElement).render(<App />);
