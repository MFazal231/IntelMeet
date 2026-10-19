import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Users,
  Sparkles,
  Copy,
  Check,
  Send,
  Radio,
  FileText,
  Volume2,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  Subtitles,
  ListTodo,
  Plus,
  Clock,
  CheckCircle2,
  Camera,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getSocket } from '../services/socket.js';
import api from '../services/api.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * Creates an animated synthetic webcam stream via HTML5 Canvas
 * Guarantees video is ALWAYS visible even if real camera is missing, blocked, or in use
 */
function createVirtualWebcamStream(userName = 'You') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  let animId = null;

  const draw = () => {
    frame++;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    // Dynamic grid overlay
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Outer audio pulse wave
    const wave = Math.sin(frame * 0.08) * 12;
    ctx.beginPath();
    ctx.arc(320, 190, 75 + wave, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(320, 190, 68 + wave * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.25)';
    ctx.fill();

    // Central Avatar circle
    ctx.beginPath();
    ctx.arc(320, 190, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#7c3aed';
    ctx.fill();

    // User Initial
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((userName[0] || 'U').toUpperCase(), 320, 190);

    // Name label
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(userName, 320, 290);

    // Live studio indicator
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('● LIVE WEBCAM FEED', 320, 320);

    // Live timer
    ctx.font = '12px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(new Date().toLocaleTimeString(), 320, 350);

    animId = requestAnimationFrame(draw);
  };

  draw();

  const stream = canvas.captureStream(30);

  // Attach a silent audio track so WebRTC offers have both audio & video
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const dest = audioCtx.createMediaStreamDestination();
      osc.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        stream.addTrack(audioTrack);
      }
    }
  } catch (e) {
    // ignore
  }

  return { stream, stop: () => cancelAnimationFrame(animId) };
}

/**
 * Dedicated Video Stream Player
 * Guarantees proper srcObject binding, playsInline, style isolation, and autoplay
 */
function StreamVideoPlayer({ stream, isMuted = false, isMirror = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.muted = isMuted;

    const playVideo = async () => {
      try {
        await el.play();
      } catch (err) {
        if (!isMuted) {
          console.warn('Video autoplay waiting for interaction:', err.message);
        }
      }
    };

    playVideo();
  }, [stream, isMuted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      onLoadedMetadata={(e) => {
        e.currentTarget.play().catch(() => {});
      }}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '280px',
        objectFit: 'cover',
        display: 'block',
        transform: isMirror ? 'scaleX(-1)' : 'none',
        backgroundColor: '#020617',
      }}
    />
  );
}

