import { Position, Player, PlayStyle } from '../types/game';

// Known real-world versatility registry for famous players
const FAMOUS_PLAYERS_VERSATILITY: Record<string, Position[]> = {
  // --- Japanese Stars ---
  '久保 建英': ['LW', 'CAM', 'CF', 'RM'],
  '三笘 薫': ['LM', 'RW', 'CAM'],
  '遠藤 航': ['CM', 'CB'],
  '佐野 海舟': ['CM', 'CB', 'RB'],
  '大迫 勇也': ['CF', 'CAM'],
  '武藤 嘉紀': ['ST', 'LW', 'RM', 'CF'],
  '酒井 高徳': ['LB', 'RWB', 'LWB', 'CDM'],
  '初瀬 亮': ['LWB', 'LM', 'RB'],
  '伊藤 洋輝': ['LB', 'LWB'],
  '冨安 健洋': ['RB', 'LB', 'CB'],
  '前田 大然': ['ST', 'CF', 'RW'],
  '伊東 純也': ['RM', 'LW', 'RWB'],
  '堂安 律': ['CAM', 'RM', 'LW'],
  '南野 拓実': ['LW', 'ST', 'CF', 'RW'],
  '鎌田 大地': ['CM', 'CF', 'LW'],
  '守田 英正': ['CDM', 'CAM'],
  '田中 碧': ['CDM', 'CAM'],
  '旗手 怜央': ['CAM', 'LB', 'LW'],
  '中村 敬斗': ['LM', 'ST', 'RW'],
  '小川 航基': ['CF'],
  '上田 綺世': ['CF'],
  '相馬 勇紀': ['RW', 'LM', 'LWB'],
  '細谷 真大': ['CF', 'RW'],
  '渡辺 皓太': ['CDM', 'CAM'],
  '喜田 拓也': ['CM'],
  'アンデルソン・ロペス': ['CF', 'RW'],
  'エウベル': ['RW', 'LM', 'CF'],
  'ヤン・マテウス': ['LW', 'RM'],
  'エドゥアルド': ['LB'],
  '畠中 槙之輔': ['CDM'],
  '谷口 彰悟': ['CDM'],
  '中山 雄太': ['CB', 'LWB'],
  '町田 浩樹': ['LB'],
  '渡辺 剛': ['RB'],
  '毎熊 晟矢': ['RWB', 'RM', 'RW'],
  '菅原 由勢': ['RWB', 'RM', 'RW'],
  '佐々木 大樹': ['CAM', 'CM', 'CF', 'LW'],
  '井手口 陽介': ['CDM', 'CAM'],
  '扇原 貴宏': ['CB', 'CM'],
  '宮代 大聖': ['CF', 'LW', 'RW', 'CAM'],
  '家長 昭博': ['RW', 'CAM', 'RM'],
  '脇坂 泰斗': ['CAM', 'CM', 'LW'],
  'マテウス・サヴィオ': ['CAM', 'LW', 'RW', 'CM'],
  '師岡 柊生': ['CF', 'CAM'],
  '名古 新太郎': ['CF', 'ST'],
  '三井寺 眞': ['LW', 'RW', 'CM'],

  // --- European Elite Stars ---
  'Bukayo Saka': ['RM', 'LW', 'RWB'],
  'Martin Ødegaard': ['CM', 'RW'],
  'Martin Odegaard': ['CM', 'RW'],
  'Declan Rice': ['CM', 'CB'],
  'William Saliba': ['RB'],
  'Gabriel Magalhães': ['LB'],
  'Kai Havertz': ['CF', 'CAM', 'RW'],
  'Leandro Trossard': ['CF', 'ST', 'CAM', 'RW'],
  'Gabriel Martinelli': ['ST', 'RW'],
  'Rodri': ['CM', 'CB'],
  'Kevin De Bruyne': ['CM', 'RW', 'CAM'],
  'Erling Haaland': ['CF'],
  'Phil Foden': ['RW', 'LW', 'CM', 'CAM'],
  'Bernardo Silva': ['RW', 'CAM', 'RM', 'CM'],
  'Mohamed Salah': ['ST', 'CF', 'RM'],
  'Trent Alexander-Arnold': ['RWB', 'CM', 'CDM'],
  'Jude Bellingham': ['CM', 'CF', 'ST'],
  'Vinícius Júnior': ['ST', 'CF', 'RW'],
  'Vinicius Junior': ['ST', 'CF', 'RW'],
  'Kylian Mbappé': ['LW', 'CF'],
  'Kylian Mbappe': ['LW', 'CF'],
  'Federico Valverde': ['RW', 'RM', 'RB'],
  'Eduardo Camavinga': ['CM', 'LB', 'LWB'],
  'Aurélien Tchouaméni': ['CM', 'CB'],
  'Aurelien Tchouameni': ['CM', 'CB'],
  'Dani Carvajal': ['RWB', 'CB'],
  'Lamine Yamal': ['RM', 'LW', 'CAM'],
  'Pedri': ['CAM', 'LW'],
  'Gavi': ['CAM', 'LW', 'CDM'],
  'Robert Lewandowski': ['CF'],
  'Raphinha': ['RW', 'CF', 'ST'],
  'Matheus Cunha': ['CF', 'LW'],
  'Jules Koundé': ['CB', 'RWB'],
  'Jules Kounde': ['CB', 'RWB'],
  'Alejandro Balde': ['LWB', 'LM'],
  'Jamal Musiala': ['LW', 'CM', 'RW'],
  'Florian Wirtz': ['LW', 'RW', 'CM'],
  'Harry Kane': ['CF', 'CAM'],
  'Joshua Kimmich': ['RB', 'CM', 'RWB'],
  'Alphonso Davies': ['LWB', 'LM', 'LW'],
  'Son Heung-min': ['CF', 'LW', 'RW', 'ST'],
  'Cole Palmer': ['CAM', 'RW', 'RM', 'CF']
};

