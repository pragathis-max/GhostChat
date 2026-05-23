import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Moon, Sun, Bell, BellOff, Volume2, VolumeX, 
  Settings, LogOut, ChevronRight, Check, AlertCircle, Edit3
} from "lucide-react";
import { User, Settings as SettingsType } from "../types";

interface SidebarProps {
  roomName: string;
  activeUsers: User[];
  currentUser: User | null;
  settings: SettingsType;
  onUpdateSettings: (s: Partial<SettingsType>) => void;
  onChangeUsername: (newName: string) => Promise<boolean>;
  onChangeStatus: (status: string) => void;
  onLeaveRoom: () => void;
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  roomName,
  activeUsers,
  currentUser,
  settings,
  onUpdateSettings,
  onChangeUsername,
  onChangeStatus,
  onLeaveRoom,
  darkMode,
  isOpen,
  onClose,
}: SidebarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.username || "");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg(false);

    if (!editedName.trim()) {
      setErrorMsg("Alias cannot be empty.");
      return;
    }
    if (editedName.trim().length < 3) {
      setErrorMsg("Name must be at least 3 characters.");
      return;
    }
    if (editedName.trim().length > 16) {
      setErrorMsg("Name must be 16 characters or less.");
      return;
    }

    setIsUpdating(true);
    const success = await onChangeUsername(editedName.trim());
    setIsUpdating(false);

    if (success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2000);
      setIsEditingName(false);
    } else {
      setErrorMsg("Alias already claimed in this chamber.");
    }
  };

  const content = (
    <div className="h-full flex flex-col justify-between">
      {/* Upper section */}
      <div className="space-y-6">
        {/* Chamber Details */}
        <div className="p-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping`} />
            <h3 className={`text-[11px] font-mono uppercase tracking-widest ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              CONNECTED CHAMBER
            </h3>
          </div>
          <p className={`text-lg font-extrabold tracking-tight ${
            darkMode ? "text-white" : "text-slate-800"
          }`}>
            {roomName}
          </p>
          <div className={`text-xs mt-1 font-mono ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Ephemeral, session-only realm
          </div>
        </div>

        {/* Alias Configuration */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? "bg-white/5 border-white/5" : "bg-purple-50/50 border-purple-100"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-mono tracking-wider ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              YOUR SPECTER ALIAS
            </span>
            {!isEditingName && (
              <button
                onClick={() => {
                  setEditedName(currentUser?.username || "");
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Rename
              </button>
            )}
          </div>

          {isEditingName ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={16}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={isUpdating}
                  className={`flex-1 py-1.5 px-2 text-xs rounded-xl border outline-none ${
                    darkMode
                      ? "bg-slate-950/80 border-white/5 text-white focus:border-indigo-500"
                      : "bg-white border-slate-200 text-slate-800 focus:border-purple-500"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="p-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-lg transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
              {errorMsg && (
                <p className="text-[10px] text-pink-500 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorMsg}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentUser?.avatar}</span>
              <div>
                <p className="text-sm font-semibold tracking-wide" style={{ color: currentUser?.color }}>
                  {currentUser?.username} <span className="opacity-60 text-[9px] font-mono italic">(Self)</span>
                </p>
                {successMsg && (
                  <p className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Manifested successfully!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Spectral Status Choice */}
        <div className={`p-4 rounded-xl border ${
          darkMode ? "bg-white/5 border-white/5" : "bg-purple-50/50 border-purple-100"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono tracking-wider ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              SPECTRAL STATUS
            </span>
          </div>
          <select
            value={currentUser?.status || ""}
            onChange={(e) => onChangeStatus(e.target.value)}
            className={`w-full py-2 px-3 text-xs rounded-xl border outline-none cursor-pointer font-medium transition-all ${
              darkMode
                ? "bg-[#050507] border-white/5 text-slate-205 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                : "bg-white border-slate-200 text-slate-800 focus:border-purple-500/50"
            }`}
          >
            <option value="">👤 Standard Presence</option>
            <option value="👻 Haunting">👻 Haunting</option>
            <option value="🕯️ Conjuring">🕯️ Conjuring</option>
            <option value="🦇 Stalking">🦇 Stalking</option>
            <option value="⚡ Energized">⚡ Energized</option>
            <option value="🔮 Channeling">🔮 Channeling</option>
            <option value="💤 Slumbering">💤 Slumbering</option>
            <option value="📜 Inscribing">📜 Inscribing</option>
          </select>
        </div>

        {/* Presence Users List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4 text-indigo-400" /> Residents ({activeUsers.length})
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1.5">
            {activeUsers.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isSelf 
                      ? darkMode 
                        ? "bg-white/5 border-white/5 shadow-[0_0_8px_rgba(255,255,255,0.02)]" 
                        : "bg-purple-50 border-purple-100" 
                      : darkMode 
                        ? "bg-transparent border-transparent hover:bg-white/5" 
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-grow min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isSelf ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-green-500 opacity-50"
                    }`} />
                    <span className="text-lg flex-shrink-0">{user.avatar}</span>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-xs font-medium tracking-wide truncate max-w-[130px]"
                        style={{ color: user.color }}
                      >
                        {user.username}
                      </span>
                      {user.status && (
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                          {user.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelf && (
                    <span className="ml-auto text-[10px] text-slate-500 font-medium flex-shrink-0">
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Roster Preferences & Core Settings */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="space-y-2">
          {/* Toggle - Theme */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
              Theme State
            </span>
            <button
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.darkMode ? "bg-indigo-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  settings.darkMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Toggle - Sound */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              Acoustic Synthesizer
            </span>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.soundEnabled ? "bg-indigo-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  settings.soundEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Toggle - Notifications */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              {settings.notificationsEnabled ? <Bell className="w-4 h-4 text-indigo-400" /> : <BellOff className="w-4 h-4 text-slate-500" />}
              In-App Alerts
            </span>
            <button
              onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.notificationsEnabled ? "bg-indigo-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  settings.notificationsEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Departure */}
        <button
          onClick={onLeaveRoom}
          className="w-full mt-2 py-3 px-4 rounded-xl border border-red-500/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Dissolve Presence
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Slide and Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950 z-40 lg:hidden"
            />
            {/* Slide Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`fixed top-0 bottom-0 left-0 w-80 z-50 p-6 shadow-2xl border-r lg:hidden ${
                darkMode ? "glass-card border-slate-800" : "glass-card-light border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold font-mono tracking-widest text-purple-400 uppercase">
                  Menu Panel
                </span>
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-full border ${
                    darkMode ? "hover:bg-slate-800 border-slate-800" : "hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Roster Sidebar panels */}
      <aside
        className={`hidden lg:block w-[300px] flex-shrink-0 p-6 rounded-3xl border shadow-xl ${
          darkMode ? "glass-card border-slate-800/80" : "glass-card-light border-slate-200/50"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
