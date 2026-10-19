import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/db.js';
import registerMeetingSocket from './sockets/meetingSocket.js';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

registerMeetingSocket(io);

const start = async () => {
  await connectDatabase();
  server.listen(env.port, () => {
    console.log(`IntellMeet API running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
