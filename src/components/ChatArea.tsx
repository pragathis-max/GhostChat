import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Smile, Copy, Check, Menu, MessageSquare, Flame, Palette, Volume2 } from "lucide-react";
import { Message, User } from "../types";
import { EmojiPicker } from "./EmojiPicker";
import { ScribbleCanvas } from "./ScribbleCanvas";

interface ChatAreaProps {
  messages: Message[];
  currentUser: User | null;
  activeUsers: User[];
  typingUsers: string[];
  onSendMessage: (text: string) => void;
  onSendTypingState: (isTyping: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onSendSoundcast: (soundType: string) => void;
  onToggleSidebarMobile: () => void;
  darkMode: boolean;
  roomName: string;
}

export function ChatArea({
  messages,
  currentUser,
  activeUsers,
  typingUsers,
  onSendMessage,
  onSendTypingState,
  onToggleReaction,
  onSendSoundcast,
  onToggleSidebarMobile,
  darkMode,
  roomName,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScribbleCanvas, setShowScribbleCanvas] = useState(false);
  const [showSoundcastMenu, setShowSoundcastMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic with smooth/instant reconciliation
  const scrollToBottom = (behavior: "smooth" | "instant" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, typingUsers]);

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText("");
    setShowEmojiPicker(false);

    // Cancel typing state instantly
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onSendTypingState(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit and manage typing status
    onSendTypingState(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onSendTypingState(false);
    }, 1500);
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(roomName);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn("Failed to copy text:", err);
    }
  };

  const handleSendScribble = (base64Data: string) => {
    onSendMessage(base64Data);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header Panel */}
      <header className={`px-5 py-4 border-b flex items-center justify-between z-10 transition-all ${
        darkMode ? "bg-[#0a0a0f]/40 border-white/5 backdrop-blur-md" : "bg-white/80 border-slate-100 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className={`p-2 rounded-xl lg:hidden border transition-colors ${
              darkMode ? "hover:bg-white/5 border-white/5 text-white" : "hover:bg-slate-50 border-slate-200 text-slate-800"
            }`}
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <h2 className={`font-extrabold tracking-tight truncate max-w-[150px] sm:max-w-xs ${
                darkMode ? "text-white" : "text-slate-800"
              }`}>
                {roomName}
              </h2>
            </div>
            <p className={`text-[10px] font-mono leading-none ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              {activeUsers.length} active souls
            </p>
          </div>
        </div>

        {/* Invite buttons */}
        <button
          onClick={handleCopyCode}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
            copiedLink
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : darkMode
                ? "bg-white/5 border-white/5 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/20"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-500/20 shadow-sm"
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 animate-bounce" /> Sent
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Invite Code
            </>
          )}
        </button>
      </header>

      {/* Messages Pane */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col justify-center items-center text-center p-6"
            >
              <div className={`p-4 rounded-3xl border mb-3 scale-95 ${
                darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100 shadow-sm"
              }`}>
                <MessageSquare className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <h3 className={`font-bold tracking-tight ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                Welcome to the Chamber
              </h3>
              <p className={`text-xs max-w-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Messages typed in this void are fully ephemeral. They vanish permanently when the room is emptied.
              </p>
            </motion.div>
          ) : (
            messages.map((msg, index) => {
              const isSys = msg.isSystem;
              const isMe = msg.userId === currentUser?.id;

              if (isSys) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex justify-center text-center"
                  >
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono leading-relaxed border tracking-widest uppercase shadow-sm max-w-[90%] sm:max-w-[70%] break-all ${
                      darkMode 
                        ? "bg-white/5 border-white/5 text-slate-500" 
                        : "bg-slate-50 border-slate-100 text-slate-500"
                    }`}>
                      {msg.text}
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className="max-w-[85%] sm:max-w-[70%] space-y-1 relative"
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* Timestamp & name labels */}
                    {!isMe && (
                      <div className="flex items-baseline gap-2 px-1">
                        <span className="text-xs font-bold text-slate-300" style={{ color: msg.color }}>
                          {msg.username}
                        </span>
                        <span className={`text-[10px] font-mono ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

                    {/* Chat Bubble card elements */}
                    <div
                      className={`px-4 py-3 rounded-2xl relative border text-sm leading-relaxed ${
                        isMe
                          ? darkMode
                            ? "bg-[#4f46e5]/20 text-slate-100 border-[#4f46e5]/30 rounded-tr-none shadow-[0_0_20px_rgba(79,70,229,0.1)]"
                            : "bg-[#4f46e5]/10 text-slate-800 border-purple-500/10 rounded-tr-none shadow-sm shadow-indigo-100"
                          : darkMode
                            ? "bg-white/5 text-slate-200 border-white/10 rounded-tl-none"
                            : "bg-white text-slate-700 border-slate-150 rounded-tl-none shadow-sm shadow-slate-100"
                      }`}
                    >
                      {/* Floating reaction bar */}
                      <AnimatePresence>
                        {hoveredMessageId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.9 }}
                            className={`absolute -top-8 ${isMe ? "right-2" : "left-2"} flex items-center gap-1 p-1 rounded-xl border shadow-xl z-30 ${
                              darkMode ? "bg-[#0f0f16] border-white/10" : "bg-white border-slate-200"
                            }`}
                          >
                            {["👻", "💀", "🔥", "💜"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  onToggleReaction(msg.id, emoji);
                                }}
                                className="p-1 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 duration-100 active:scale-95 text-xs cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {msg.isDrawing ? (
                        <div className="p-1 rounded-lg overflow-hidden bg-[#050507]">
                          <img
                            src={msg.text}
                            alt="Spooky Scribble"
                            className="max-w-full rounded-lg select-none pointer-events-none filter drop-shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                            style={{ maxHeight: "200px" }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      )}

                      {isMe && (
                        <span className="absolute bottom-1 right-2 text-[8px] font-mono opacity-50 select-none">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>

                    {/* Reactions Display Panel */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                        {msg.reactions.map((react) => {
                          const hasReacted = react.users.includes(currentUser?.id || "");
                          return (
                            <button
                              key={react.emoji}
                              onClick={() => onToggleReaction(msg.id, react.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                hasReacted
                                  ? "bg-indigo-500/25 border-indigo-500/55 text-indigo-300"
                                  : darkMode
                                    ? "bg-white/5 border-white/5 text-slate-400 hover:border-white/15"
                                    : "bg-slate-50 border-slate-250 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <span>{react.emoji}</span>
                              <span className="font-mono text-[9px]">{react.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Dynamic Typing indicators */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start items-center gap-2 pl-2"
            >
              <div className="flex items-center gap-2 ml-10">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                </div>
                <span className="text-[10px] italic text-slate-500">
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is typing..." : "are typing..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <footer className="p-6 z-20 relative">
        <form onSubmit={handleSend} className="relative flex items-center">
          <div className="absolute left-4 flex items-center z-20 gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 outline-none cursor-pointer ${
                darkMode ? "hover:bg-white/5 text-slate-400 hover:text-indigo-400" : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
              }`}
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowScribbleCanvas(!showScribbleCanvas)}
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 outline-none cursor-pointer ${
                darkMode ? "hover:bg-white/5 text-slate-400 hover:text-indigo-400" : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
              }`}
              title="Draw Spooky Scribble"
            >
              <Palette className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowSoundcastMenu(!showSoundcastMenu)}
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 outline-none cursor-pointer ${
                darkMode ? "hover:bg-white/5 text-slate-400 hover:text-indigo-400" : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
              }`}
              title="Cast Spectral Sound"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            maxLength={1000}
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message to the void..."
            className={`w-full py-4 pl-32 pr-16 rounded-2xl text-sm transition-all outline-none border focus:ring-1 focus:ring-indigo-500/20 ${
              darkMode
                ? "bg-[#0a0a0f] border-white/10 text-slate-200 focus:border-indigo-500/50 placeholder:text-slate-600"
                : "bg-white border-slate-200 text-slate-800 focus:border-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.1)] focus:bg-white"
            }`}
          />

          <div className="absolute right-3 flex items-center z-20">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 flex items-center justify-center ${
                inputText.trim()
                  ? "shadow-indigo-600/30 text-white cursor-pointer hover:scale-105"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              }`}
              title="Speak message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {/* Soundcast Drop-Up Panel Overlay */}
          <AnimatePresence>
            {showSoundcastMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className={`absolute bottom-[110%] left-4 p-3 rounded-2xl border shadow-2xl z-40 w-52 ${
                  darkMode ? "bg-[#0b0b14]/95 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                  <span className="text-[10px] font-mono tracking-wider text-indigo-400">CAST SPECTRAL RESONANCE</span>
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { key: "shiver", label: "👻 Cold Shiver", description: "Vibrato neon freeze" },
                    { key: "bell", label: "🔔 Doom Bell", description: "Iron metallic gong" },
                    { key: "flutter", label: "🦇 Bat Flutter", description: "Speed wing beating" },
                    { key: "theremin", label: "🔮 Theremin Sweep", description: "Retro scientific glide" },
                  ].map((sound) => (
                    <button
                      key={sound.key}
                      type="button"
                      onClick={() => {
                        onSendSoundcast(sound.key);
                        setShowSoundcastMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all active:scale-[0.98] flex flex-col cursor-pointer ${
                        darkMode
                          ? "hover:bg-white/5 hover:text-indigo-300"
                          : "hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                    >
                      <span className="font-semibold text-left">{sound.label}</span>
                      <span className="text-[9px] text-slate-500 font-medium text-left">{sound.description}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Drop-Up Panel Overlay */}
          <AnimatePresence>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleSelectEmoji}
                onClose={() => setShowEmojiPicker(false)}
                darkMode={darkMode}
              />
            )}
          </AnimatePresence>

          {/* Scribble Canvas Modal Overlay */}
          <AnimatePresence>
            {showScribbleCanvas && (
              <ScribbleCanvas
                onClose={() => setShowScribbleCanvas(false)}
                onSendScribble={handleSendScribble}
                darkMode={darkMode}
              />
            )}
          </AnimatePresence>
        </form>
      </footer>
    </div>
  );
}
