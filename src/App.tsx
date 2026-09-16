import React, { useState, useEffect } from 'react';
import { Student, ActiveTab } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';
import { RandomPicker } from './components/RandomPicker';
import { GroupGenerator } from './components/GroupGenerator';
import { RosterManager } from './components/RosterManager';
import { 
  Sparkles, 
  Users, 
  Grid, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  BookOpen
} from 'lucide-react';
import { playPop } from './utils/soundEffects';

const STORAGE_KEY_STUDENTS = 'classroom_picker_students_v1';
const STORAGE_KEY_SOUND = 'classroom_picker_sound_muted_v1';

export default function App() {
  // Load saved students or default to sample classroom roster
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load students from localStorage', e);
    }
    return SAMPLE_STUDENTS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SOUND) === 'true';
    } catch {
      return false;
    }
  });

  // Persist students
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage', e);
    }
  }, [students]);

  // Persist sound preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, soundMuted.toString());
    } catch (e) {
      console.error('Failed to save sound preference', e);
    }
  }, [soundMuted]);

  const handleToggleSound = () => {
    setSoundMuted(prev => !prev);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    playPop(soundMuted);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                班級抽籤與隨機分組工具
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                教師專用課堂隨機互動・名單抽籤・視覺化小組分組
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              id="nav-tab-picker"
              onClick={() => handleTabChange('picker')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>隨機抽籤</span>
            </button>

            <button
              type="button"
              id="nav-tab-groups"
              onClick={() => handleTabChange('groups')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4 text-emerald-500" />
              <span>自動分組</span>
            </button>

            <button
              type="button"
              id="nav-tab-roster"
              onClick={() => handleTabChange('roster')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>學生名單</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold ml-0.5">
                {students.length}
              </span>
            </button>
          </nav>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              id="header-toggle-sound-btn"
              title={soundMuted ? '音效已靜音（點擊開啟）' : '音效已開啟（點擊靜音）'}
              className={`p-2 rounded-xl border transition ${
                soundMuted
                  ? 'text-slate-400 border-slate-200 hover:bg-slate-100'
                  : 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
          />
        )}

        {activeTab === 'groups' && (
          <GroupGenerator
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            soundMuted={soundMuted}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
            soundMuted={soundMuted}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>班級抽籤與分組小幫手 ✦ 支援 CSV 上傳、自訂重複模式與視覺化分組</span>
          <span className="flex items-center gap-1 text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            教師教學課堂必備小工具
          </span>
        </div>
      </footer>
    </div>
  );
}
