/**
 * Monthly Scouting System Engine & Type 2 High School Player Integration
 * 
 * Rules:
 * 1. Actionable once per calendar month (tracked via `state.scoutMonthlyState.lastScoutedMonth`).
 * 2. Selectable regions:
 *    - Japan Domestic Prefectures & Famous High Schools (青森山田, 市立船橋, 静岡学園, 大津, etc.)
 *    - Overseas Youth Regions (South America, Western Europe, Eastern Europe, Africa, Asia)
 * 3. Dispatches scout and generates 5 scout prospects.
 * 4. User can sign at most 1 prospect per month:
 *    - Option A: Standard Professional Contract
 *    - Option B (for Japanese High Schoolers): 2種登録 (Type 2 High School Dual Registration)
 * 5. Ultra-rare generational prodigy chance (1-2%):
 *    - OVR 90 - 95, Potential 98 - 99 ("10年に1人の怪物").
 */

import { GameWorldState, ScoutProspect, Player, Position, PlayStyle, PlayerPersonality, NewsItem } from '../types/game';

export interface ScoutRegion {
  id: string;
  name: string;
  category: 'japan' | 'overseas';
  description: string;
  focusTraits: string;
  schools?: string[];
}

export const SCOUT_REGIONS: ScoutRegion[] = [
  // Japan High Schools & Prefectures
  {
    id: 'jp_aomori',
    name: '青森県 (青森山田高校・東北)',
    category: 'japan',
    description: 'フィジカル・球際の強度・規律ある守備組織に長けた全国屈指の超名門エリア',
    focusTraits: 'フィジカル・守備意識・メンタルタフネス',
    schools: ['青森山田高校', '遠野高校', '尚志高校']
  },
  {
    id: 'jp_chiba',
    name: '千葉県 (市立船橋高校・流経大柏)',
    category: 'japan',
    description: '激しいハイプレスと強度の高い攻守の切り替えを誇る激戦区',
    focusTraits: 'スタミナ・プレッシング・ハードワーク',
    schools: ['市立船橋高校', '流通経済大学付属柏高校', '習志野高校']
  },
  {
    id: 'jp_shizuoka',
    name: '静岡県 (静岡学園高校・藤枝東)',
    category: 'japan',
    description: '王国・静岡の伝統を受け継ぐ、圧倒的な個人技とドリブル突破の宝庫',
    focusTraits: 'テクニック・ドリブル・創造性',
    schools: ['静岡学園高校', '藤枝東高校', '清水桜が丘高校']
  },
  {
    id: 'jp_kumamoto',
    name: '熊本県・九州 (大津高校・神村学園)',
    category: 'japan',
    description: '近代フットボールの戦術眼と大型ストライカー・ゲームメーカーを多数輩出',
    focusTraits: 'パスセンス・戦術理解・得点感覚',
    schools: ['大津高校', '神村学園高等部', '東福岡高校']
  },
  {
    id: 'jp_tokyo',
    name: '東京都・関東 (帝京・成立学園・国学院久我山)',
    category: 'japan',
    description: '洗練されたポゼッションと密集地帯での打開力を持つ逸材が集う首都圏',
    focusTraits: 'パス・アジリティ・インテリジェンス',
    schools: ['帝京高校', '成立学園高校', '國學院久我山高校']
  },
  {
    id: 'jp_osaka',
    name: '大阪府・関西 (興國高校・履正社・阪南大高)',
    category: 'japan',
    description: '南米直伝のボールマスタリーと圧倒的なイマジネーションを持つ異能集団',
    focusTraits: 'スキルフル・フェイント・チャンスメイク',
    schools: ['興國高校', '履正社高校', '阪南大学高校']
  },

  // Overseas Youth Hubs
  {
    id: 'ov_brazil',
    name: '南米ブラジル (サントス・サンパウロ ユース)',
    category: 'overseas',
    description: 'ジンガの血を受け継ぐ天性のドリブラーとストライカーの原石',
    focusTraits: '超絶技巧・爆発的スピード・アクロバティック'
  },
  {
    id: 'ov_argentina',
    name: '南米アルゼンチン (ブエノスアイレス・ロサリオ)',
    category: 'overseas',
    description: '勝利への執念、高い戦術IQ、ピッチ上の軍師たるパサー',
    focusTraits: 'リーダーシップ・ビジョン・勝負強さ'
  },
  {
    id: 'ov_france',
    name: '西欧フランス (イル＝ド＝フランス・クレールフォンテーヌ)',
    category: 'overseas',
    description: '世界一のタレント輩出率を誇るパリ近郊。圧倒的身体能力と近代適性',
    focusTraits: 'スピード・デュエル勝率・現代的アスリート'
  },
  {
    id: 'ov_spain',
    name: '西欧スペイン (カタルーニャ・バスク・アンダルシア)',
    category: 'overseas',
    description: 'ポジショナルプレーと至高のワンタッチパスを体得したアカデミー生',
    focusTraits: 'ポゼッション・ポジショニング・判断スピード'
  },
  {
    id: 'ov_germany',
    name: '西欧ドイツ (ルール地方・バイエルン)',
    category: 'overseas',
    description: 'ゲーゲンプレスへの適性とダイナミックな推進力を備えた近代型タレント',
    focusTraits: '走力・攻守切り替え・フィジカルバランス'
  },
  {
    id: 'ov_africa',
    name: 'アフリカ (ナイジェリア・セネガル・ガーナ)',
    category: 'overseas',
    description: '驚異的なストライドと跳躍力、枠にとらわれないダイナミックなプレー',
    focusTraits: '最高速・ジャンプ・無尽蔵のスタミナ'
  }
];