export function isNagoShintaro(player: { id?: string; name?: string }): boolean {
  const n = player.name || '';
  return player.id === 'JP_J1_000071' || n.includes('名古') || n.toLowerCase().includes('shintaro nago');
}

export function playerHasCfAptitude(player: {
  position: Position;
  altPositions?: Position[];
  secondaryPositions?: Position[];
  preferredPositions?: Position[];
  positionProficiency?: Partial<Record<Position, number>>;
}): boolean {
  if (player.position === 'CF') return true;
  if (player.preferredPositions?.includes('CF')) return true;
  if (player.altPositions?.includes('CF')) return true;
  if (player.secondaryPositions?.includes('CF')) return true;
  if ((player.positionProficiency?.CF ?? 0) >= 0.90) return true;
  return false;
}

/**
 * Procedurally derive realistic alternative positions based on player attributes, position, foot, and playstyle
 */
export function deriveRealisticAltPositions(
  position: Position,
  preferredFoot: '右' | '左' | '両足' = '右',
  playstyle?: PlayStyle,
  playerName?: string
): Position[] {
  // 1. Check known stars dictionary first
  if (playerName) {
    for (const [key, alts] of Object.entries(FAMOUS_PLAYERS_VERSATILITY)) {
      if (playerName.includes(key) || key.includes(playerName)) {
        return alts.filter(p => p !== position);
      }
    }
  }

  // 2. Procedural realistic positions based on tactical archetype
  const alts: Position[] = [];

  switch (position) {
    case 'GK':
      return []; // Goalkeepers only play GK

    case 'CB':
      // Center backs frequently cover full-back or defensive midfield
      if (preferredFoot === '左') {
        alts.push('LB');
        if (playstyle === 'ボール運べるCB' || playstyle === 'アンカー') {
          alts.push('CDM');
        }
      } else {
        if (playstyle === 'ボール運べるCB' || playstyle === 'アンカー') {
          alts.push('CDM', 'RB');
        } else {
          alts.push('RB', 'CDM');
        }
      }
      break;

    case 'LB':
      // Left backs naturally play Left Wing Back and Left Midfield
      alts.push('LWB');
      if (playstyle === '守備的SB' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('LM');
        if (preferredFoot === '右' || preferredFoot === '両足') {
          alts.push('RB');
        }
      }
      break;

    case 'RB':
      // Right backs naturally play Right Wing Back and Right Midfield
      alts.push('RWB');
      if (playstyle === '守備的SB' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('RM');
        if (preferredFoot === '左' || preferredFoot === '両足') {
          alts.push('LB');
        }
      }
      break;

    case 'LWB':
      alts.push('LB', 'LM', 'LW');
      break;

    case 'RWB':
      alts.push('RB', 'RM', 'RW');
      break;

    case 'CDM':
      alts.push('CM');
      if (playstyle === 'アンカー' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('CAM');
      }
      break;

    case 'CM':
      alts.push('CDM', 'CAM');
      if (playstyle === 'ボックストゥボックス') {
        alts.push('LM', 'RM');
      }
      break;

    case 'CAM':
      alts.push('CM', 'CF');
      if (playstyle === 'チャンスメイカー') {
        alts.push('LW', 'RW');
      } else if (playstyle === 'ゴールゲッター' || playstyle === 'シャドーストライカー') {
        alts.push('ST');
      }
      break;

    case 'LM':
      alts.push('LW', 'LWB', 'CM');
      if (preferredFoot === '右' || preferredFoot === '両足') {
        alts.push('RM');
      }
      break;

    case 'RM':
      alts.push('RW', 'RWB', 'CM');
      if (preferredFoot === '左' || preferredFoot === '両足') {
        alts.push('LM');
      }
      break;

    case 'LW':
      // Modern wingers are highly versatile across flanks and attack
      alts.push('RW', 'LM', 'CF');
      if (playstyle === 'ゴールゲッター' || playstyle === 'ラインブレイカー') {
        alts.push('ST');
      } else {
        alts.push('CAM');
      }
      break;

    case 'RW':
      alts.push('LW', 'RM', 'CAM');
      if (playstyle === 'ゴールゲッター' || playstyle === 'ラインブレイカー') {
        alts.push('ST');
      } else {
        alts.push('CF');
      }
      break;

    case 'CF':
      alts.push('ST', 'CAM', 'LW', 'RW');
      break;

    case 'ST':
      alts.push('CF');
      if (playstyle === '俊足ドリブラー' || playstyle === 'スピードスター' || playstyle === 'ラインブレイカー') {
        alts.push('LW', 'RW');
      } else if (playstyle === 'チャンスメイカー' || playstyle === 'シャドーストライカー') {
        alts.push('CAM');
      }
      break;
  }

  // Remove own position and duplicates
  return Array.from(new Set(alts)).filter(p => p !== position);
}

