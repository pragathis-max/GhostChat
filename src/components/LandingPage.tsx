import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Skull, Users, MessageSquarePlus, Activity, Lock, ArrowRight, Radio } from "lucide-react";

interface LandingPageProps {
  onJoinRandom: () => void;
  onJoinCustom: (roomName: string) => void;
  darkMode: boolean;
  totalUsersOnline: number;
  loading: boolean;
}

export function LandingPage({
  onJoinRandom,
  onJoinCustom,
  darkMode,
  totalUsersOnline,
  loading,
}: LandingPageProps) {
  const [customRoomName, setCustomRoomName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!customRoomName.trim()) {
      setErrorMsg("Chamber name cannot be empty.");
      return;
    }
    if (customRoomName.trim().length < 3) {
      setErrorMsg("Name must be at least 3 characters.");
      return;
    }
    onJoinCustom(customRoomName);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden z-10 select-none">
      {/* Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "3s" }} />

      <div className="w-full max-w-xl text-center space-y-8">
        {/* Title and Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-bounce-slow relative">
            <Skull className="w-12 h-12 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-ping" />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mt-3">
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
              GhostChat
            </span>
          </h1>
          <p className={`text-sm tracking-widest uppercase font-mono max-w-md ${
            darkMode ? "text-slate-500" : "text-slate-500"
          }`}>
            Ephemeral Chat For Spooky Spirits
          </p>
        </motion.div>

        {/* Global Stats Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`mx-auto inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono font-medium border ${
            darkMode
              ? "bg-white/5 border-white/5 text-indigo-300"
              : "bg-white/80 border-slate-200 text-purple-600 shadow-sm"
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-ping`} />
          <span className={darkMode ? "text-slate-400" : "text-slate-600"}>Presence:</span>
          <span>{totalUsersOnline} Souls Connected</span>
        </motion.div>

        {/* Dynamic Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={`w-full p-8 rounded-3xl text-left shadow-2xl relative border ${
            darkMode 
              ? "bg-[#0a0a0f]/80 backdrop-blur-2xl border-white/5" 
              : "glass-card-light border-purple-500/10 shadow-purple-500/5"
          }`}
        >
          {/* Neon Border Highlights */}
          <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-60" />
          <div className="absolute bottom-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-60" />

          <h2 className={`text-xl font-bold tracking-tight mb-5 flex items-center gap-2 ${
            darkMode ? "text-white" : "text-slate-800"
          }`}>
            Manifest Into the Realm
          </h2>

          <div className="space-y-6">
            {/* Enter Random (Instant Match) */}
            <div className="space-y-2">
              <button
                onClick={onJoinRandom}
                disabled={loading}
                className="w-full relative py-4 px-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold tracking-wide text-center flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2 h-6">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "100ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "200ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                    Invoking Presence...
                  </span>
                ) : (
                  <>
                    <span>Enter The Void (Auto-Match)</span>
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </>
                )}
              </button>
              <p className={`text-[10px] font-mono text-center ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}>
                Auto-assigned to an active, ephemeral spooky public chamber.
              </p>
            </div>

            {/* Splitter */}
            <div className="relative flex items-center justify-center pointer-events-none">
              <div className={`w-full border-t ${darkMode ? "border-white/5" : "border-slate-100"}`} />
              <span className={`px-4 text-[10px] font-mono uppercase tracking-widest ${
                darkMode ? "text-slate-500 bg-[#0a0a0f]" : "text-slate-400 bg-white"
              }`}>
                or materialize custom room
              </span>
              <div className={`w-full border-t ${darkMode ? "border-white/5" : "border-slate-100"}`} />
            </div>

            {/* Create / Join Custom Room */}
            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <MessageSquarePlus className={`w-5 h-5 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`} />
                  </div>
                  <input
                    type="text"
                    maxLength={18}
                    value={customRoomName}
                    onChange={(e) => {
                      setCustomRoomName(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="e.g. Crypt-X, WitchLab"
                    className={`w-full py-3.5 pl-12 pr-4 rounded-xl text-sm font-medium transition-all outline-none border ${
                      darkMode
                        ? "bg-[#050507] border-white/10 text-white focus:border-indigo-500/50"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500/50 focus:bg-white"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:w-auto w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Join Chamber
                </button>
              </div>
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-pink-500 text-xs font-mono"
                >
                  ⚠️ {errorMsg}
                </motion.p>
              )}
            </form>
          </div>
        </motion.div>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-3 gap-4 pt-4 text-center max-w-lg mx-auto"
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className={`p-2.5 rounded-xl ${darkMode ? "bg-white/5 text-indigo-400 border border-white/5" : "bg-purple-50 text-purple-600 border border-purple-100"}`}>
              <Lock className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>100% Anonymous</span>
            <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No logs, no files stored</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className={`p-2.5 rounded-xl ${darkMode ? "bg-white/5 text-indigo-400 border border-white/5" : "bg-cyan-50 text-cyan-600 border border-cyan-100"}`}>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className={`text-[11px] font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Instant Connection</span>
            <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Zero signup or loading friction</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className={`p-2.5 rounded-xl ${darkMode ? "bg-white/5 text-indigo-400 border border-white/5" : "bg-pink-50 text-pink-600 border border-pink-100"}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Chamber Dissolution</span>
            <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Wiped as last user leaves</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
