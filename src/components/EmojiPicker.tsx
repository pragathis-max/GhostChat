import { useState } from "react";
import { motion } from "motion/react";
import { X, Smile, Ghost, Heart, Flame } from "lucide-react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  darkMode: boolean;
}

const EMOJI_CATEGORIES = [
  {
    id: "spooky",
    name: "Spooky",
    icon: Ghost,
    emojis: ["👻", "💀", "🕷️", "🦇", "🐈‍⬛", "🦉", "🎃", "🕯️", "👽", "👁️", "🕸️", "🔮", "🌘", "🪐", "⚰️", "🧛", "🧟"]
  },
  {
    id: "faces",
    name: "Faces",
    icon: Smile,
    emojis: ["😀", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "😘", "😜", "🤫", "🤔", "🙄", "😏", "🥺", "😎", "🥵"]
  },
  {
    id: "vibe",
    name: "Vibes",
    icon: Flame,
    emojis: ["⚡", "🔥", "✨", "💫", "🍿", "🍕", "🍔", "🍺", "🍷", "🎮", "🎵", "🎧", "👾", "🚀", "👑", "💖", "🍿"]
  },
  {
    id: "hearts",
    name: "Symbols",
    icon: Heart,
    emojis: ["❤️", "💖", "🖤", "💜", "💙", "💚", "💯", "🎉", "💥", "💭", "💤", "⚠️", "❌", "✅", "🔔", "⭐", "🌈"]
  }
];

export function EmojiPicker({ onSelect, onClose, darkMode }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("spooky");

  const currentCat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`absolute bottom-full mb-3 right-0 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden ${
        darkMode 
          ? "glass-card text-white border-purple-500/20" 
          : "glass-card-light text-slate-800 border-purple-500/15"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        darkMode ? "border-slate-800" : "border-slate-100"
      }`}>
        <span className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-purple-400" /> Express Yourself
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors ${
            darkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
          }`}
          aria-label="Close emoji picker"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex justify-around py-1 border-b ${
        darkMode ? "border-slate-800/80" : "border-slate-100"
      }`}>
        {EMOJI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-2 w-full flex justify-center items-center relative transition-colors ${
                isActive 
                  ? "text-purple-400" 
                  : darkMode 
                    ? "text-slate-500 hover:text-slate-300" 
                    : "text-slate-400 hover:text-slate-700"
              }`}
              title={cat.name}
            >
              <Icon className="w-4 h-4" />
              {isActive && (
                <motion.div 
                  layoutId="active-emoji-cat" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Emojis Grid */}
      <div className="p-4 h-44 overflow-y-auto grid grid-cols-6 gap-2.5 justify-items-center">
        {currentCat.emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className={`text-2xl p-1.5 rounded-lg h-10 w-10 flex items-center justify-center transition-all hover:scale-120 duration-150 active:scale-95 ${
              darkMode 
                ? "hover:bg-purple-500/15" 
                : "hover:bg-purple-500/10"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Footer Category Alert */}
      <div className={`px-4 py-2 text-[10px] uppercase tracking-wider font-medium text-center ${
        darkMode ? "bg-slate-900/60 text-slate-400 border-t border-slate-800/40" : "bg-slate-50 text-slate-400 border-t border-slate-100"
      }`}>
        {currentCat.name} Category
      </div>
    </motion.div>
  );
}