/**
 * Derives historical positions a player has played earlier in their career
 */
export function deriveRealisticHistoricalPositions(
  position: Position,
  altPositions: Position[] = [],
  age: number = 25,
  name?: string
): Position[] {
  if (position === 'GK') return [];

  const historical: Position[] = [];

  // 1. Check known historical stars transitions
  if (name) {
    if (name.includes('久保') || name.includes('Kubo')) historical.push('CAM', 'ST');
    if (name.includes('三笘') || name.includes('Mitoma')) historical.push('LWB', 'ST');
    if (name.includes('遠藤') || name.includes('Endo')) historical.push('CB', 'RB');
    if (name.includes('冨安') || name.includes('Tomiyasu')) historical.push('CB', 'CDM');
    if (name.includes('菅原') || name.includes('Sugawara')) historical.push('CB', 'RM');
    if (name.includes('堂安') || name.includes('Doan')) historical.push('CAM', 'ST');
    if (name.includes('南野') || name.includes('Minamino')) historical.push('ST', 'LW');
    if (name.includes('Haaland')) historical.push('LW');
    if (name.includes('Mbappé') || name.includes('Mbappe')) historical.push('RW', 'ST');
    if (name.includes('Rice')) historical.push('CB');
    if (name.includes('Bellingham')) historical.push('CDM', 'ST');
    if (name.includes('Alexander-Arnold')) historical.push('CM');
    if (name.includes('Saka')) historical.push('LB', 'LWB');
    if (name.includes('Davies')) historical.push('LW', 'LM');
  }

  // 2. Realistic football career progression archetypes for experienced players
  if (age >= 23) {
    switch (position) {
      case 'CB':
        historical.push('CDM');
        break;
      case 'LB':
      case 'RB':
        historical.push('LM', 'RM');
        break;
      case 'CDM':
        historical.push('CM', 'CB');
        break;
      case 'CM':
        historical.push('CAM', 'CDM');
        break;
      case 'CAM':
        historical.push('CM', 'CF', 'LW', 'RW');
        break;
      case 'LW':
      case 'RW':
        historical.push('LM', 'RM', 'CAM');
        break;
      case 'ST':
      case 'CF':
        historical.push('LW', 'RW', 'CAM');
        break;
      case 'LM':
      case 'RM':
        historical.push('LW', 'RW', 'LB', 'RB');
        break;
    }
  }

  // Filter out primary and existing alternative positions
  const excludeSet = new Set([position, ...altPositions]);
  return Array.from(new Set(historical)).filter(p => !excludeSet.has(p));
}

