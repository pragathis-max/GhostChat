import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Trash2, Check, Palette } from "lucide-react";

interface ScribbleCanvasProps {
  onClose: () => void;
  onSendScribble: (base64Data: string) => void;
  darkMode: boolean;
}

export function ScribbleCanvas({ onClose, onSendScribble, darkMode }: ScribbleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#00FFFF"); // Default Neon Cyan
  const [brushSize, setBrushSize] = useState(4);
  const [isCanvasBlank, setIsCanvasBlank] = useState(true);

  const neonColors = [
    "#00FFFF", // Neon Cyan
    "#39FF14", // Neon Green
    "#FF007F", // Neon Pink
    "#BC13FE", // Neon Purple
    "#FFE600", // Neon Yellow
    "#FFFFFF", // Pure Aura White
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high dynamic resolution matching container bounds
    canvas.width = 400;
    canvas.height = 300;

    // Draw dark/light background based on theme
    ctx.fillStyle = darkMode ? "#050507" : "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Default drawing config
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [darkMode]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Support both mouse and responsive touch interactions
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling on mobile during doodles
    if (e.cancelable) e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    
    // Add glowing stroke filters in dark mode
    if (darkMode) {
      ctx.shadowBlur = brushSize * 1.5;
      ctx.shadowColor = brushColor;
    } else {
      ctx.shadowBlur = 0;
    }

    setIsDrawing(true);
    setIsCanvasBlank(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = darkMode ? "#050507" : "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsCanvasBlank(true);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCanvasBlank) return;

    const base64Data = canvas.toDataURL("image/png");
    onSendScribble(base64Data);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60`}
    >
      <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
        darkMode 
          ? "bg-[#0a0a0f]/95 border-white/15 text-slate-100" 
          : "bg-white border-slate-200 text-slate-800"
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-tight">Materialize Spooky Scribble</h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-lg border hover:bg-white/5 transition-colors ${
              darkMode ? "border-white/5 text-slate-400 hover:text-white" : "border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Frame */}
        <div className={`relative rounded-xl overflow-hidden border ${
          darkMode ? "border-white/10" : "border-slate-200"
        }`}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[220px] cursor-crosshair touch-none"
          />
        </div>

        {/* Brush Controls & Presets */}
        <div className="mt-4 space-y-4">
          {/* Colors palette */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Brush Aura</span>
            <div className="flex gap-1.5">
              {neonColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform active:scale-95 border relative ${
                    brushColor === color ? "scale-110" : "hover:scale-105"
                  }`}
                  style={{ 
                    backgroundColor: color, 
                    boxShadow: brushColor === color ? `0 0 10px ${color}` : "none",
                    borderColor: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Size slider */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Brush Scale</span>
            <div className="flex items-center gap-3 w-2/3">
              <input
                type="range"
                min={2}
                max={15}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-mono font-bold w-5 text-right">{brushSize}px</span>
            </div>
          </div>
        </div>

        {/* Action Options */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={clearCanvas}
            disabled={isCanvasBlank}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all text-red-400 border border-red-500/10 hover:bg-red-500/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Wipe Canvas
          </button>
          
          <button
            onClick={handleSend}
            disabled={isCanvasBlank}
            className={`px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-30 cursor-pointer shadow-indigo-600/20`}
          >
            <Check className="w-3.5 h-3.5" /> Manifest in Void
          </button>
        </div>
      </div>
    </motion.div>
  );
}
