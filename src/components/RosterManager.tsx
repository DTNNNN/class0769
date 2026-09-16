import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { SAMPLE_STUDENTS, parsePastedText, parseCsvContent } from '../utils/csvParser';
import { 
  Users, 
  Upload, 
  ClipboardPaste, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Search,
  UserPlus
} from 'lucide-react';
import { playPop } from '../utils/soundEffects';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToPicker: () => void;
  soundMuted: boolean;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToPicker,
  soundMuted,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'upload'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleApplyPaste = () => {
    if (!pasteContent.trim()) {
      showFeedback('error', '請輸入或貼上學生姓名名單');
      return;
    }
    const parsed = parsePastedText(pasteContent);
    if (parsed.length === 0) {
      showFeedback('error', '未能解析出任何姓名，請檢查格式');
      return;
    }
    onUpdateStudents(parsed);
    setPasteContent('');
    playPop(soundMuted);
    showFeedback('success', `成功匯入 ${parsed.length} 位學生姓名！`);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const parsed = parseCsvContent(content);
      if (parsed.length === 0) {
        showFeedback('error', 'CSV 檔案內無有效學生資料');
        return;
      }
      onUpdateStudents(parsed);
      playPop(soundMuted);
      showFeedback('success', `成功從「${file.name}」匯入 ${parsed.length} 位學生！`);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    onUpdateStudents(SAMPLE_STUDENTS);
    playPop(soundMuted);
    showFeedback('success', `已載入三年二班範例名單（共 ${SAMPLE_STUDENTS.length} 人）！`);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStudentName.trim();
    if (!trimmed) return;

    const nextSeat = newStudentSeat.trim() 
      ? parseInt(newStudentSeat, 10) || newStudentSeat 
      : students.length + 1;

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      seatNumber: nextSeat,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentSeat('');
    playPop(soundMuted);
    showFeedback('success', `已新增學生「${trimmed}」`);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
    playPop(soundMuted);
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空目前的名單嗎？')) {
      onUpdateStudents([]);
      playPop(soundMuted);
      showFeedback('success', '名單已清空');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.seatNumber && s.seatNumber.toString().includes(searchQuery))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner and Quick Sample Loader */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            學生名單管理
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            目前名單共有 <span className="font-bold text-indigo-600 text-base">{students.length}</span> 位學生。支援 CSV 匯入、快速貼上或手動編輯。
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            id="load-sample-roster-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200/60"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            載入示範名單 (28人)
          </button>

          {students.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToPicker}
              id="go-to-picker-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
            >
              前往抽籤點名 →
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div 
          className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm font-medium transition ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Input Sources & Student List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Import / Input Area (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveInputTab('paste')}
                id="tab-paste-input"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-xl transition ${
                  activeInputTab === 'paste'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                貼上文字名單
              </button>

              <button
                type="button"
                onClick={() => setActiveInputTab('upload')}
                id="tab-upload-csv"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-xl transition ${
                  activeInputTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                上傳 CSV 檔案
              </button>
            </div>

            {/* Tab 1: Paste Text */}
            {activeInputTab === 'paste' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    直接貼上姓名名單 (一行一個姓名，或用逗號/空格隔開)
                  </label>
                  <textarea
                    rows={7}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    id="roster-paste-textarea"
                    placeholder={`範例格式：
陳冠宇
林庭宇
張家瑋
黃柏翰
王品涵
（亦支援座號，如：01 陳冠宇）`}
                    className="w-full text-sm font-mono p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    支援自動去除空白、編號與標點符號
                  </p>
                  <button
                    type="button"
                    onClick={handleApplyPaste}
                    id="apply-paste-btn"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition"
                  >
                    匯入名單
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Upload CSV */}
            {activeInputTab === 'upload' && (
              <div className="p-5 space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-50/60'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-indigo-50/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      點擊選取或拖曳 CSV 檔案至此
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      支援含有「姓名」、「座號」欄位的 CSV 檔案 (UTF-8 / ANSI)
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    提示：從 Excel 匯出名單時，請選擇「另存新檔」並存為「CSV (逗號分隔) (*.csv)」格式即可直接匯入。
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Single Student Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              手動新增單一學生
            </h3>
            <form onSubmit={handleAddSingleStudent} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="座號 (選填)"
                  value={newStudentSeat}
                  onChange={(e) => setNewStudentSeat(e.target.value)}
                  className="w-24 text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="學生姓名 (例: 王小明)"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                id="add-single-student-btn"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                新增至名單
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Roster Preview & Table (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full min-h-[480px]">
            {/* Header with Search and Clear */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋姓名或座號..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {students.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  id="clear-all-students-btn"
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空全班名單
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[520px]">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-base font-semibold text-slate-700">目前尚無學生名單</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    您可以點擊上方「載入示範名單」、上傳 CSV 檔案，或在左側直接貼上班級學生姓名。
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">找不到符合「{searchQuery}」的學生</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredStudents.map((std, idx) => (
                    <div
                      key={std.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {std.seatNumber || idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {std.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(std.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                        title="移除學生"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List Footer Count */}
            {students.length > 0 && (
              <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 text-xs text-slate-500 flex justify-between items-center px-4">
                <span>共計 {students.length} 位學生</span>
                {searchQuery && (
                  <span>符合搜尋：{filteredStudents.length} 位</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