const JAPAN_FAMILY_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川',
  '前田', '岡田', '長谷川', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本'
];

const JAPAN_GIVEN_NAMES = [
  '翔太', '大樹', '陸', '悠真', '蓮', '颯太', '大和', '樹', '翼', '拓海',
  '陽翔', '湊', '蒼空', '結翔', '朝陽', '健人', '俊介', '航平', '亮太', '一真',
  '怜央', '颯真', '奏太', '直樹', '龍之介', '隼人', '光希', '創太', '悠斗', '慶太'
];

const OVERSEAS_FIRST_NAMES = [
  'Mateo', 'Lucas', 'Thiago', 'Gabriel', 'Julian', 'Enzo', 'Alejandro', 'Arthur',
  'Koffi', 'Amadou', 'Ousmane', 'Sadio', 'Victor', 'Samuel', 'Luka', 'Florian',
  'Felix', 'Nico', 'Pablo', 'Diego', 'Rafael', 'Hugo', 'Leo', 'Joao', 'Adrien'
];

const OVERSEAS_LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Fernandez', 'Rodriguez', 'Lopez', 'Diallo', 'Mendy',
  'Toure', 'Osimhen', 'Kovacic', 'Schmidt', 'Weber', 'Garcia', 'Moreno', 'Torres',
  'Camara', 'Traore', 'Dubois', 'Laurent', 'Fontaine', 'Costa', 'Pereira', 'Ribeiro'
];

const POSITIONS_POOL: Position[] = ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK'];

/**
 * Check if the user can execute the monthly scouting action
 */
export function canScoutThisMonth(state: GameWorldState): boolean {
  const currentMonth = state.currentDate.slice(0, 7); // e.g. "2026-10"
  return state.scoutMonthlyState?.lastScoutedMonth !== currentMonth;
}

/**
 * Dispatch monthly scout to chosen region and generate 5 prospects
 */