/**
 * Calculates continuous position proficiency ratio (0.0 to 1.0)
 */
export function calculatePlayerPositionProficiency(player: {
  id?: string;
  name?: string;
  position: Position;
  altPositions?: Position[];
  secondaryPositions?: Position[];
  preferredPositions?: Position[];
  historicalPositions?: Position[];
  positionProficiency?: Partial<Record<Position, number>>;
}): Partial<Record<Position, number>> {
  const map: Partial<Record<Position, number>> = {};

  // 1. Primary position (100% capacity)
  map[player.position] = 1.0;

  if (player.position === 'GK') {
    return map;
  }

  // Merge any pre-existing explicit proficiencies
  if (player.positionProficiency) {
    (Object.entries(player.positionProficiency) as [Position, number][]).forEach(([pos, val]) => {
      if (pos !== 'GK' && typeof val === 'number') {
        map[pos] = val;
      }
    });
  }

  // 2. Alternative positions (98% capacity - minimal penalty)
  const alts = (player.altPositions && player.altPositions.length > 0)
    ? player.altPositions
    : (player.secondaryPositions || []);
  alts.forEach(pos => {
    if (pos !== 'GK' && map[pos] === undefined) map[pos] = 0.98;
  });

  // 3. Historical positions (95% capacity)
  const historical = player.historicalPositions || [];
  historical.forEach(pos => {
    if (pos !== 'GK' && map[pos] === undefined) map[pos] = 0.95;
  });

  // 4. Closely related compatible positions (92% capacity)
  const relatedRoles: Record<Position, Position[]> = {
    GK: [],
    CB: ['LB', 'RB', 'CDM'],
    LB: ['LWB', 'LM', 'CB'],
    RB: ['RWB', 'RM', 'CB'],
    LWB: ['LB', 'LM', 'LW'],
    RWB: ['RB', 'RM', 'RW'],
    CDM: ['CM', 'CB'],
    CM: ['CDM', 'CAM', 'LM', 'RM'],
    CAM: ['CM', 'ST', 'CF', 'LW', 'RW'],
    LM: ['LW', 'LWB', 'CM'],
    RM: ['RW', 'RWB', 'CM'],
    LW: ['LM', 'RW', 'ST', 'CAM'],
    RW: ['RM', 'LW', 'ST', 'CAM'],
    CF: ['ST', 'CAM', 'LW', 'RW'],
    ST: ['CF', 'CAM', 'LW', 'RW']
  };

  const related = relatedRoles[player.position] || [];
  related.forEach(pos => {
    if (pos !== 'GK' && map[pos] === undefined) map[pos] = 0.92;
  });

  // 5. Same field sector (Defenders, Midfielders, Forwards) (88% capacity)
  const isDef = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(player.position);
  const isMid = ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(player.position);
  const isFwd = ['LW', 'RW', 'CF', 'ST'].includes(player.position);

  const ALL_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];
  ALL_POSITIONS.forEach(pos => {
    if (pos === 'GK' || map[pos] !== undefined) return;
    if (isDef && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) {
      map[pos] = 0.88;
    } else if (isMid && ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) {
      map[pos] = 0.88;
    } else if (isFwd && ['LW', 'RW', 'CF', 'ST'].includes(pos)) {
      map[pos] = 0.88;
    } else {
      map[pos] = 0.82;
    }
  });

  // Global rule: Players with CF aptitude get ST = 1.0 (S), without adding CF to anyone who lacks it
  if (playerHasCfAptitude({ ...player, positionProficiency: map })) {
    map.ST = 1.0;
  }

  // Specific rule: Shintaro Nago CM proficiency capped at B (<= 0.92)
  if (isNagoShintaro(player)) {
    map.CM = Math.min(map.CM ?? 0.92, 0.92);
  }

  return map;
}

