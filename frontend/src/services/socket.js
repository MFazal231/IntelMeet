import { io } from 'socket.io-client';

const defaultSocketUrl =
  import.meta.env.MODE === 'production'
    ? 'https://intellmeet-ai-powered-enterprise-meeting-h6bn.onrender.com'
    : 'http://localhost:5001';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

export default getSocket;