export default function MeetingRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Media States
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);
  const [isVirtualCam, setIsVirtualCam] = useState(false);
  const [mediaInfoMessage, setMediaInfoMessage] = useState('');

  // UI Panels
  const [activePanel, setActivePanel] = useState('chat'); // 'chat' | 'participants' | 'ai-notes' | null
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [taskSyncToast, setTaskSyncToast] = useState('');

  // Realtime Data
  const [participants, setParticipants] = useState([]);
  const [peerMediaState, setPeerMediaState] = useState({}); // socketId -> { isAudioMuted, isVideoOff }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Live Captions & Transcripts
  const [liveCaption, setLiveCaption] = useState(null); // { speaker: string, text: string }
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState(
    'Meeting agenda: Review architecture, align on deliverables, and identify action items.'
  );

  // AI & Action Items
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [syncedTasksMap, setSyncedTasksMap] = useState({});

  // WebRTC & Media Refs
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const virtualCamStopRef = useRef(null);
  const [localStreamState, setLocalStreamState] = useState(null);
  const peerConnections = useRef(new Map()); // socketId -> RTCPeerConnection
  const pendingIceCandidates = useRef(new Map()); // socketId -> candidate[]
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // socketId -> MediaStream
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);

  // Format Duration Timer
  const formattedTime = useMemo(() => {
    const mins = Math.floor(meetingSeconds / 60);
    const secs = meetingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [meetingSeconds]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to start virtual camera
  const startVirtualCamera = useCallback(() => {
    if (virtualCamStopRef.current) {
      virtualCamStopRef.current();
    }
    const { stream, stop } = createVirtualWebcamStream(user?.name || 'You');
    virtualCamStopRef.current = stop;
    localStreamRef.current = stream;
    setLocalStreamState(stream);
    setIsVirtualCam(true);
    setIsVideoOff(false);
    setMediaInfoMessage('Virtual Studio Camera active (30 FPS)');

    // Attach to active peer connections
    peerConnections.current.forEach((pc) => {
      const videoTrack = stream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      } else if (videoTrack) {
        pc.addTrack(videoTrack, stream);
      }
    });
  }, [user]);

  // Request Hardware Camera & Microphone
  const acquireHardwareMedia = useCallback(async () => {
    // 1. Try with standard constraints (no mobile facingMode constraints that fail on desktop)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (err1) {
      console.warn('getUserMedia (video+audio) failed, trying video only:', err1.name, err1.message);
    }

    // 2. Try video only if mic has conflict
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      return stream;
    } catch (err2) {
      console.warn('getUserMedia (video only) failed:', err2.name, err2.message);
    }

    return null;
  }, []);

  // 1. Initialize Media on Component Mount
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      const hardwareStream = await acquireHardwareMedia();

      if (!isMounted) {
        hardwareStream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (hardwareStream) {
        localStreamRef.current = hardwareStream;
        setLocalStreamState(hardwareStream);
        setIsVirtualCam(false);
        setIsVideoOff(false);
        setMediaInfoMessage('');

        // Attach tracks to any existing peer connections
        peerConnections.current.forEach((pc) => {
          hardwareStream.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            const exists = senders.some((s) => s.track?.kind === track.kind);
            if (!exists) {
              pc.addTrack(track, hardwareStream);
            }
          });
        });
      } else {
        // Fallback gracefully to high-quality synthetic virtual camera
        console.warn('Physical camera unavailable. Activating Virtual Camera.');
        startVirtualCamera();
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (virtualCamStopRef.current) {
        virtualCamStopRef.current();
      }
    };
  }, [acquireHardwareMedia, startVirtualCamera]);

  // 2. Web Speech API for Live Captions
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const speaker = user?.name || 'You';
          const finalSentence = part.trim();

          socketRef.current?.emit('transcript-segment', {
            roomId,
            text: finalSentence,
            isFinal: true,
          });

          setMeetingNotes((prev) => `${prev}\n[${speaker}]: ${finalSentence}`);
          setTranscriptHistory((prev) => [
            ...prev,
            { speaker, text: finalSentence, time: new Date().toLocaleTimeString() },
          ]);

          setLiveCaption({ speaker, text: finalSentence });
          setTimeout(() => setLiveCaption(null), 4000);
        } else {
          interim += part;
        }
      }

      if (interim) {
        setLiveCaption({ speaker: user?.name || 'You', text: interim });
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
    };

    recognition.onend = () => {
      if (isCaptionsEnabled && !isAudioMuted) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    if (isCaptionsEnabled && !isAudioMuted) {
      try {
        recognition.start();
      } catch (e) {}
    }

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isCaptionsEnabled, isAudioMuted, roomId, user]);

  // 3. Perfect WebRTC Signaling & Connection Management
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const userName = user?.name || 'Guest User';
    const userId = user?.id || `usr-${Date.now()}`;

    socket.emit('join-room', {
      roomId: roomId || 'general',
      userName,
      userId,
    });

    // When joining, receive existing participants
    // Newly joined peer sets up passive connection (waiting for offer from existing peer)
    socket.on('room-state', ({ participants: remoteList }) => {
      setParticipants(remoteList || []);

      remoteList?.forEach((peer) => {
        if (peer.socketId !== socket.id && !peerConnections.current.has(peer.socketId)) {
          setupPeerConnection(peer.socketId, false);
        }
      });
    });

    // When a NEW peer joins:
    // Existing peer acts as initiator and creates offer
    socket.on('participant-joined', async ({ socketId: newPeerSocketId, userName: peerName }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newPeerSocketId)) return prev;
        return [...prev, { socketId: newPeerSocketId, userName: peerName }];
      });

      const pc = setupPeerConnection(newPeerSocketId, true);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('peer-offer', {
          roomId,
          offer,
          targetSocketId: newPeerSocketId,
        });
      } catch (err) {
        console.error('Failed to create offer for new peer:', err);
      }
    });

    // Handle Peer Offer
    socket.on('peer-offer', async ({ offer, senderSocketId }) => {
      const pc = setupPeerConnection(senderSocketId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        flushPendingIceCandidates(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('peer-answer', {
          roomId,
          answer,
          targetSocketId: senderSocketId,
        });
      } catch (err) {
        console.error('Failed to handle peer offer:', err);
      }
    });

    // Handle Peer Answer
    socket.on('peer-answer', async ({ answer, senderSocketId }) => {
      const pc = peerConnections.current.get(senderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          flushPendingIceCandidates(senderSocketId, pc);
        } catch (err) {
          console.error('Failed to set remote answer:', err);
        }
      }
    });

    // Handle ICE Candidates
    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      const pc = peerConnections.current.get(senderSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ice candidate:', err);
        }
      } else {
        if (!pendingIceCandidates.current.has(senderSocketId)) {
          pendingIceCandidates.current.set(senderSocketId, []);
        }
        pendingIceCandidates.current.get(senderSocketId).push(candidate);
      }
    });

    // Remote media state updates
    socket.on('peer-media-toggle', ({ senderSocketId, type, enabled }) => {
      setPeerMediaState((prev) => ({
        ...prev,
        [senderSocketId]: {
          ...prev[senderSocketId],
          [type === 'audio' ? 'isAudioMuted' : 'isVideoOff']: !enabled,
        },
      }));
    });

    // Handle Participant Leave
    socket.on('participant-left', ({ socketId }) => {
      if (peerConnections.current.has(socketId)) {
        peerConnections.current.get(socketId).close();
        peerConnections.current.delete(socketId);
      }
      pendingIceCandidates.current.delete(socketId);

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });

      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      setPeerMediaState((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    // Chat and Transcripts
    socket.on('new-message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (activePanel !== 'chat') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on('transcript-segment', ({ userName: speaker, text }) => {
      setLiveCaption({ speaker, text });
      setTimeout(() => setLiveCaption(null), 4000);
      setTranscriptHistory((prev) => [
        ...prev,
        { speaker, text, time: new Date().toLocaleTimeString() },
      ]);
      setMeetingNotes((prev) => `${prev}\n[${speaker}]: ${text}`);
    });

    function setupPeerConnection(peerSocketId, isInitiator) {
      if (peerConnections.current.has(peerSocketId)) {
        return peerConnections.current.get(peerSocketId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(peerSocketId, pc);

      const currentStream = screenStreamRef.current || localStreamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          pc.addTrack(track, currentStream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            roomId,
            candidate: event.candidate,
            targetSocketId: peerSocketId,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          let stream = next.get(peerSocketId);

          if (!stream) {
            stream = event.streams?.[0] || new MediaStream([event.track]);
          } else {
            const exists = stream.getTracks().some((t) => t.id === event.track.id);
            if (!exists) {
              stream.addTrack(event.track);
            }
          }

          next.set(peerSocketId, stream);
          return next;
        });
      };

      return pc;
    }

    function flushPendingIceCandidates(peerSocketId, pc) {
      const candidates = pendingIceCandidates.current.get(peerSocketId);
      if (candidates && candidates.length) {
        candidates.forEach((cand) => {
          pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        });
        pendingIceCandidates.current.delete(peerSocketId);
      }
    }

    return () => {
      socket.emit('leave-room', { roomId, userName });
      socket.off('room-state');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('peer-offer');
      socket.off('peer-answer');
      socket.off('ice-candidate');
      socket.off('peer-media-toggle');
      socket.off('new-message');
      socket.off('transcript-segment');

      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      pendingIceCandidates.current.clear();
    };
  }, [roomId, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsAudioMuted(newMuted);

        socketRef.current?.emit('media-toggle', {
          roomId,
          type: 'audio',
          enabled: audioTrack.enabled,
        });

        if (newMuted && recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        } else if (!newMuted && isCaptionsEnabled && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }
    }
  };

  // Toggle Video (Camera On / Off or Retry Hardware)
  const toggleVideo = async () => {
    // If user was in virtual camera mode and wants to try physical hardware camera:
    if (isVirtualCam) {
      const hardwareStream = await acquireHardwareMedia();
      if (hardwareStream) {
        if (virtualCamStopRef.current) virtualCamStopRef.current();
        localStreamRef.current = hardwareStream;
        setLocalStreamState(hardwareStream);
        setIsVirtualCam(false);
        setIsVideoOff(false);
        setMediaInfoMessage('Switched to physical hardware camera');

        peerConnections.current.forEach((pc) => {
          const videoTrack = hardwareStream.getVideoTracks()[0];
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
        return;
      }
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newOff = !videoTrack.enabled;
        setIsVideoOff(newOff);

        socketRef.current?.emit('media-toggle', {
          roomId,
          type: 'video',
          enabled: videoTrack.enabled,
        });
      } else {
        startVirtualCamera();
      }
    } else {
      startVirtualCamera();
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
      });

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  };

  // Chat message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      roomId,
      message: chatInput.trim(),
      userName: user?.name || 'Guest User',
    });

    setChatInput('');
  };

  // Copy Invite link
  const copyInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Leave meeting
  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (virtualCamStopRef.current) {
      virtualCamStopRef.current();
    }
    socketRef.current?.emit('leave-room', {
      roomId,
      userName: user?.name || 'Guest User',
    });
    navigate('/dashboard');
  };

  // Run AI Summary
  const runLiveAiSummary = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await api.post('/ai/summarize', {
        title: `Room: ${roomId}`,
        transcript: meetingNotes,
      });
      setAiSummary(res.data);
    } catch (err) {
      console.error('AI summary failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Sync action items to task board
  const syncActionItemsToTasks = async () => {
    if (!aiSummary?.actionItems?.length) return;

    setIsSyncingTasks(true);
    try {
      const tasksToSync = aiSummary.actionItems.map((item) => ({
        title: typeof item === 'string' ? item : item.title,
        priority: item.priority || 'Medium',
        owner: item.owner || user?.name || 'Unassigned',
        status: 'To Do',
      }));

      await api.post('/tasks/bulk', { tasks: tasksToSync });

      const newSyncedMap = { ...syncedTasksMap };
      tasksToSync.forEach((_, idx) => {
        newSyncedMap[idx] = true;
      });
      setSyncedTasksMap(newSyncedMap);

      setTaskSyncToast(`Created ${tasksToSync.length} action items in your Tasks board!`);
      setTimeout(() => setTaskSyncToast(''), 4000);
    } catch (err) {
      console.error('Failed to sync tasks:', err);
      setTaskSyncToast('Failed to sync tasks.');
      setTimeout(() => setTaskSyncToast(''), 4000);
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const syncSingleTask = async (item, index) => {
    try {
      await api.post('/tasks', {
        title: typeof item === 'string' ? item : item.title,
        priority: item.priority || 'Medium',
        owner: item.owner || user?.name || 'Unassigned',
      });
      setSyncedTasksMap((prev) => ({ ...prev, [index]: true }));
      setTaskSyncToast('Task saved to board!');
      setTimeout(() => setTaskSyncToast(''), 3000);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const otherPeers = useMemo(() => {
    return participants.filter((p) => p.socketId !== socketRef.current?.id);
  }, [participants]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-6 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
            <Radio className="h-5 w-5 animate-pulse text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Room: <span className="text-violet-300 font-mono">{roomId}</span>
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live ({participants.length || 1})
              </span>
            </div>
            <p className="text-xs text-slate-400">Duration: {formattedTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {taskSyncToast && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{taskSyncToast}</span>
            </div>
          )}

          <button
            onClick={copyInvite}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:border-slate-600"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Link!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Invite Link
              </>
            )}
          </button>
        </div>
      </header>

      {/* Virtual Cam / Info Banner */}
      {mediaInfoMessage && (
        <div className="flex items-center justify-between bg-violet-950/40 border-b border-violet-500/30 px-6 py-2 text-xs text-violet-300">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 shrink-0 text-violet-400" />
            <span>{mediaInfoMessage}</span>
          </div>
          {isVirtualCam && (
            <button
              onClick={toggleVideo}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 px-2.5 py-1 text-[11px] font-medium text-violet-200 border border-violet-500/30 transition"
            >
              <RefreshCw className="h-3 w-3" />
              Try Physical Camera
            </button>
          )}
        </div>
      )}

      {/* 2. Main Stage Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center relative">
          <div
            className={`grid h-full w-full gap-4 items-center justify-center max-w-6xl auto-rows-fr ${
              otherPeers.length === 0
                ? 'grid-cols-1 md:grid-cols-2'
                : otherPeers.length === 1
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {/* Local Video Card */}
            <div className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
              {/* Active Video Player - ALWAYS renders feed */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: isVideoOff ? 'none' : 'block',
                }}
              >
                <StreamVideoPlayer
                  stream={isScreenSharing ? screenStreamRef.current : localStreamState}
                  isMuted={true}
                  isMirror={!isScreenSharing && !isVirtualCam}
                />
              </div>

              {/* Camera Off Avatar Placeholder */}
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-3xl font-bold text-white shadow-xl">
                    {user?.name?.[0] || 'Y'}
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                      <VideoOff className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-300">{user?.name || 'You'}</p>
                  <p className="text-xs text-slate-500">Camera is off</p>
                </div>
              )}

              {/* Card Footer Badge */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-slate-950/75 px-3 py-1.5 backdrop-blur border border-slate-800/60 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {user?.name || 'You'} (You)
                  </span>
                  {isVirtualCam && !isScreenSharing && (
                    <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300 font-medium border border-violet-500/30">
                      Studio Feed
                    </span>
                  )}
                  {isScreenSharing && (
                    <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300 font-medium">
                      Presenting
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isAudioMuted ? (
                    <span className="rounded-full bg-rose-500/20 p-1 text-rose-400" title="Microphone muted">
                      <MicOff className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400" title="Microphone active">
                      <Mic className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remote Participants */}
            {otherPeers.map((peer) => {
              const stream = remoteStreams.get(peer.socketId);
              const peerMedia = peerMediaState[peer.socketId] || {};
              const isPeerVideoOff = peerMedia.isVideoOff;
              const isPeerAudioMuted = peerMedia.isAudioMuted;

              return (
                <div
                  key={peer.socketId}
                  className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl"
                >
                  {stream && !isPeerVideoOff ? (
                    <StreamVideoPlayer
                      stream={stream}
                      isMuted={false}
                      isMirror={false}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 text-3xl font-bold text-white shadow-xl">
                        {peer.userName?.[0] || 'P'}
                        {isPeerVideoOff && (
                          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                            <VideoOff className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-300">
                        {peer.userName || 'Participant'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isPeerVideoOff ? 'Camera is off' : 'Connected'}
                      </p>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-slate-950/75 px-3 py-1.5 backdrop-blur border border-slate-800/60 z-10">
                    <span className="text-xs font-semibold text-slate-200">
                      {peer.userName || 'Peer'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isPeerAudioMuted ? (
                        <span className="rounded-full bg-rose-500/20 p-1 text-rose-400" title="Muted">
                          <MicOff className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 p-1 text-emerald-400">
                          <Volume2 className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Waiting for teammates state */}
            {otherPeers.length === 0 && (
              <div className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-base font-medium text-slate-300">Waiting for teammates...</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Open another browser tab or share the room link to test multi-participant video and audio.
                </p>
                <button
                  onClick={copyInvite}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-3.5 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-600/30 transition"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy invite link
                </button>
              </div>
            )}
          </div>

          {/* LIVE CAPTIONS FLOATING OVERLAY */}
          {isCaptionsEnabled && liveCaption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-xl rounded-2xl bg-slate-950/85 px-4 py-2.5 backdrop-blur border border-slate-700/80 shadow-2xl transition-all animate-fade-in text-center">
              <p className="text-[11px] font-semibold text-violet-400 tracking-wide">
                {liveCaption.speaker}:
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-100 leading-relaxed">
                "{liveCaption.text}"
              </p>
            </div>
          )}
        </div>

        {/* 3. Collapsible Side Panel (Chat / Participants / AI Notes & Tasks) */}
        {activePanel && (
          <aside className="w-88 border-l border-slate-800 bg-slate-900/95 flex flex-col backdrop-blur-md transition-all duration-300 z-10">
            {/* Panel Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setActivePanel('chat');
                    setUnreadCount(0);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activePanel === 'chat'
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
                <button
                  onClick={() => setActivePanel('participants')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activePanel === 'participants'
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  People ({participants.length})
                </button>
                <button
                  onClick={() => setActivePanel('ai-notes')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    activePanel === 'ai-notes'
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI & Tasks
                </button>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* TAB CONTENT: Chat */}
            {activePanel === 'chat' && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 text-xs">
                      <MessageSquare className="h-8 w-8 text-slate-700 mb-2" />
                      <p>No messages yet.</p>
                      <p>Say hello to everyone in the room!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.author === (user?.name || 'Guest User');
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                            <span className="font-semibold">{msg.author}</span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-violet-600 text-white rounded-tr-sm'
                                : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="rounded-lg bg-violet-600 p-1.5 text-white transition hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Participants */}
            {activePanel === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      {user?.name?.[0] || 'Y'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {user?.name || 'You'} <span className="text-violet-400 font-normal">(Host)</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAudioMuted ? (
                      <MicOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {isVideoOff ? (
                      <VideoOff className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {otherPeers.map((peer) => {
                  const media = peerMediaState[peer.socketId] || {};
                  return (
                    <div
                      key={peer.socketId}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {peer.userName?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{peer.userName || 'Peer'}</p>
                          <p className="text-[10px] text-slate-400">Guest</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {media.isAudioMuted ? (
                          <MicOff className="h-3.5 w-3.5 text-rose-400" />
                        ) : (
                          <Mic className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        {media.isVideoOff ? (
                          <VideoOff className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <Video className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: AI Notes & Smart Action Items */}
            {activePanel === 'ai-notes' && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300">Live Transcript & Discussion</label>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Capturing
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Discussion points and live transcript appear here..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 outline-none focus:border-violet-500 placeholder:text-slate-600"
                  />
                  <button
                    onClick={runLiveAiSummary}
                    disabled={isGeneratingAi || !meetingNotes.trim()}
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 shadow-md shadow-violet-600/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isGeneratingAi ? 'Extracting Insights & Tasks...' : 'Summarize & Extract Action Items'}
                  </button>
                </div>

                {/* AI Summary and Action Items Result */}
                {aiSummary && (
                  <div className="space-y-3.5 rounded-2xl border border-violet-500/30 bg-violet-950/20 p-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                        Executive Summary
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed">{aiSummary.summary}</p>
                    </div>

                    {aiSummary.decisions?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Key Decisions:</p>
                        <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {aiSummary.decisions.map((d, i) => (
                            <li key={i}>{typeof d === 'string' ? d : d.title || d}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted Action Items */}
                    {aiSummary.actionItems?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                            <ListTodo className="h-3.5 w-3.5 text-violet-400" />
                            Extracted Action Items ({aiSummary.actionItems.length})
                          </p>
                          <button
                            onClick={syncActionItemsToTasks}
                            disabled={isSyncingTasks}
                            className="rounded-lg bg-violet-600/30 border border-violet-500/40 px-2 py-1 text-[10px] font-medium text-violet-200 hover:bg-violet-600/50 transition flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            {isSyncingTasks ? 'Syncing...' : 'Sync All to Board'}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {aiSummary.actionItems.map((item, idx) => {
                            const isSynced = syncedTasksMap[idx];
                            const itemTitle = typeof item === 'string' ? item : item.title;
                            const priority = item.priority || 'Medium';
                            const owner = item.owner || 'Unassigned';

                            return (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-2.5"
                              >
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-slate-100">{itemTitle}</p>
                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                    <span
                                      className={`rounded px-1.5 py-0.5 font-semibold ${
                                        priority === 'High'
                                          ? 'bg-rose-500/20 text-rose-300'
                                          : priority === 'Medium'
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : 'bg-slate-700 text-slate-300'
                                      }`}
                                    >
                                      {priority}
                                    </span>
                                    <span>•</span>
                                    <span>{owner}</span>
                                    {item.deadline && (
                                      <>
                                        <span>•</span>
                                        <span>{item.deadline}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => syncSingleTask(item, idx)}
                                  disabled={isSynced}
                                  className={`rounded-lg p-1.5 transition ${
                                    isSynced
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-slate-400 hover:text-violet-300 hover:bg-slate-800'
                                  }`}
                                  title={isSynced ? 'Synced to board' : 'Add to tasks'}
                                >
                                  {isSynced ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 4. Bottom Floating Dock Controls */}
      <footer className="flex h-20 shrink-0 items-center justify-between border-t border-slate-800/80 bg-slate-900/95 px-6 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            IntellMeet Live
          </div>
        </div>

        {/* Center Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mic */}
          <button
            onClick={toggleAudio}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 shadow-md ${
              isAudioMuted
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
                : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 shadow-md ${
              isVideoOff
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
                : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 shadow-md ${
              isScreenSharing
                ? 'bg-violet-600 text-white shadow-violet-500/30'
                : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <MonitorUp className="h-5 w-5" />
          </button>

          {/* Closed Captions / Live Transcription */}
          <button
            onClick={() => setIsCaptionsEnabled((prev) => !prev)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 shadow-md ${
              isCaptionsEnabled
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isCaptionsEnabled ? 'Turn Off Captions (CC)' : 'Turn On Live Captions (CC)'}
          >
            <Subtitles className="h-5 w-5" />
          </button>

          {/* End Call */}
          <button
            onClick={leaveMeeting}
            className="flex h-12 items-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95"
            title="Leave Meeting"
          >
            <PhoneOff className="h-5 w-5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Right Toggle Buttons */}
        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <button
            onClick={() => {
              setActivePanel((prev) => (prev === 'chat' ? null : 'chat'));
              setUnreadCount(0);
            }}
            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
              activePanel === 'chat'
                ? 'border-violet-500/50 bg-violet-600/20 text-violet-300'
                : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* People Toggle */}
          <button
            onClick={() => setActivePanel((prev) => (prev === 'participants' ? null : 'participants'))}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
              activePanel === 'participants'
                ? 'border-violet-500/50 bg-violet-600/20 text-violet-300'
                : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Participants"
          >
            <Users className="h-5 w-5" />
          </button>

          {/* AI Notes & Tasks Toggle */}
          <button
            onClick={() => setActivePanel((prev) => (prev === 'ai-notes' ? null : 'ai-notes'))}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
              activePanel === 'ai-notes'
                ? 'border-violet-500/50 bg-violet-600/20 text-violet-300'
                : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="AI Recap & Action Items"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
