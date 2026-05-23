import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  // Configure Socket.io with cors
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Keep track of room state in-memory (no database files)
  interface ClientMetadata {
    id: string;
    username: string;
    color: string;
    avatar: string;
    currentRoom: string | null;
    status?: string;
  }

  interface TempRoom {
    id: string;
    name: string;
    members: Map<string, ClientMetadata>;
    messages: Array<{
      id: string;
      userId: string;
      username: string;
      text: string;
      timestamp: string;
      color: string;
      isSystem?: boolean;
      isDrawing?: boolean;
      reactions?: Array<{
        emoji: string;
        count: number;
        users: string[];
      }>;
    }>;
  }

  const rooms = new Map<string, TempRoom>();
  const socketsMetadata = new Map<string, ClientMetadata>();

  // Spooky lists for random generator
  const SPOOKY_PREFIXES = [
    "Ghost", "Shadow", "Phantom", "Specter", "Wisp", 
    "Wraith", "Goblin", "Banshee", "Ghoul", "Apparition", 
    "Shade", "Spook", "Entity", "Stalker", "Revenant", 
    "Anomaly", "Echo", "Vortex", "Siren", "Shimmer", 
    "Gloom", "Abyss", "Scythe", "Crypt", "Haunt"
  ];

  const SPOOKY_ADJECTIVES = [
    "Ancient", "Frozen", "Wailing", "Silent", "Lost", "Weeping", "Restless", "Haunted", "Shadowy", "Crimson",
    "Shimmering", "Elder", "Screaming", "Spectral", "Gloomy", "Forsaken", "Echoing", "Vortexed", "Brimstone", "Obsidian",
    "Forgotten", "Cursed", "Corrupt", "Hollow", "Chilling", "Whispering", "Grim", "Nocturnal", "Cemetery", "Dark",
    "Sorrowful", "Eerie", "Midnight", "Lunar", "Misty", "Banshee", "Undead", "Astral", "Bleeding", "Haunting",
    "Rune", "Plague", "Dread", "Rotten", "Phantom", "Screeching", "Withered", "Cryptic", "Infernal", "Occult",
    "Sinister", "Morbid", "Macabre", "Vile", "Ghastly", "Lurking", "Phantasmal", "Doomed", "Deceased", "Ethereal",
    "Grave", "Solemn", "Obscure", "Fallen", "Spooky", "Creepy", "Abyssal", "Shattered", "Agonizing", "Vengeful",
    "Mist", "Tomb", "Sacred", "Eclipsed", "Corpse", "Banished", "Unholy", "Spiteful", "Somber", "Numb"
  ];

  const SPOOKY_NOUNS = [
    "Ghost", "Shadow", "Phantom", "Specter", "Wisp", "Wraith", "Goblin", "Banshee", "Ghoul", "Apparition",
    "Shade", "Spook", "Entity", "Stalker", "Revenant", "Anomaly", "Echo", "Vortex", "Siren", "Shimmer",
    "Gloom", "Abyss", "Scythe", "Crypt", "Haunt", "Demon", "Zombie", "Skeleton", "Familiar", "Monolith",
    "Reaper", "Vampire", "Nightmare", "Poltergeist", "Necromancer", "Gargoyle", "Spirit", "Drifter", "Wanderer", "Weeper",
    "Bane", "Fiend", "Minion", "Beast", "Spectator", "Watcher", "Gazer", "Presence", "Aura", "Dread",
    "Slayer", "Horror", "Grave", "Coffin", "Skull", "Phantasm", "Stalker", "Conjurer", "Summoner", "Diviner",
    "Blight", "Scurry", "Omen", "Relic", "Howler", "Squeaker", "Crawler", "Reeve", "Vicar", "Exile"
  ];

  const SPOOKY_COLORS = [
    "#FF007F", // Neon Pink
    "#39FF14", // Neon Green
    "#00FFFF", // Neon Cyan
    "#BC13FE", // Neon Purple
    "#FFE600", // Neon Yellow
    "#00FF66", // Neon Green Glow
    "#FF3300", // Neon Orange-Red
    "#FF00FF", // Magenta Glow
    "#0099FF", // Electric Blue
  ];

  const SPOOKY_AVATARS = [
    "👻", "💀", "🕷️", "🦇", "🐈‍⬛", "🦉", "🎃", "🕯️", "👽", "👁️", "🕸️", "🔮", "🌘", "🪐"
  ];

  function getSpookyNamesInRoom(roomObj: TempRoom): string[] {
    return Array.from(roomObj.members.values()).map((m) => m.username);
  }

  function generateRandomUsername(existingNames: string[]): string {
    let attempts = 0;
    while (attempts < 100) {
      const adj = SPOOKY_ADJECTIVES[Math.floor(Math.random() * SPOOKY_ADJECTIVES.length)];
      const noun = SPOOKY_NOUNS[Math.floor(Math.random() * SPOOKY_NOUNS.length)];
      
      let name = "";
      const formatChoice = Math.random();
      if (formatChoice < 0.2) {
        // Just Adjective + Noun
        name = `${adj}${noun}`;
      } else if (formatChoice < 0.6) {
        // Adjective + Noun + 2 or 3 digit number (e.g. SilentRevenant94)
        const num = Math.floor(10 + Math.random() * 980);
        name = `${adj}${noun}${num}`;
      } else {
        // Adjective + Noun + 4 digit number (e.g. DarkGhost4812)
        const num = Math.floor(1000 + Math.random() * 9000);
        name = `${adj}${noun}${num}`;
      }

      if (!existingNames.includes(name)) {
        return name;
      }
      attempts++;
    }
    // Deep fallback with high entropy (up to 1,000,000 scale)
    return `Ghost${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // Find a suitable public room, or create one
  function getOrCreatePublicRoom(): TempRoom {
    // Look for a room with between 1 and 5 members
    for (const [id, roomObj] of rooms.entries()) {
      if (roomObj.members.size > 0 && roomObj.members.size < 6 && id.startsWith("room_")) {
        return roomObj;
      }
    }

    // Create a new room with a random spooky name
    const suffixes = ["Void", "Sanctum", "Crypt", "Rift", "Abyss", "Fringe", "Hollow", "Mist"];
    const adjective = SPOOKY_PREFIXES[Math.floor(Math.random() * SPOOKY_PREFIXES.length)];
    const noun = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const roomId = `room_${Math.random().toString(36).substring(2, 11)}`;
    const roomName = `${adjective} ${noun} #${num}`;

    const newRoom: TempRoom = {
      id: roomId,
      name: roomName,
      members: new Map(),
      messages: [],
    };

    rooms.set(roomId, newRoom);
    return newRoom;
  }

  // API Router setup (if we need server endpoints)
  app.get("/api/stats", (req, res) => {
    // Total rooms, total users
    let totalUsers = 0;
    const activeRooms: Array<{ id: string; name: string; usersCount: number }> = [];

    rooms.forEach((roomObj, id) => {
      if (roomObj.members.size > 0) {
        totalUsers += roomObj.members.size;
        activeRooms.push({
          id: roomObj.id,
          name: roomObj.name,
          usersCount: roomObj.members.size,
        });
      }
    });

    res.json({
      totalUsersOnline: totalUsers,
      activeRoomsCount: activeRooms.length,
      rooms: activeRooms,
    });
  });

  // Socket setup
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create a temporary metadata for the socket
    const color = SPOOKY_COLORS[Math.floor(Math.random() * SPOOKY_COLORS.length)];
    const avatar = SPOOKY_AVATARS[Math.floor(Math.random() * SPOOKY_AVATARS.length)];
    // Default metadata initialized without join
    const meta: ClientMetadata = {
      id: socket.id,
      username: `Phantom...`,
      color,
      avatar,
      currentRoom: null,
    };
    socketsMetadata.set(socket.id, meta);

    // Event: User wants to enter chat automatically
    socket.on("join-random", (callback) => {
      try {
        const targetRoom = getOrCreatePublicRoom();
        const existingNames = getSpookyNamesInRoom(targetRoom);
        const randUsername = generateRandomUsername(existingNames);

        // Update meta
        meta.username = randUsername;
        meta.currentRoom = targetRoom.id;
        targetRoom.members.set(socket.id, meta);

        // Join room
        socket.join(targetRoom.id);

        // Create system welcome message
        const systemMsg = {
          id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: "system",
          username: "System",
          text: `👻 ${randUsername} materialized into ${targetRoom.name}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: "#94a3b8",
          isSystem: true,
        };
        targetRoom.messages.push(systemMsg);
        if (targetRoom.messages.length > 50) targetRoom.messages.shift();

        // Send confirmation back to user
        if (callback) {
          callback({
            success: true,
            user: {
              id: meta.id,
              username: meta.username,
              color: meta.color,
              avatar: meta.avatar,
              status: meta.status,
            },
            room: {
              id: targetRoom.id,
              name: targetRoom.name,
              activeUsersCount: targetRoom.members.size,
            },
            history: targetRoom.messages,
          });
        }

        // Notify others in room
        socket.to(targetRoom.id).emit("message", systemMsg);
        io.to(targetRoom.id).emit("room-users", Array.from(targetRoom.members.values()));
        io.emit("global-stats", {
          totalUsers: socketsMetadata.size,
        });

      } catch (err: any) {
        console.error("Error in join-random:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Event: Join a specific room by name (custom rooms)
    socket.on("join-custom", (roomNameInput: string, callback) => {
      try {
        if (!roomNameInput || roomNameInput.trim().length === 0) {
          return callback({ success: false, error: "Invalid room name" });
        }
        const cleanedName = roomNameInput.trim().substring(0, 20);
        // Find or create
        let targetRoom: TempRoom | null = null;
        for (const [id, rObj] of rooms.entries()) {
          if (rObj.name.toLowerCase() === cleanedName.toLowerCase()) {
            targetRoom = rObj;
            break;
          }
        }

        if (!targetRoom) {
          const roomId = `room_${Math.random().toString(36).substring(2, 11)}`;
          targetRoom = {
            id: roomId,
            name: cleanedName,
            members: new Map(),
            messages: [],
          };
          rooms.set(roomId, targetRoom);
        }

        // Leave previous room if any
        if (meta.currentRoom) {
          const prevRoom = rooms.get(meta.currentRoom);
          if (prevRoom) {
            prevRoom.members.delete(socket.id);
            socket.leave(prevRoom.id);
            const leaveMsg = {
              id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              userId: "system",
              username: "System",
              text: `💤 ${meta.username} faded away from this room...`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              color: "#94a3b8",
              isSystem: true,
            };
            prevRoom.messages.push(leaveMsg);
            socket.to(prevRoom.id).emit("message", leaveMsg);
            io.to(prevRoom.id).emit("room-users", Array.from(prevRoom.members.values()));
            
            // Garbage collect empty room
            if (prevRoom.members.size === 0) {
              rooms.delete(prevRoom.id);
            }
          }
        }

        const existingNames = getSpookyNamesInRoom(targetRoom);
        const randUsername = generateRandomUsername(existingNames);

        // Update meta
        meta.username = randUsername;
        meta.currentRoom = targetRoom.id;
        targetRoom.members.set(socket.id, meta);

        // Join room
        socket.join(targetRoom.id);

        // Create system welcome message
        const systemMsg = {
          id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: "system",
          username: "System",
          text: `🔮 ${randUsername} manifested in ${targetRoom.name}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: "#94a3b8",
          isSystem: true,
        };
        targetRoom.messages.push(systemMsg);
        if (targetRoom.messages.length > 50) targetRoom.messages.shift();

        if (callback) {
          callback({
            success: true,
            user: {
              id: meta.id,
              username: meta.username,
              color: meta.color,
              avatar: meta.avatar,
              status: meta.status,
            },
            room: {
              id: targetRoom.id,
              name: targetRoom.name,
              activeUsersCount: targetRoom.members.size,
            },
            history: targetRoom.messages,
          });
        }

        socket.to(targetRoom.id).emit("message", systemMsg);
        io.to(targetRoom.id).emit("room-users", Array.from(targetRoom.members.values()));
        
        io.emit("global-stats", {
          totalUsers: socketsMetadata.size,
        });
      } catch (err: any) {
        console.error("Error in join-custom:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Event: Message sent
    socket.on("send-message", (content: string, callback) => {
      try {
        if (!meta.currentRoom) return;
        const currentRoomId = meta.currentRoom;
        const targetRoom = rooms.get(currentRoomId);
        if (!targetRoom) return;

        if (!content || content.trim().length === 0) return;
        
        const isDrawing = content.startsWith("data:image/");
        const cleanText = isDrawing ? content : content.substring(0, 1000); // Support drawings up to base64 size, cap text at 1000 chars

        const userMsg = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: meta.id,
          username: meta.username,
          text: cleanText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: meta.color,
          isSystem: false,
          isDrawing,
          reactions: []
        };

        targetRoom.messages.push(userMsg);
        if (targetRoom.messages.length > 50) targetRoom.messages.shift();

        // Broadcast to room
        io.to(currentRoomId).emit("message", userMsg);

        if (callback) callback({ success: true, message: userMsg });

      } catch (err: any) {
        console.error("Error sending message:", err);
      }
    });

    // Event: Toggle message reaction
    socket.on("toggle-reaction", ({ messageId, emoji }, callback) => {
      try {
        if (!meta.currentRoom) return;
        const targetRoom = rooms.get(meta.currentRoom);
        if (!targetRoom) return;

        const msgIndex = targetRoom.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;

        const msg = targetRoom.messages[msgIndex];
        if (!msg.reactions) msg.reactions = [];

        // Check if user already reacted for this emoji
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          const userIdx = existingReaction.users.indexOf(meta.id);
          if (userIdx !== -1) {
            // Remove reaction
            existingReaction.users.splice(userIdx, 1);
            existingReaction.count--;
          } else {
            // Add reaction
            existingReaction.users.push(meta.id);
            existingReaction.count++;
          }
        } else {
          // New emoji reaction
          msg.reactions.push({
            emoji,
            count: 1,
            users: [meta.id]
          });
        }

        // Clean empty reactions
        msg.reactions = msg.reactions.filter(r => r.count > 0);

        // Broadcast updated reactions of this message to the room
        io.to(targetRoom.id).emit("message-updated", {
          messageId: msg.id,
          reactions: msg.reactions
        });

        if (callback) callback({ success: true, reactions: msg.reactions });
      } catch (err) {
        console.error("Error toggling reaction:", err);
      }
    });

    // Event: Soundcast broadcast
    socket.on("soundcast", (soundType: string, callback) => {
      try {
        if (!meta.currentRoom) return;
        const targetRoom = rooms.get(meta.currentRoom);
        if (!targetRoom) return;

        io.to(targetRoom.id).emit("soundcast-received", {
          id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: meta.id,
          username: meta.username,
          avatar: meta.avatar,
          color: meta.color,
          soundType,
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error("Error broadcasting soundcast:", err);
      }
    });

    // Event: Status change
    socket.on("change-status", (status: string, callback) => {
      try {
        const cleanStatus = status ? status.substring(0, 30) : "";
        meta.status = cleanStatus;
        if (meta.currentRoom) {
          const targetRoom = rooms.get(meta.currentRoom);
          if (targetRoom) {
            targetRoom.members.set(socket.id, meta);
            io.to(targetRoom.id).emit("room-users", Array.from(targetRoom.members.values()));
          }
        }
        if (callback) callback({ success: true, status: cleanStatus });
      } catch (err) {
        console.error("Error in change-status:", err);
      }
    });

    // Event: Settings username change
    socket.on("change-username", (newUsername: string, callback) => {
      try {
        if (!newUsername || newUsername.trim().length < 3) {
          return callback({ success: false, error: "Name must be at least 3 characters." });
        }
        const cleaned = newUsername.trim().substring(0, 16);
        if (!meta.currentRoom) {
          meta.username = cleaned;
          return callback({ success: true, username: cleaned });
        }

        const targetRoom = rooms.get(meta.currentRoom);
        if (targetRoom) {
          const names = getSpookyNamesInRoom(targetRoom);
          if (names.includes(cleaned) && cleaned.toLowerCase() !== meta.username.toLowerCase()) {
            return callback({ success: false, error: "Someone in this room already holds that alias!" });
          }

          const oldName = meta.username;
          meta.username = cleaned;
          targetRoom.members.set(socket.id, meta);

          const systemMsg = {
            id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            userId: "system",
            username: "System",
            text: `🎭 ${oldName} altered their essence to ${cleaned}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            color: "#64748b",
            isSystem: true,
          };
          targetRoom.messages.push(systemMsg);
          io.to(targetRoom.id).emit("message", systemMsg);
          io.to(targetRoom.id).emit("room-users", Array.from(targetRoom.members.values()));
        } else {
          meta.username = cleaned;
        }

        if (callback) callback({ success: true, username: cleaned });
      } catch (err: any) {
        console.error("Error changing username:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Event: Typing status
    socket.on("typing", (isTyping: boolean) => {
      try {
        if (!meta.currentRoom) return;
        socket.to(meta.currentRoom).emit("user-typing", {
          id: socket.id,
          username: meta.username,
          isTyping,
        });
      } catch (err) {
        console.error("Error in typing:", err);
      }
    });

    // Event: Disconnect & Cleanup
    socket.on("disconnect", () => {
      console.log(`Socket disconnected client: ${socket.id}`);
      const roomId = meta.currentRoom;
      socketsMetadata.delete(socket.id);

      if (roomId) {
        const targetRoom = rooms.get(roomId);
        if (targetRoom) {
          targetRoom.members.delete(socket.id);

          // System notice
          const leaveMsg = {
            id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            userId: "system",
            username: "System",
            text: `💨 ${meta.username} faded back into the dark...`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            color: "#94a3b8",
            isSystem: true,
          };

          targetRoom.messages.push(leaveMsg);
          socket.to(targetRoom.id).emit("message", leaveMsg);
          io.to(targetRoom.id).emit("room-users", Array.from(targetRoom.members.values()));

          // If no one is left in the room, garbage collect it! (Fully ephemeral)
          if (targetRoom.members.size === 0) {
            rooms.delete(roomId);
            console.log(`Ephemeral Room ${targetRoom.name} expired and all logs wiped!`);
          }
        }
      }

      io.emit("global-stats", {
        totalUsers: socketsMetadata.size,
      });
    });
  });

  // Serve static assets in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite loading development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static bundle in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // PORT bindings
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Critical server bootstrap failure:", e);
});
