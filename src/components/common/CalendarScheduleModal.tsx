import React, { useState } from 'react';
import { GameWorldState, MatchFixture } from '../../types/game';
import { formatDateJP } from '../../engine/dateEngine';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Trophy, Clock, Play, MapPin, Award, ArrowRight } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onFastForwardToDate?: (targetDate: string) => void;
  onClose: () => void;
}

export const CalendarScheduleModal: React.FC<Props> = ({ state, onFastForwardToDate, onClose }) => {
  // Parse current date to set initial month
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    const parts = state.currentDate.split('-');
    return `${parts[0]}-${parts[1]}`; // e.g. "2026-08"
  });

  const [selectedDate, setSelectedDate] = useState<string>(state.currentDate);

  const [year, month] = currentYearMonth.split('-').map(Number);

  // Month navigation helpers
  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentYearMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentYearMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  // Fixtures in this month
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthFixtures = state.fixtures.filter(f => f.date && f.date.startsWith(monthPrefix));

  // User fixtures map
  const userClubId = state.userClubId;
  const fixturesByDate: Record<string, MatchFixture[]> = {};
  state.fixtures.forEach(f => {
    if (!fixturesByDate[f.date]) fixturesByDate[f.date] = [];
    fixturesByDate[f.date].push(f);
  });

  // Key event dates
  const isSummerDeadline = (d: string) => d.endsWith('-08-31');
  const isWinterDeadline = (d: string) => d.endsWith('-01-31');
  const isBallonDorNominees = (d: string) => d.endsWith('-11-05');
  const isBallonDorGala = (d: string) => d.endsWith('-11-28');

  // Days array for grid
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Selected date fixtures
  const selectedDateFixtures = fixturesByDate[selectedDate] || [];
  const selectedUserFixture = selectedDateFixtures.find(
    f => f.homeClubId === userClubId || f.awayClubId === userClubId
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-left">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl text-white my-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">
                  Season 2026/27 Schedule
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                  現在日時: {formatDateJP(state.currentDate)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                公式戦日程・シーズン統合カレンダー
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation & Fast Jump */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-black font-mono px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-white">
              {year}年 {month}月
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => {
                const parts = state.currentDate.split('-');
                setCurrentYearMonth(`${parts[0]}-${parts[1]}`);
                setSelectedDate(state.currentDate);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 font-bold border border-indigo-500/40 cursor-pointer"
            >
              本日 ({formatDateJP(state.currentDate)})
            </button>
          </div>
        </div>

        {/* Calendar Grid + Details Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Calendar Grid (7 columns) */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono font-bold text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <span className="text-rose-400">日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span className="text-blue-400">土</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {daysArray.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty_${idx}`} className="h-16 rounded-xl bg-slate-900/20" />;
                }

                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dateStr === state.currentDate;
                const isSelected = dateStr === selectedDate;

                const dayFixtures = fixturesByDate[dateStr] || [];
                const userFixture = dayFixtures.find(
                  f => f.homeClubId === userClubId || f.awayClubId === userClubId
                );

                const hasEvent = isSummerDeadline(dateStr) || isWinterDeadline(dateStr) || isBallonDorGala(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-16 rounded-xl p-1.5 flex flex-col justify-between text-left transition-all border cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                        : isToday
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${
                        isToday ? 'text-emerald-400' : isSelected ? 'text-indigo-300' : 'text-slate-300'
                      }`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    {/* Badge on Day */}
                    <div className="space-y-0.5 overflow-hidden">
                      {userFixture && (
                        <div className={`text-[9px] font-bold px-1 py-0.5 rounded truncate ${
                          userFixture.status === 'finished'
                            ? userFixture.homeScore === userFixture.awayScore
                              ? 'bg-slate-800 text-slate-300'
                              : (userFixture.homeClubId === userClubId && (userFixture.homeScore ?? 0) > (userFixture.awayScore ?? 0)) ||
                                (userFixture.awayClubId === userClubId && (userFixture.awayScore ?? 0) > (userFixture.homeScore ?? 0))
                              ? 'bg-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/30 text-rose-300'
                            : 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                        }`}>
                          {userFixture.status === 'finished'
                            ? `${userFixture.homeScore}-${userFixture.awayScore}`
                            : '⚽ MATCH'}
                        </div>
                      )}

                      {!userFixture && dayFixtures.length > 0 && (
                        <div className="text-[9px] text-slate-500 truncate">
                          {dayFixtures.length}試合
                        </div>
                      )}

                      {hasEvent && (
                        <div className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300 truncate">
                          ★ 特大行事
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Inspector & Fixtures List */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">SELECTED DATE</span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {formatDateJP(selectedDate)}
                    {selectedDate === state.currentDate && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        本日
                      </span>
                    )}
                  </h3>
                </div>

                {/* Fast forward button if selected date is in the future */}
                {selectedDate > state.currentDate && onFastForwardToDate && (
                  <button
                    type="button"
                    onClick={() => onFastForwardToDate(selectedDate)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>この日まで進める</span>
                  </button>
                )}
              </div>

              {/* Special Events on Selected Date */}
              {isSummerDeadline(selectedDate) && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>夏の移籍市場デッドラインデイ (Summer Transfer Deadline)</span>
                </div>
              )}
              {isWinterDeadline(selectedDate) && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>冬の移籍市場デッドラインデイ (Winter Transfer Deadline)</span>
                </div>
              )}
              {isBallonDorGala(selectedDate) && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>バロンドール公式授賞式・世界年間最優秀選手発表 (Ballon d'Or Gala)</span>
                </div>
              )}

              {/* User Match Feature Card */}
              {selectedUserFixture ? (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30">
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{selectedUserFixture.competitionName || selectedUserFixture.competition}</span>
                    </span>
                    <span className="font-mono">{selectedUserFixture.round || '公式戦'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 text-center">
                    <div className="flex-1 font-bold text-sm text-white">
                      {state.clubs[selectedUserFixture.homeClubId]?.name || selectedUserFixture.homeClubId}
                    </div>
                    <div className="px-3 py-1 font-mono font-black text-lg text-emerald-400 bg-slate-950 rounded-xl border border-slate-800">
                      {selectedUserFixture.status === 'finished'
                        ? `${selectedUserFixture.homeScore} - ${selectedUserFixture.awayScore}`
                        : 'VS'}
                    </div>
                    <div className="flex-1 font-bold text-sm text-white">
                      {state.clubs[selectedUserFixture.awayClubId]?.name || selectedUserFixture.awayClubId}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {selectedUserFixture.homeClubId === userClubId ? 'ホームゲーム (Home)' : 'アウェイゲーム (Away)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  この日、自クラブの公式戦予定はありません。
                </div>
              )}

              {/* Other Fixtures on Selected Date */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  同日開催の試合一覧 ({selectedDateFixtures.length}件)
                </span>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {selectedDateFixtures.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      予定されている公式戦はありません。
                    </div>
                  ) : (
                    selectedDateFixtures.map(f => {
                      const isUserGame = f.homeClubId === userClubId || f.awayClubId === userClubId;
                      const hName = state.clubs[f.homeClubId]?.name || f.homeClubId;
                      const aName = state.clubs[f.awayClubId]?.name || f.awayClubId;
                      return (
                        <div
                          key={f.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isUserGame
                              ? 'bg-indigo-950/40 border-indigo-500/40 font-bold'
                              : 'bg-slate-900/70 border-slate-850 text-slate-300'
                          }`}
                        >
                          <span className="truncate max-w-[130px]">{hName}</span>
                          <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-slate-950">
                            {f.status === 'finished' ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                          </span>
                          <span className="truncate max-w-[130px] text-right">{aName}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 text-right">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
