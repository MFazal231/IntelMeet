import { Server } from 'socket.io';

export default function registerMeetingSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, userName }) => {
      socket.join(roomId);
      socket.to(roomId).emit('participant-joined', { userName, roomId });
      io.to(roomId).emit('room-state', { roomId, participants: Array.from(io.sockets.adapter.rooms.get(roomId)?.values?.() || []) });
    });

    socket.on('send-message', ({ roomId, message, userName }) => {
      io.to(roomId).emit('new-message', {
        id: `msg-${Date.now()}`,
        author: userName,
        content: message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('leave-room', ({ roomId, userName }) => {
      socket.leave(roomId);
      io.to(roomId).emit('participant-left', { userName, roomId });
    });

    socket.on('peer-offer', ({ roomId, offer, sender }) => {
      socket.to(roomId).emit('peer-offer', { offer, sender });
    });

    socket.on('peer-answer', ({ roomId, answer, sender }) => {
      socket.to(roomId).emit('peer-answer', { answer, sender });
    });

    socket.on('ice-candidate', ({ roomId, candidate, sender }) => {
      socket.to(roomId).emit('ice-candidate', { candidate, sender });
    });
  });
}