export function dispatchMonthlyScout(
  state: GameWorldState,
  regionId: string
): { prospects: ScoutProspect[]; updatedState: Partial<GameWorldState> } {
  const region = SCOUT_REGIONS.find(r => r.id === regionId) || SCOUT_REGIONS[0];
  const currentMonth = state.currentDate.slice(0, 7);
  const currentYear = parseInt(state.currentDate.split('-')[0], 10);

  const prospects: ScoutProspect[] = [];

  for (let i = 0; i < 5; i++) {
    const isJapan = region.category === 'japan';
    const age = 16 + (i % 3); // 16, 17, 18
    const birthMonth = ((i * 3 + 4) % 12) + 1;
    const birthDay = ((i * 7 + 11) % 28) + 1;
    const birthDate = `${currentYear - age}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    let name = '';
    let nationality = '日本';
    if (isJapan) {
      const fn = JAPAN_FAMILY_NAMES[(Math.floor(Math.random() * JAPAN_FAMILY_NAMES.length))];
      const gn = JAPAN_GIVEN_NAMES[(Math.floor(Math.random() * JAPAN_GIVEN_NAMES.length))];
      name = `${fn} ${gn}`;
    } else {
      const fn = OVERSEAS_FIRST_NAMES[Math.floor(Math.random() * OVERSEAS_FIRST_NAMES.length)];
      const ln = OVERSEAS_LAST_NAMES[Math.floor(Math.random() * OVERSEAS_LAST_NAMES.length)];
      name = `${fn} ${ln}`;
      nationality = region.name.includes('ブラジル') ? 'ブラジル' : 
                    region.name.includes('アルゼンチン') ? 'アルゼンチン' :
                    region.name.includes('フランス') ? 'フランス' :
                    region.name.includes('スペイン') ? 'スペイン' :
                    region.name.includes('ドイツ') ? 'ドイツ' : 'ナイジェリア';
    }

    const pos = POSITIONS_POOL[(i * 3 + Math.floor(Math.random() * 4)) % POSITIONS_POOL.length];
    const altPos: Position[] = pos === 'ST' ? ['CF', 'LW'] :
                               pos === 'CAM' ? ['CM', 'RW'] :
                               pos === 'CB' ? ['CDM'] :
                               pos === 'LB' ? ['LWB', 'CB'] :
                               pos === 'RB' ? ['RWB', 'RM'] :
                               pos === 'GK' ? [] : ['CM', 'CAM'];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Ultra-rare generational prodigy roll (1.5% chance)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const isGenerational = Math.random() < 0.015 || (i === 4 && Math.random() < 0.03);

    let ovr: number;
    let potential: number;

    if (isGenerational) {
      // "10年に1人の怪物" (OVR 92-95, POT 98-99)
      ovr = 90 + Math.floor(Math.random() * 6); // 90 - 95
      potential = 98 + Math.floor(Math.random() * 2); // 98 - 99
    } else {
      // High-grade youth prospect (OVR 68-78, POT 83-93)
      ovr = 67 + Math.floor(Math.random() * 11);
      potential = Math.min(94, ovr + 12 + Math.floor(Math.random() * 10));
    }

    const school = isJapan && region.schools ? region.schools[i % region.schools.length] : undefined;

    const playstyles: PlayStyle[] = ['チャンスメイカー', 'ラインブレイカー', 'ボックストゥボックス', 'ハードタックラー', 'ショットストッパー'];
    const personalities: PlayerPersonality[] = ['プロフェッショナル', '野心的', '冷静沈着', 'リーダー気質'];

    let scoutReport = '';
    if (isGenerational) {
      scoutReport = `【現地スカウト総括：S++級・歴史的怪物】「信じられない逸材です。同年代を完全に圧倒しており、すでに世界のトップメガクラブの主力を張れる超次元の技術・フィジカル・得点感覚を備えています。逃せば100%後悔します。」`;
    } else if (potential >= 90) {
      scoutReport = `【現地スカウト総括：A+級・将来の代表候補】「基礎技術の完成度が非常に高く、今後の育成次第で世界レベルへ到達する器です。${isJapan ? '2種登録での即戦力抜擢' : 'プロ契約'}を強く推奨します。」`;
    } else {
      scoutReport = `【現地スカウト総括：B+級・即戦力有望株】「${region.focusTraits}において高い水準を誇る優良株。チームの戦術にフィットすれば大きな戦力となるでしょう。」`;
    }

    const baseVal = isGenerational ? 75000000 : (ovr >= 75 ? 8000000 : 2500000);
    const baseWage = isGenerational ? 65000 : 5000;

    prospects.push({
      id: `scout_prospect_${Date.now()}_${i}`,
      name,
      age,
      birthDate,
      nationality,
      originRegion: region.name,
      schoolOrAcademy: school,
      position: pos,
      altPositions: altPos,
      preferredFoot: i % 3 === 0 ? '左' : '右',
      ovr,
      potential,
      pace: Math.min(99, ovr + Math.floor(Math.random() * 8) - 4),
      shooting: pos === 'ST' || pos === 'CF' ? Math.min(99, ovr + 4) : Math.max(40, ovr - 10),
      passing: pos === 'CAM' || pos === 'CM' ? Math.min(99, ovr + 4) : Math.max(45, ovr - 8),
      dribbling: Math.min(99, ovr + 2),
      defending: pos === 'CB' || pos === 'CDM' ? Math.min(99, ovr + 4) : Math.max(35, ovr - 20),
      physical: Math.min(99, ovr + Math.floor(Math.random() * 6) - 3),
      gk: pos === 'GK' ? ovr : 10,
      marketValue: baseVal,
      wage: baseWage,
      playstyle: playstyles[i % playstyles.length],
      personality: personalities[i % personalities.length],
      scoutReport,
      isGenerationalTalent: isGenerational,
      isType2Eligible: isJapan && !!school
    });
  }

  const updatedState: Partial<GameWorldState> = {
    scoutMonthlyState: {
      lastScoutedMonth: currentMonth,
      scoutedThisMonth: true,
      prospects,
      signedPlayerId: undefined
    }
  };

  return { prospects, updatedState };
}

/**
 * Sign a scouted prospect into user club (either standard pro or Type 2 High School)
 */
export function signScoutedProspect(
  state: GameWorldState,
  prospectId: string,
  asType2: boolean = false
): { updatedState: GameWorldState; signedPlayer: Player; newsItem: NewsItem } {
  if (!state.userClubId) {
    throw new Error('No user club assigned.');
  }

  const prospect = state.scoutMonthlyState?.prospects?.find(p => p.id === prospectId);
  if (!prospect) {
    throw new Error('Prospect not found.');
  }

  const userClub = state.clubs[state.userClubId];

  // Build real player
  const newPlayer: Player = {
    id: `signed_${prospect.id}`,
    name: prospect.name,
    age: prospect.age,
    birthDate: prospect.birthDate,
    nationality: prospect.nationality,
    position: prospect.position,
    altPositions: prospect.altPositions,
    preferredPositions: [prospect.position, ...prospect.altPositions],
    secondaryPositions: prospect.altPositions,
    historicalPositions: [],
    positionProficiency: { [prospect.position]: 1.0 },
    preferredFoot: prospect.preferredFoot,
    ovr: prospect.ovr,
    initialOvr: prospect.ovr,
    exactOvr: prospect.ovr,
    potential: prospect.potential,
    pace: prospect.pace,
    shooting: prospect.shooting,
    passing: prospect.passing,
    dribbling: prospect.dribbling,
    defending: prospect.defending,
    physical: prospect.physical,
    gk: prospect.gk,
    marketValue: prospect.marketValue,
    wage: asType2 ? 800 : prospect.wage,
    contractYears: asType2 ? 1 : 3,
    clubId: userClub.id,
    currentClubId: userClub.id,
    squadRole: prospect.isGenerationalTalent ? '絶対的主力' : (asType2 ? '若手・育成枠' : '控え・バックアップ'),
    isLoaned: false,
    squadStatus: 'BENCH',
    playstyle: prospect.playstyle,
    personality: prospect.personality,
    managerTrust: 80,
    relationships: [],
    condition: prospect.isGenerationalTalent ? 'pink' : 'yellow',
    fatigue: 0,
    stamina: 82,
    inMatchStamina: 100,
    injuryStatus: 'HEALTHY',
    injury: { isInjured: false },
    suspension: { isSuspended: false, matchesRemaining: 0 },
    stats: {
      appearances: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      avgRating: 0
    },
    shirtNumber: Math.floor(Math.random() * 50) + 35,
    // Type 2 High School registration settings
    isType2Registered: asType2,
    type2HighSchool: asType2 ? (prospect.schoolOrAcademy || '提携高校') : undefined,
    type2UnavailableDates: asType2 ? [
      // Major high school championship & inter-high conflict windows
      '2026-10-24', '2026-10-25', '2026-11-01', '2026-11-03', '2026-11-08',
      '2026-12-28', '2026-12-29', '2026-12-31', '2027-01-02', '2027-01-04'
    ] : undefined
  };

  const updatedPlayers = { ...state.players, [newPlayer.id]: newPlayer };
  const updatedClubs = { ...state.clubs };
  if (!updatedClubs[userClub.id].playerIds.includes(newPlayer.id)) {
    updatedClubs[userClub.id] = {
      ...userClub,
      playerIds: [...userClub.playerIds, newPlayer.id]
    };
  }

  const headline = asType2
    ? `【2種登録完了】${userClub.name}、${newPlayer.type2HighSchool}の逸材・${newPlayer.name}選手をトップ登録`
    : `【新星獲得】${userClub.name}、スカウト網により発掘された${newPlayer.name}選手と正式契約締結！`;

  const body = prospect.isGenerationalTalent
    ? `【衝撃】世界を震撼させる超新星の出現！${userClub.name}は本日、総合値${newPlayer.ovr}、潜在能力${newPlayer.potential}という「10年に1人の怪物」${newPlayer.name}選手との契約を電撃発表しました。世界中のスカウトが息を呑む超大型契約です。`
    : asType2
      ? `${userClub.name}は${newPlayer.type2HighSchool}在学中の${newPlayer.name}選手（${newPlayer.age}歳）のJFA・Jリーグ特別指定・2種登録を完了しました。高校公式戦（選手権予選など）の日程を除き、トップチーム公式戦への出場が可能となります。`
      : `${userClub.name}はスカウティングレポートに基づき、${prospect.originRegion}から発掘された${newPlayer.name}選手（${newPlayer.age}歳、OVR: ${newPlayer.ovr} / POT: ${newPlayer.potential}）の完全獲得を発表しました。`;

  const newsItem: NewsItem = {
    id: `news_scout_sign_${Date.now()}`,
    date: state.currentDate,
    headline,
    body,
    category: 'transfer',
    relatedClubId: userClub.id,
    importance: prospect.isGenerationalTalent ? 'high' : 'medium'
  };

  const updatedNews = [newsItem, ...state.news];

  const updatedScoutState = {
    ...state.scoutMonthlyState,
    signedPlayerId: newPlayer.id
  };

  const updatedState: GameWorldState = {
    ...state,
    players: updatedPlayers,
    clubs: updatedClubs,
    news: updatedNews,
    scoutMonthlyState: updatedScoutState
  };

  return { updatedState, signedPlayer: newPlayer, newsItem };
}

/**
 * Check if a Type 2 player is unavailable due to high school matches on this date
 */
export function isType2PlayerUnavailableOnDate(player: Player, dateStr?: string): boolean {
  if (!player.isType2Registered) return false;
  if (!dateStr) return false;

  // Check explicit dates list
  if (player.type2UnavailableDates && player.type2UnavailableDates.includes(dateStr)) {
    return true;
  }

  // Check standard Japan High School Tournament windows
  const d = dateStr.slice(5); // "MM-DD"
  // Inter-High window: Aug 01 to Aug 09
  if (d >= '08-01' && d <= '08-09') return true;
  // All Japan High School Soccer Championship Qualifiers: Oct 23 - Nov 08 (weekends)
  if (d >= '10-23' && d <= '11-08') {
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true; // Saturday or Sunday
  }
  // Championship National Finals: Dec 28 - Jan 10
  if (d >= '12-28' || d <= '01-10') return true;

  return false;
}
