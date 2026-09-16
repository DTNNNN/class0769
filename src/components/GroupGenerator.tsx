import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, StudentGroup, GroupMember } from '../types';
import { playShuffleSound, playPop } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { 
  Users2, 
  Shuffle, 
  Crown, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  HelpCircle,
  Users
} from 'lucide-react';

interface GroupGeneratorProps {
  students: Student[];
  onNavigateToRoster: () => void;
  soundMuted: boolean;
}

const COLOR_THEMES = [
  { bg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-600 text-white', accent: 'border-indigo-500' },
  { bg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-600 text-white', accent: 'border-emerald-500' },
  { bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-600 text-white', accent: 'border-amber-500' },
  { bg: 'bg-rose-50/80', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-600 text-white', accent: 'border-rose-500' },
  { bg: 'bg-cyan-50/80', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-600 text-white', accent: 'border-cyan-500' },
  { bg: 'bg-purple-50/80', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-600 text-white', accent: 'border-purple-500' },
  { bg: 'bg-orange-50/80', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-600 text-white', accent: 'border-orange-500' },
  { bg: 'bg-teal-50/80', border: 'border-teal-200', text: 'text-teal-800', badge: 'bg-teal-600 text-white', accent: 'border-teal-500' },
  { bg: 'bg-sky-50/80', border: 'border-sky-200', text: 'text-sky-800', badge: 'bg-sky-600 text-white', accent: 'border-sky-500' },
  { bg: 'bg-fuchsia-50/80', border: 'border-fuchsia-200', text: 'text-fuchsia-800', badge: 'bg-fuchsia-600 text-white', accent: 'border-fuchsia-500' },
  { bg: 'bg-lime-50/80', border: 'border-lime-200', text: 'text-lime-800', badge: 'bg-lime-600 text-white', accent: 'border-lime-500' },
  { bg: 'bg-pink-50/80', border: 'border-pink-200', text: 'text-pink-800', badge: 'bg-pink-600 text-white', accent: 'border-pink-500' },
];

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({
  students,
  onNavigateToRoster,
  soundMuted,
}) => {
  // Settings
  const [membersPerGroup, setMembersPerGroup] = useState<number>(4);
  const [assignLeaders, setAssignLeaders] = useState<boolean>(true);
  const [balanceRemainders, setBalanceRemainders] = useState<boolean>(true);

  // Result state
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-generate initial groups when students change or settings change
  const generateGroups = (shouldAnimate = false) => {
    if (students.length === 0) return;

    if (shouldAnimate) {
      setIsShuffling(true);
      playShuffleSound(soundMuted);
    }

    // Shuffle students array using Fisher-Yates
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groupSize = Math.max(1, membersPerGroup);
    const totalStudents = shuffled.length;
    let groupCount = Math.floor(totalStudents / groupSize);
    const remainder = totalStudents % groupSize;

    if (groupCount === 0) {
      groupCount = 1;
    }

    const newGroups: StudentGroup[] = [];

    if (balanceRemainders && remainder > 0 && groupCount > 0) {
      // Balance remainder: distribute the remaining students into the first 'remainder' groups
      // Example: 29 students, 4 per group = 7 groups of 4 + 1 extra.
      // With balance, it gives 1 group of 5, and 6 groups of 4.
      let currentIndex = 0;
      for (let g = 0; g < groupCount; g++) {
        // First remainder groups get 1 extra student
        const currentGroupSize = g < remainder ? groupSize + 1 : groupSize;
        const groupMembersRaw = shuffled.slice(currentIndex, currentIndex + currentGroupSize);
        currentIndex += currentGroupSize;

        // Choose leader (first member or random member in this group)
        const leaderIdx = assignLeaders ? Math.floor(Math.random() * groupMembersRaw.length) : -1;
        const members: GroupMember[] = groupMembersRaw.map((std, idx) => ({
          id: std.id,
          name: std.name,
          seatNumber: std.seatNumber,
          isLeader: assignLeaders && idx === leaderIdx,
        }));

        newGroups.push({
          id: `group-${g + 1}-${Date.now()}`,
          groupNumber: g + 1,
          name: `第 ${g + 1} 組`,
          colorTheme: g % COLOR_THEMES.length ? COLOR_THEMES[g % COLOR_THEMES.length].bg : COLOR_THEMES[0].bg,
          members,
        });
      }
    } else {
      // Standard partition (last group gets remainder)
      let groupIdx = 0;
      for (let i = 0; i < shuffled.length; i += groupSize) {
        groupIdx++;
        const slice = shuffled.slice(i, i + groupSize);
        const leaderIdx = assignLeaders ? Math.floor(Math.random() * slice.length) : -1;
        const members: GroupMember[] = slice.map((std, idx) => ({
          id: std.id,
          name: std.name,
          seatNumber: std.seatNumber,
          isLeader: assignLeaders && idx === leaderIdx,
        }));

        newGroups.push({
          id: `group-${groupIdx}-${Date.now()}`,
          groupNumber: groupIdx,
          name: `第 ${groupIdx} 組`,
          colorTheme: COLOR_THEMES[(groupIdx - 1) % COLOR_THEMES.length].bg,
          members,
        });
      }
    }

    if (shouldAnimate) {
      setTimeout(() => {
        setGroups(newGroups);
        setIsShuffling(false);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }, 400);
    } else {
      setGroups(newGroups);
    }
  };

  // Run on mount or when student count / size changes
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      generateGroups(false);
    }
  }, [students.length]);

  // Toggle leader manually by clicking on a member
  const handleToggleLeader = (groupIndex: number, memberId: string) => {
    setGroups(prev => {
      return prev.map((g, gIdx) => {
        if (gIdx !== groupIndex) return g;
        return {
          ...g,
          members: g.members.map(m => ({
            ...m,
            isLeader: m.id === memberId ? !m.isLeader : false,
          })),
        };
      });
    });
    playPop(soundMuted);
  };

  // Copy nicely formatted text
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `📋 【班級隨機分組名單】（共 ${students.length} 人，分為 ${groups.length} 組）\n\n`;
    groups.forEach(g => {
      text += `📌 ${g.name} (${g.members.length} 人)：\n`;
      const memberStrs = g.members.map(m => {
        let str = m.seatNumber ? `#${m.seatNumber} ${m.name}` : m.name;
        if (m.isLeader) str += ' (組長 👑)';
        return str;
      });
      text += `   ${memberStrs.join('、')}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    playPop(soundMuted);
    setTimeout(() => setCopied(false), 2500);
  };

  // Toggle Fullscreen
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
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-200">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">尚未匯入學生名單</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
          請先至「學生名單」頁面貼上學生姓名或上傳 CSV，即可進行自動分組。
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

  // Calculate stats for preview
  const previewGroupCount = Math.ceil(students.length / Math.max(1, membersPerGroup));

  return (
    <div ref={containerRef} className={`space-y-6 ${isFullscreen ? 'bg-slate-900 p-6 min-h-screen flex flex-col justify-start' : ''}`}>
      {/* Settings Panel */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isFullscreen ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Group Size Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-indigo-500" />
              <label className="text-base font-bold text-slate-800 dark:text-slate-100">
                設定每組人數（幾個人一組）：
              </label>
            </div>

            {/* Stepper & Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700/60 p-1">
                <button
                  type="button"
                  id="group-size-minus-btn"
                  onClick={() => {
                    const next = Math.max(2, membersPerGroup - 1);
                    setMembersPerGroup(next);
                    playPop(soundMuted);
                  }}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition"
                >
                  -
                </button>
                <span className="w-12 text-center font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">
                  {membersPerGroup}
                </span>
                <button
                  type="button"
                  id="group-size-plus-btn"
                  onClick={() => {
                    const next = Math.min(students.length, membersPerGroup + 1);
                    setMembersPerGroup(next);
                    playPop(soundMuted);
                  }}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setMembersPerGroup(num);
                      playPop(soundMuted);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                      membersPerGroup === num
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {num} 人/組
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                全班 {students.length} 人，預計分 <span className="font-bold text-indigo-600 dark:text-indigo-400">{previewGroupCount}</span> 組
              </span>
            </div>
          </div>

          {/* Additional Options: Leaders, Balance Remainder */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={assignLeaders}
                onChange={(e) => {
                  setAssignLeaders(e.target.checked);
                  playPop(soundMuted);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                隨機指定小組組長
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200" title="若人數無法整除，將多餘同學平均分入各組，避免落單">
              <input
                type="checkbox"
                checked={balanceRemainders}
                onChange={(e) => {
                  setBalanceRemainders(e.target.checked);
                  playPop(soundMuted);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>平均分散餘數（避免落單）</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="shuffle-groups-btn"
              onClick={() => generateGroups(true)}
              disabled={isShuffling}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              {groups.length === 0 ? '開始分組' : '重新隨機分組'}
            </button>

            {groups.length > 0 && (
              <button
                type="button"
                id="copy-groups-btn"
                onClick={handleCopyResults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? '已複製名單！' : '複製結果'}
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全螢幕' : '全螢幕投影'}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Visualized Groups Display Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <p className="text-slate-500 text-sm">點擊上方「開始分組」按鈕立即為學生進行隨機分組</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                分組視覺化展示
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                共 {groups.length} 組
              </span>
            </div>
            <p className="text-xs text-slate-400">
              💡 提示：點擊組員頭像旁的姓名，可手動切換指派組長 👑
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {groups.map((group, gIdx) => {
                const theme = COLOR_THEMES[gIdx % COLOR_THEMES.length];

                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: gIdx * 0.04 }}
                    className={`rounded-2xl border ${theme.border} bg-white dark:bg-slate-800/90 shadow-sm overflow-hidden flex flex-col`}
                  >
                    {/* Group Header */}
                    <div className={`p-3.5 flex items-center justify-between border-b ${theme.border} ${theme.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${theme.badge}`}>
                          {group.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member List */}
                    <div className="p-3.5 space-y-2 flex-1">
                      {group.members.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleToggleLeader(gIdx, member.id)}
                          className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                            member.isLeader 
                              ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 shadow-xs' 
                              : 'bg-slate-50/70 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              member.isLeader 
                                ? 'bg-amber-400 text-amber-950' 
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                            }`}>
                              {member.seatNumber || '•'}
                            </span>
                            <span className={`text-sm font-semibold truncate ${
                              member.isLeader 
                                ? 'text-amber-900 dark:text-amber-200 font-bold' 
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {member.name}
                            </span>
                          </div>

                          {member.isLeader && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[11px] font-bold shrink-0">
                              <Crown className="w-3 h-3 text-amber-600" />
                              組長
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
