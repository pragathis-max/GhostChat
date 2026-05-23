import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { Message, User, Settings, RoomInfo } from "./types";
import { ParticleBackground } from "./components/ParticleBackground";
import { LandingPage } from "./components/LandingPage";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { playNotificationSound, playJoinSound, playMessageSentSound, playSoundcast } from "./utils/audio";

export default function App() {
  const [hasJoined, setHasJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingRegistry, setTypingRegistry] = useState<Record<string, { username: string; active: boolean }>>({});
  const [totalUsersOnline, setTotalUsersOnline] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [activeSoundcast, setActiveSoundcast] = useState<{
    id: string;
    username: string;
    avatar: string;
    color: string;
    soundType: string;
  } | null>(null);

  // Default Settings with localStorage cache
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("ghostchat_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage reading error, falling back to default.", e);
    }
    return {
      darkMode: true,
      notificationsEnabled: true,
      soundEnabled: true,
    };
  });

  const socketRef = useRef<Socket | null>(null);

  // Sync settings theme to LocalStorage and documents
  useEffect(() => {
    try {
      localStorage.setItem("ghostchat_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("Saving settings failed:", e);
    }
  }, [settings]);

  useEffect(() => {
    if (!activeSoundcast) return;
    const t = setTimeout(() => {
      setActiveSoundcast(null);
    }, 2800);
    return () => clearTimeout(t);
  }, [activeSoundcast]);

  // Synchronize dynamic system stats via HTTP polling (on landing screen)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          // Fallback to at least 1 online user representing current visitor
          setTotalUsersOnline(data.totalUsersOnline || 1);
        }
      } catch (err) {
        // Soft error, no disruption to user
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [hasJoined]);

  // Initialize socket connections on-demand for dynamic join actions
  const initializeSocket = () => {
    if (socketRef.current?.connected) return socketRef.current;

    // Disconnect existing if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket: Socket = io({
      transports: ["polling", "websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Handle real-time incoming packets
    socket.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);

      // Sound notification acoustics based on context
      if (settings.soundEnabled) {
        if (msg.isSystem) {
          playJoinSound();
        } else if (msg.userId === socket.id) {
          playMessageSentSound();
        } else {
          playNotificationSound();
        }
      }
    });

    socket.on("room-users", (users: User[]) => {
      setActiveUsers(users);
    });

    socket.on("message-updated", (data: { messageId: string; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    socket.on("user-typing", (data: { id: string; username: string; isTyping: boolean }) => {
      setTypingRegistry((prev) => ({
        ...prev,
        [data.id]: {
          username: data.username,
          active: data.isTyping,
        },
      }));
    });

    socket.on("global-stats", (data: { totalUsers: number }) => {
      setTotalUsersOnline(data.totalUsers || 1);
    });

    socket.on("soundcast-received", (data: { id: string; userId: string; username: string; avatar: string; color: string; soundType: string }) => {
      if (settings.soundEnabled) {
        playSoundcast(data.soundType);
      }
      setActiveSoundcast(data);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setGlobalError("");
    });

    socket.on("connect_error", (err) => {
      console.error("Connection Error:", err);
      setGlobalError("Connection disrupted. Attempting to ghost back in...");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return socket;
  };

  const handleJoinRandom = () => {
    setLoading(true);
    setGlobalError("");
    const socket = initializeSocket();

    socket.emit("join-random", (response: {
      success: boolean;
      user?: User;
      room?: RoomInfo;
      history?: Message[];
      error?: string;
    }) => {
      setLoading(false);
      if (response && response.success && response.user && response.room) {
        setCurrentUser(response.user);
        setCurrentRoom(response.room);
        setMessages(response.history || []);
        setHasJoined(true);
        if (settings.soundEnabled) {
          playJoinSound();
        }
      } else {
        setGlobalError(response.error || "Failed to enter void.");
      }
    });
  };

  const handleJoinCustom = (chamberName: string) => {
    setLoading(true);
    setGlobalError("");
    const socket = initializeSocket();

    socket.emit("join-custom", chamberName, (response: {
      success: boolean;
      user?: User;
      room?: RoomInfo;
      history?: Message[];
      error?: string;
    }) => {
      setLoading(false);
      if (response && response.success && response.user && response.room) {
        setCurrentUser(response.user);
        setCurrentRoom(response.room);
        setMessages(response.history || []);
        setHasJoined(true);
        if (settings.soundEnabled) {
          playJoinSound();
        }
      } else {
        setGlobalError(response.error || "Chamber failed to manifest.");
      }
    });
  };

  const handleSendMessage = (text: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("send-message", text, (res: { success: boolean }) => {
      if (!res.success) {
        console.warn("Message dropped by the void.");
      }
    });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("toggle-reaction", { messageId, emoji });
  };

  const handleSendSoundcast = (soundType: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("soundcast", soundType);
  };

  const handleChangeStatus = (status: string) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("change-status", status, (response: { success: boolean; status?: string }) => {
      if (response.success && response.status !== undefined) {
        setCurrentUser((prev) => prev ? { ...prev, status: response.status } : null);
      }
    });
  };

  const handleSendTypingState = (isTyping: boolean) => {
    if (!socketRef.current || !socketRef.current.connected) return;
    socketRef.current.emit("typing", isTyping);
  };

  const handleChangeUsername = (newName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        resolve(false);
        return;
      }

      socketRef.current.emit("change-username", newName, (response: { success: boolean; username?: string }) => {
        if (response.success && response.username) {
          setCurrentUser((prev) => prev ? { ...prev, username: response.username! } : null);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Reset client state instantly (ephemeral cleanup)
    setHasJoined(false);
    setCurrentUser(null);
    setCurrentRoom(null);
    setActiveUsers([]);
    setMessages([]);
    setTypingRegistry({});
    setMobileSidebarOpen(false);
  };

  const handleUpdateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Extract list of currently typing usernames
  const typingUsernames = Object.keys(typingRegistry)
    .filter((socketId) => socketId !== currentUser?.id && typingRegistry[socketId]?.active)
    .map((socketId) => typingRegistry[socketId].username);

  return (
    <div className={`min-h-screen relative flex flex-col transition-colors duration-300 font-sans ${
      settings.darkMode ? "bg-[#050507] text-slate-200" : "bg-slate-50 text-slate-800"
    }`}>
      {/* Dynamic background canvas connected nodes */}
      <ParticleBackground darkMode={settings.darkMode} />

      {/* Main Container Layer */}
      <div className="flex-grow flex flex-col z-10 w-full max-w-7xl mx-auto xl:px-4 xl:py-6 h-screen overflow-hidden">
        
        {globalError && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs text-center flex items-center justify-center gap-2 z-50 animate-bounce-slow">
            <span>⚠️ {globalError}</span>
            <button 
              onClick={() => setGlobalError("")}
              className="hover:text-white font-bold ml-2 underline outline-none"
            >
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!hasJoined ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex-grow flex flex-col justify-center"
            >
              <LandingPage
                onJoinRandom={handleJoinRandom}
                onJoinCustom={handleJoinCustom}
                darkMode={settings.darkMode}
                totalUsersOnline={totalUsersOnline}
                loading={loading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className={`flex-grow flex rounded-none xl:rounded-3xl border shadow-2xl h-full overflow-hidden ${
                settings.darkMode 
                  ? "bg-[#0a0a0f]/85 border-white/5 backdrop-blur-2xl" 
                  : "bg-white/80 border-slate-200 shadow-sm"
              }`}
            >
              {/* Sidebar with connected status and settings */}
              <Sidebar
                roomName={currentRoom?.name || "Chamber"}
                activeUsers={activeUsers}
                currentUser={currentUser}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onChangeUsername={handleChangeUsername}
                onChangeStatus={handleChangeStatus}
                onLeaveRoom={handleLeaveRoom}
                darkMode={settings.darkMode}
                isOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
              />

              {/* Chat Stream View */}
              <ChatArea
                messages={messages}
                currentUser={currentUser}
                activeUsers={activeUsers}
                typingUsers={typingUsernames}
                onSendMessage={handleSendMessage}
                onSendTypingState={handleSendTypingState}
                onToggleReaction={handleToggleReaction}
                onSendSoundcast={handleSendSoundcast}
                onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                darkMode={settings.darkMode}
                roomName={currentRoom?.name || "Chamber"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spooky Soundcaster Floating Notification */}
        <AnimatePresence>
          {activeSoundcast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed bottom-24 right-6 z-50 pointer-events-none"
            >
              <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
                settings.darkMode
                  ? "bg-[#0b0b14]/90 border-indigo-500/30 text-white shadow-indigo-500/10"
                  : "bg-white/95 border-indigo-100 text-slate-800 shadow-indigo-100"
              }`}>
                <div className="absolute inset-0 bg-indigo-500/[0.03] animate-pulse" />
                <div className="text-2xl animate-bounce">
                  {activeSoundcast.soundType === "shiver" && "👻"}
                  {activeSoundcast.soundType === "bell" && "🔔"}
                  {activeSoundcast.soundType === "flutter" && "🦇"}
                  {activeSoundcast.soundType === "theremin" && "🔮"}
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-wider text-slate-400">SPELL CASTED</p>
                  <p className="text-xs font-semibold">
                    <span style={{ color: activeSoundcast.color }}>
                      {activeSoundcast.username}
                    </span>{" "}
                    vibrated the room:
                  </p>
                  <p className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 capitalize mt-0.5">
                    {activeSoundcast.soundType === "shiver" && "Cold Shiver ❄️"}
                    {activeSoundcast.soundType === "bell" && "Doom Bell 💥"}
                    {activeSoundcast.soundType === "flutter" && "Bat Flutter 🦇"}
                    {activeSoundcast.soundType === "theremin" && "Theremin Sweep 🌌"}
                  </p>
                </div>
                {/* Visual shockwave pulse */}
                <div className="relative w-12 h-12 flex items-center justify-center opacity-60 ml-2">
                  <span className="absolute w-8 h-8 rounded-full border border-indigo-500/35 animate-ping" />
                  <span className="absolute w-12 h-12 rounded-full border border-indigo-500/20 animate-ping [animation-delay:0.3s]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
