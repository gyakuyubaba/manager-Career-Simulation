import React, { useState } from 'react';
import { ManagerProfile, ManagerStyle, TacticalType, ManagerSpecialty } from '../types/game';
import { User, Award, Shield, Compass, Sparkles, Check } from 'lucide-react';

interface Props {
  onComplete: (manager: ManagerProfile) => void;
}

const MANAGER_STYLES: { id: ManagerStyle; name: string; desc: string }[] = [
  { id: '戦術至上主義', name: '戦術至上主義 (Tactician)', desc: '細部まで計算されたポジショニングと戦術浸透度を高める' },
  { id: '情熱型モチベーター', name: '情熱型モチベーター (Motivator)', desc: '選手たちのメンタルと逆境での闘争心を極限まで引き出す' },
  { id: '名伯楽（若手育成）', name: '名伯楽（若手育成） (Developer)', desc: 'アカデミー生や21歳以下の若手成長スピードを大幅に加速' },
  { id: '厳格なディシプリン', name: '厳格なディシプリン (Disciplinarian)', desc: '規律を重んじ、守備の崩壊や気の緩みを徹底的に防ぐ' },
  { id: '現実主義（結果重視）', name: '現実主義（結果重視） (Pragmatist)', desc: '格上相手でも確実に勝ち点を拾うリアリズムサッカー' }
];

const TACTICAL_TYPES: { id: TacticalType; name: string; desc: string }[] = [
  { id: 'ゲーゲンプレス', name: 'ゲーゲンプレス', desc: '即時奪還とハイインテンシティで相手のミスを誘う' },
  { id: 'ティキタカ（ポゼッション）', name: 'ポゼッション・パスサッカー', desc: 'ボール保持率を高め、パスワークで敵陣を崩す' },
  { id: '堅守速攻（カウンター）', name: 'ダイレクト・カウンター', desc: '自陣で強固なブロックを敷き、奪った瞬間に急襲' },
  { id: 'ハイブリッドプレッシング', name: 'ハイブリッド戦術', desc: '相手のシステムに合わせて柔軟にプレス位置を変える' },
  { id: 'トータルフットボール', name: 'トータルフットボール', desc: '全員攻撃・全員守備の流動的なポジショナルプレー' }
];

const SPECIALTIES: { id: ManagerSpecialty; name: string; desc: string }[] = [
  { id: '攻撃戦術', name: '攻撃戦術 (Attacking)', desc: '決定力・チャンスメイクの創出率向上' },
  { id: '守備構築', name: '守備構築 (Defending)', desc: '被シュート・失点数の抑制' },
  { id: '若手育成', name: '若手育成 (Youth Growth)', desc: '若手ポテンシャルの最大化' },
  { id: '選手マネジメント', name: '選手管理 (Man-management)', desc: '不満の解消と信頼度の上昇' },
  { id: '移籍交渉', name: '移籍交渉 (Negotiation)', desc: '移籍金や年俸の有利な値引き交渉' }
];

const AVATARS = [
  '👔', '💼', '🧢', '🕶️', '🧥', '📋'
];

export const ManagerCreationModal: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('森本 圭介');
  const [nationality, setNationality] = useState('日本');
  const [age, setAge] = useState(42);
  const [avatar, setAvatar] = useState('👔');
  const [style, setStyle] = useState<ManagerStyle>('戦術至上主義');
  const [tacticalType, setTacticalType] = useState<TacticalType>('ゲーゲンプレス');
  const [specialty, setSpecialty] = useState<ManagerSpecialty>('攻撃戦術');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profile: ManagerProfile = {
      name: name.trim(),
      nationality,
      age: Number(age) || 40,
      avatar,
      style,
      tacticalType,
      specialty,
      reputation: 75,
      careerTrophies: 0,
      matchesManaged: 0,
      wins: 0,
      draws: 0,
      losses: 0
    };

    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl my-4 sm:my-8 transition-all text-left pb-10">
          
          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 text-2xl">
              {avatar}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              オリジナル監督プロファイル作成
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              2026/27シーズン、世界最高峰の舞台に挑む指揮官の能力を設定してください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">監督名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例: 佐藤 健一"
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">国籍</label>
                <select
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="日本">日本 (Japan)</option>
                  <option value="イングランド">イングランド (England)</option>
                  <option value="スペイン">スペイン (Spain)</option>
                  <option value="ドイツ">ドイツ (Germany)</option>
                  <option value="イタリア">イタリア (Italy)</option>
                  <option value="フランス">フランス (France)</option>
                  <option value="オランダ">オランダ (Netherlands)</option>
                  <option value="ブラジル">ブラジル (Brazil)</option>
                  <option value="アルゼンチン">アルゼンチン (Argentina)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">年齢</label>
                <input
                  type="number"
                  min={30}
                  max={75}
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Avatar Icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">監督アイコン</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-12 h-12 text-xl rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      avatar === av 
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-sm shadow-emerald-500/20' 
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Manager Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                監督哲学・スタイル <span className="text-slate-500">（クラブの評価基準に影響）</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MANAGER_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      style === s.id
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-white">{s.name}</span>
                      {style === s.id && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Philosophy */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                得意な基本戦術 <span className="text-slate-500">（オファー時の戦術親和性に影響）</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TACTICAL_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTacticalType(t.id)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      tacticalType === t.id
                        ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-white">{t.name}</span>
                      {tacticalType === t.id && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">特化スキル（得意分野）</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALTIES.map(sp => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setSpecialty(sp.id)}
                    className={`p-2.5 text-left sm:text-center rounded-xl border transition-all cursor-pointer ${
                      specialty === sp.id
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200 ring-1 ring-amber-500/30'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold">{sp.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sp.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>監督登録を完了し、5クラブの就任オファーを見る</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
