import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Student, DrawRecord } from '../types';
import { playTick, playFanfare, playPop } from '../utils/soundEffects';
import { 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Users, 
  Award, 
  History, 
  RefreshCw,
  Check,
  Flame,
  Undo2
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
  soundMuted,
  onToggleSound,
}) => {
  // Mode: allow repeat or no repeat
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [drawnIds, setDrawnIds] = useState<string[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

  // Animation states
  const [isRolling, setIsRolling] = useState(false);
  const [displayedName, setDisplayedName] = useState<string>('準備抽籤');
  const [displayedSeat, setDisplayedSeat] = useState<string | number | null>(null);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rollingIntervalRef = useRef<number | null>(null);

  // Remaining eligible students for non-repeat mode
  const eligibleStudents = allowRepeat 
    ? students 
    : students.filter(s => !drawnIds.includes(s.id));

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) {
        window.clearTimeout(rollingIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar to trigger draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' && !isRolling && eligibleStudents.length > 0) {
        e.preventDefault();
        startDraw();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const fireConfetti = useCallback(() => {
    // Elegant classroom celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#a855f7', '#ec4899'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    }, 250);
  }, []);

  const startDraw = () => {
    if (isRolling || eligibleStudents.length === 0) return;

    setIsRolling(true);
    setCurrentWinner(null);

    // Pick the winner upfront from eligible pool
    const winnerIndex = Math.floor(Math.random() * eligibleStudents.length);
    const selectedStudent = eligibleStudents[winnerIndex];

    // Build suspense animation timing
    // Total duration around 2.8 seconds, starts fast and gradually decelerates
    const totalDuration = 2800;
    const startTime = Date.now();
    let lastTickTime = 0;
    let currentInterval = 40; // milliseconds between name flips

    const rollStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      // Random dummy name from all students to display during roll
      const randomDisplay = students[Math.floor(Math.random() * students.length)];
      setDisplayedName(randomDisplay.name);
      setDisplayedSeat(randomDisplay.seatNumber ?? null);

      // Play tick sound with ascending pitch
      playTick(progress, soundMuted);

      if (elapsed < totalDuration) {
        // Easing curve: interval increases exponentially near the end
        // Starts at 45ms -> slows to 280ms
        const ease = Math.pow(progress, 2.5);
        currentInterval = 45 + ease * 250;
        rollingIntervalRef.current = window.setTimeout(rollStep, currentInterval);
      } else {
        // Halt on the actual winner
        setDisplayedName(selectedStudent.name);
        setDisplayedSeat(selectedStudent.seatNumber ?? null);
        setCurrentWinner(selectedStudent);
        setIsRolling(false);

        // Sound and visual celebration
        playFanfare(soundMuted);
        fireConfetti();

        // Update drawn state if no-repeat
        if (!allowRepeat) {
          setDrawnIds(prev => [...prev, selectedStudent.id]);
        }

        // Add to history
        setDrawHistory(prev => [
          {
            id: `draw-${Date.now()}`,
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            turnNumber: prev.length + 1,
          },
          ...prev,
        ]);
      }
    };

    rollStep();
  };

  const handleResetPool = () => {
    setDrawnIds([]);
    setCurrentWinner(null);
    setDisplayedName('準備抽籤');
    setDisplayedSeat(null);
    playPop(soundMuted);
  };

  const handleReturnStudentToPool = (id: string) => {
    setDrawnIds(prev => prev.filter(item => item !== id));
    playPop(soundMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-200">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">尚未匯入學生名單</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
          請先前往「學生名單」頁面，貼上學生姓名或上傳 CSV 名單即可開始抽籤。
        </p>
        <button
          type="button"
          onClick={onNavigateToRoster}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition"
        >
          前往匯入名單
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-6 ${isFullscreen ? 'bg-slate-900 text-white p-6 min-h-screen flex flex-col justify-center' : ''}`}>
      {/* Top Controls Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
        isFullscreen ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        {/* Left: Mode Selection (Repeat vs No Repeat) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            抽取模式
          </span>
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
            <button
              type="button"
              id="mode-no-repeat-btn"
              onClick={() => { setAllowRepeat(false); playPop(soundMuted); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                !allowRepeat
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              不重複抽取 (抽過不再抽)
            </button>
            <button
              type="button"
              id="mode-repeat-btn"
              onClick={() => { setAllowRepeat(true); playPop(soundMuted); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                allowRepeat
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              可重複抽取 (人人每次有機會)
            </button>
          </div>
        </div>

        {/* Right: Sound toggle, Fullscreen, Reset */}
        <div className="flex items-center gap-2">
          {!allowRepeat && (
            <button
              type="button"
              onClick={handleResetPool}
              id="reset-draw-pool-btn"
              title="重設籤筒（讓所有學生重新進入抽籤池）"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重設籤筒
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            id="toggle-sound-btn"
            title={soundMuted ? '開啟音效' : '靜音'}
            className={`p-2 rounded-xl transition ${
              soundMuted 
                ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700' 
                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            id="toggle-fullscreen-btn"
            title={isFullscreen ? '離開全螢幕' : '全螢幕投影展示'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Draw Display Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Draw Card Stage (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 flex-1 flex flex-col justify-between p-8 sm:p-12 text-center min-h-[420px] ${
            isFullscreen 
              ? 'bg-slate-800/90 border-slate-700 shadow-2xl' 
              : 'bg-gradient-to-b from-white to-slate-50 border-slate-200/90 shadow-sm'
          }`}>
            {/* Background glowing aura */}
            <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
              isRolling 
                ? 'bg-amber-400' 
                : currentWinner 
                ? 'bg-indigo-500' 
                : 'bg-indigo-300'
            }`} />

            {/* Top Status Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  allowRepeat 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {!allowRepeat ? `籤筒剩餘：${eligibleStudents.length} 人` : `全班候選：${students.length} 人`}
                </span>
                
                {!allowRepeat && drawnIds.length > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    已抽出 {drawnIds.length} 人
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 hidden sm:block">
                快捷鍵：按 <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px]">Space 空白鍵</kbd> 直接抽籤
              </div>
            </div>

            {/* Center Dynamic Name Showcase with suspense roller */}
            <div className="relative z-10 my-8 py-6 flex flex-col items-center justify-center">
              {eligibleStudents.length === 0 && !allowRepeat ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    🎉 全班同學都已抽過一輪！
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    籤筒已經空了，您可以點擊下方按鈕重設籤筒，重新開始新的一輪抽籤。
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPool}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重設籤筒 (重新放入 {students.length} 人)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Seat Number Tag */}
                  <div className="h-7 flex items-center justify-center">
                    {displayedSeat !== null && displayedName !== '準備抽籤' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                        座號 {displayedSeat}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">點擊下方按鈕開始</span>
                    )}
                  </div>

                  {/* Winner / Shuffling Name */}
                  <div className="min-h-[110px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isRolling ? (
                        <motion.div
                          key="rolling-name"
                          initial={{ opacity: 0.8, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1.05 }}
                          exit={{ opacity: 0.5 }}
                          transition={{ duration: 0.08 }}
                          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 font-sans"
                        >
                          {displayedName}
                        </motion.div>
                      ) : currentWinner ? (
                        <motion.div
                          key={`winner-${currentWinner.id}`}
                          initial={{ scale: 0.5, opacity: 0, y: 20 }}
                          animate={{ scale: [1, 1.15, 1], opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="relative inline-block"
                        >
                          <div className="text-6xl sm:text-7xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                            {currentWinner.name}
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 text-sm font-bold shadow-md"
                          >
                            <Award className="w-4 h-4" />
                            恭喜中選！
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="text-4xl sm:text-5xl font-bold text-slate-300 dark:text-slate-600">
                          {displayedName}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Area */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                id="start-draw-btn"
                disabled={isRolling || (eligibleStudents.length === 0 && !allowRepeat)}
                onClick={startDraw}
                className={`w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  isRolling
                    ? 'bg-amber-500 cursor-wait animate-pulse'
                    : eligibleStudents.length === 0 && !allowRepeat
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
                }`}
              >
                {isRolling ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    正在抽籤中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {currentWinner ? '再抽下一位' : '開始隨機抽籤'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Pool Status & Draw History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Pool Card */}
          <div className={`rounded-2xl p-5 border ${
            isFullscreen ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                {!allowRepeat ? '目前待抽名單' : '全班抽籤名單'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {eligibleStudents.length} 人
              </span>
            </h3>

            {/* Student Chips */}
            <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
              {eligibleStudents.map((std) => (
                <span
                  key={std.id}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                >
                  {std.seatNumber && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{std.seatNumber}
                    </span>
                  )}
                  {std.name}
                </span>
              ))}
            </div>
          </div>

          {/* Draw History Log */}
          <div className={`rounded-2xl p-5 border flex flex-col ${
            isFullscreen ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                已抽出紀錄 ({drawHistory.length})
              </h3>

              {drawHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setDrawHistory([]); playPop(soundMuted); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  清空紀錄
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {drawHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  尚未有中選紀錄
                </p>
              ) : (
                drawHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                        {rec.turnNumber}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rec.studentName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {rec.timestamp}
                      </span>
                      {!allowRepeat && (
                        <button
                          type="button"
                          onClick={() => handleReturnStudentToPool(rec.studentId)}
                          title="放回籤筒"
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-indigo-600 rounded transition"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