export interface PlayablePositionGrade {
  position: Position;
  grade: 'S' | 'A' | 'B' | 'C';
  symbol: '◎' | '○' | '△';
  label: string;
  category: '本職' | 'サブ適性' | '過去の経験ポジション' | '類似・起用可能';
  proficiencyPercent: number;
}

/**
 * Returns all playable positions for a player with football-realistic grades
 */
export function getPlayablePositionsWithGrades(player: Player): PlayablePositionGrade[] {
  const result: PlayablePositionGrade[] = [];
  const nagoFlag = isNagoShintaro(player);
  const hasCf = playerHasCfAptitude(player);

  const addOrUpgradeGrade = (entry: PlayablePositionGrade) => {
    // Shintaro Nago CM cap: strictly B max
    if (nagoFlag && entry.position === 'CM') {
      entry = {
        position: 'CM',
        grade: 'B',
        symbol: '△',
        label: '類似ポジション・戦術的起用可 (92%)',
        category: '類似・起用可能',
        proficiencyPercent: 92
      };
    }
    const idx = result.findIndex(r => r.position === entry.position);
    if (idx === -1) {
      result.push(entry);
    } else {
      const rank = { S: 4, A: 3, B: 2, C: 1 };
      if (rank[entry.grade] > rank[result[idx].grade]) {
        result[idx] = entry;
      }
    }
  };

  // 1. Primary position (◎ 本職 - Grade S)
  addOrUpgradeGrade({
    position: player.position,
    grade: 'S',
    symbol: '◎',
    label: '本職・最高適性 (100%)',
    category: '本職',
    proficiencyPercent: 100
  });

  // Global rule: CF aptitude -> ST is Grade S
  if (hasCf && player.position !== 'GK') {
    addOrUpgradeGrade({
      position: 'ST',
      grade: 'S',
      symbol: '◎',
      label: '本職級・CF連動ST適性 (100%)',
      category: '本職',
      proficiencyPercent: 100
    });
  }

  // Explicit positionProficiency overrides (>= 0.90)
  if (player.position !== 'GK' && player.positionProficiency) {
    (Object.entries(player.positionProficiency) as [Position, number][]).forEach(([pos, val]) => {
      if (pos === 'GK' || typeof val !== 'number') return;
      if (val >= 0.99) {
        addOrUpgradeGrade({
          position: pos,
          grade: 'S',
          symbol: '◎',
          label: '本職・最高適性 (100%)',
          category: '本職',
          proficiencyPercent: 100
        });
      } else if (val >= 0.96) {
        addOrUpgradeGrade({
          position: pos,
          grade: 'A',
          symbol: '◎',
          label: `サブ適性・高い適応力 (${Math.round(val * 100)}%)`,
          category: 'サブ適性',
          proficiencyPercent: Math.round(val * 100)
        });
      } else if (val >= 0.94) {
        addOrUpgradeGrade({
          position: pos,
          grade: 'A',
          symbol: '○',
          label: `過去の起用実績・経験ポジション (${Math.round(val * 100)}%)`,
          category: '過去の経験ポジション',
          proficiencyPercent: Math.round(val * 100)
        });
      } else if (val >= 0.90) {
        addOrUpgradeGrade({
          position: pos,
          grade: 'B',
          symbol: '△',
          label: `類似ポジション・戦術的起用可 (${Math.round(val * 100)}%)`,
          category: '類似・起用可能',
          proficiencyPercent: Math.round(val * 100)
        });
      }
    });
  }

  // 2. Alternative positions (◎ サブ適性 - Grade A)
  const rawAlts = (player.secondaryPositions && player.secondaryPositions.length > 0)
    ? player.secondaryPositions
    : (player.altPositions && player.altPositions.length > 0)
      ? player.altPositions
      : deriveRealisticAltPositions(player.position, player.preferredFoot, player.playstyle, player.name);

  const alts = nagoFlag ? rawAlts.filter(p => p !== 'CM') : rawAlts;

  alts.forEach(pos => {
    if (pos !== player.position && !(nagoFlag && pos === 'CM')) {
      addOrUpgradeGrade({
        position: pos,
        grade: 'A',
        symbol: '◎',
        label: 'サブ適性・高い適応力 (98%)',
        category: 'サブ適性',
        proficiencyPercent: 98
      });
    }
  });

  // 3. Historical positions (○ 過去の経験ポジション)
  const rawHistorical = (player.historicalPositions && player.historicalPositions.length > 0)
    ? player.historicalPositions
    : deriveRealisticHistoricalPositions(player.position, alts, player.age, player.name);
  const historical = nagoFlag ? rawHistorical.filter(p => p !== 'CM') : rawHistorical;

  historical.forEach(pos => {
    if (pos !== player.position && !(nagoFlag && pos === 'CM')) {
      addOrUpgradeGrade({
        position: pos,
        grade: 'A',
        symbol: '○',
        label: '過去の起用実績・経験ポジション (95%)',
        category: '過去の経験ポジション',
        proficiencyPercent: 95
      });
    }
  });

  // 4. Closely related compatible roles (△ 類似・起用可能 - Grade B)
  const relatedRoles: Record<Position, Position[]> = {
    GK: [],
    CB: ['LB', 'RB', 'CDM'],
    LB: ['LWB', 'LM', 'CB'],
    RB: ['RWB', 'RM', 'CB'],
    LWB: ['LB', 'LM', 'LW'],
    RWB: ['RB', 'RM', 'RW'],
    CDM: ['CM', 'CB'],
    CM: ['CDM', 'CAM', 'LM', 'RM'],
    CAM: ['CM', 'ST', 'CF', 'LW', 'RW'],
    LM: ['LW', 'LWB', 'CM'],
    RM: ['RW', 'RWB', 'CM'],
    LW: ['LM', 'RW', 'ST', 'CAM'],
    RW: ['RM', 'LW', 'ST', 'CAM'],
    CF: ['ST', 'CAM', 'LW', 'RW'],
    ST: ['CF', 'CAM', 'LW', 'RW']
  };

  const compatibles = relatedRoles[player.position] || [];
  compatibles.forEach(pos => {
    addOrUpgradeGrade({
      position: pos,
      grade: 'B',
      symbol: '△',
      label: '類似ポジション・戦術的起用可 (92%)',
      category: '類似・起用可能',
      proficiencyPercent: 92
    });
  });

  if (nagoFlag) {
    const cmIdx = result.findIndex(r => r.position === 'CM');
    const cappedCm: PlayablePositionGrade = {
      position: 'CM',
      grade: 'B',
      symbol: '△',
      label: '類似ポジション・戦術的起用可 (92%)',
      category: '類似・起用可能',
      proficiencyPercent: 92
    };
    if (cmIdx >= 0) result[cmIdx] = cappedCm;
    else result.push(cappedCm);
  }

  return result;
}

