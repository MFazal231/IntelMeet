import { Server } from 'socket.io';

export default function registerMeetingSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, userName, userId }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName || 'Guest';
      socket.data.userId = userId || socket.id;

      // Broadcast to existing participants that a new peer joined
      socket.to(roomId).emit('participant-joined', {
        socketId: socket.id,
        userName: socket.data.userName,
        userId: socket.data.userId,
        roomId,
      });

      // Get all clients currently in the room
      const roomClients = io.sockets.adapter.rooms.get(roomId);
      const participantList = [];
      if (roomClients) {
        for (const clientId of roomClients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            participantList.push({
              socketId: clientSocket.id,
              userName: clientSocket.data.userName || 'Guest',
              userId: clientSocket.data.userId || clientSocket.id,
            });
          }
        }
      }

      io.to(roomId).emit('room-state', { roomId, participants: participantList });
    });

    socket.on('send-message', ({ roomId, message, userName }) => {
      io.to(roomId).emit('new-message', {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: userName || socket.data.userName || 'Participant',
        senderSocketId: socket.id,
        content: message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('leave-room', ({ roomId, userName }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('participant-left', {
        socketId: socket.id,
        userName: userName || socket.data.userName,
        roomId,
      });
    });

    socket.on('peer-offer', ({ roomId, offer, targetSocketId }) => {
      if (targetSocketId) {
        socket.to(targetSocketId).emit('peer-offer', {
          offer,
          senderSocketId: socket.id,
          userName: socket.data.userName,
        });
      } else {
        socket.to(roomId).emit('peer-offer', {
          offer,
          senderSocketId: socket.id,
          userName: socket.data.userName,
        });
      }
    });

    socket.on('peer-answer', ({ roomId, answer, targetSocketId }) => {
      if (targetSocketId) {
        socket.to(targetSocketId).emit('peer-answer', {
          answer,
          senderSocketId: socket.id,
        });
      } else {
        socket.to(roomId).emit('peer-answer', {
          answer,
          senderSocketId: socket.id,
        });
      }
    });

    socket.on('ice-candidate', ({ roomId, candidate, targetSocketId }) => {
      if (targetSocketId) {
        socket.to(targetSocketId).emit('ice-candidate', {
          candidate,
          senderSocketId: socket.id,
        });
      } else {
        socket.to(roomId).emit('ice-candidate', {
          candidate,
          senderSocketId: socket.id,
        });
      }
    });

    socket.on('media-toggle', ({ roomId, type, enabled }) => {
      socket.to(roomId).emit('peer-media-toggle', {
        senderSocketId: socket.id,
        userName: socket.data.userName,
        type, // 'audio' | 'video'
        enabled,
      });
    });

    socket.on('transcript-segment', ({ roomId, text, isFinal }) => {
      io.to(roomId).emit('transcript-segment', {
        id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderSocketId: socket.id,
        userName: socket.data.userName || 'Participant',
        text,
        isFinal: Boolean(isFinal),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('participant-left', {
          socketId: socket.id,
          userName: socket.data.userName,
          roomId,
        });
      }
    });
  });
}