/**
 * Ensures player object has complete position flexibility fields populated
 */
export function ensurePlayerRealisticAltPositions(player: Player): Player {
  const nagoFlag = isNagoShintaro(player);
  const rawAlts = (player.altPositions && player.altPositions.length > 0)
    ? player.altPositions
    : deriveRealisticAltPositions(player.position, player.preferredFoot, player.playstyle, player.name);

  const alts = nagoFlag ? rawAlts.filter(p => p !== 'CM') : rawAlts;

  const rawHistorical = (player.historicalPositions && player.historicalPositions.length > 0)
    ? player.historicalPositions
    : deriveRealisticHistoricalPositions(player.position, alts, player.age, player.name);
  const historical = nagoFlag ? rawHistorical.filter(p => p !== 'CM') : rawHistorical;

  const profMap = calculatePlayerPositionProficiency({
    id: player.id,
    name: player.name,
    position: player.position,
    altPositions: alts,
    secondaryPositions: nagoFlag ? (player.secondaryPositions || alts).filter(p => p !== 'CM') : player.secondaryPositions,
    preferredPositions: player.preferredPositions,
    historicalPositions: historical,
    positionProficiency: player.positionProficiency
  });

  return {
    ...player,
    preferredPositions: player.preferredPositions || [player.position],
    secondaryPositions: nagoFlag ? (player.secondaryPositions || alts).filter(p => p !== 'CM') : (player.secondaryPositions || alts),
    historicalPositions: historical,
    positionProficiency: profMap,
    altPositions: alts
  };
}

