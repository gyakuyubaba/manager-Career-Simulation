import { Player, Club, GameWorldState, StandingsRow, MatchFixture, TeamTactics, YouthProspect, Position, PlayStyle, PlayerPersonality } from '../types/game';
import { deriveRealisticAltPositions } from '../data/playerPositionsHelper';
import { generateSingleRandomYouthProspect, generateRandomYouthAcademy } from '../data/youthGenerator';

export interface IntegrityCheckResult {
  isValid: boolean;
  duplicateIds: string[];
  duplicateNames: string[];
  clubMismatches: string[];
  repairedCount: number;
  logs: string[];
}

/**
 * 【11.1 PLAYER_DUPLICATE_CHECK (選手ID重複チェック)】
 * Checks that every playerId is 100% globally unique and no player is cloned.
 */
export function PLAYER_DUPLICATE_CHECK(
  players: Record<string, Player>
): { valid: boolean; duplicates: string[]; logs: string[] } {
  const seenIds = new Set<string>();
  const seenNames = new Map<string, string>();
  const duplicates: string[] = [];
  const logs: string[] = [];

  for (const [id, player] of Object.entries(players)) {
    if (seenIds.has(id)) {
      duplicates.push(id);
      logs.push(`[DUPLICATE_ID] 選手ID "${id}" (${player.name}) が重複して存在します。`);
    }
    seenIds.add(id);

    const norm = player.name.trim().toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龥]/g, '');
    if (seenNames.has(norm)) {
      duplicates.push(id);
      logs.push(`[DUPLICATE_NAME] 同一選手 "${player.name}" が別ID (${seenNames.get(norm)} と ${id}) で重複登録されています。`);
    } else {
      seenNames.set(norm, id);
    }
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
    logs
  };
}

/**
 * 【11.2 CLUB_MEMBERSHIP_CHECK (クラブ所属一元管理チェック)】
 * Ensures 1 player belongs to exactly 1 club and club.playerIds matches player.currentClubId.
 */
export function CLUB_MEMBERSHIP_CHECK(
  players: Record<string, Player>,
  clubs: Record<string, Club>
): { valid: boolean; mismatches: string[]; logs: string[] } {
  const mismatches: string[] = [];
  const logs: string[] = [];
  const playerClubOwnership = new Map<string, string>();

  // Check clubs' playerIds lists
  for (const [cId, club] of Object.entries(clubs)) {
    club.playerIds.forEach(pId => {
      if (playerClubOwnership.has(pId)) {
        mismatches.push(pId);
        logs.push(`[MULTI_CLUB_MEMBERSHIP] 選手ID "${pId}" がクラブ "${playerClubOwnership.get(pId)}" と "${cId}" の両方に二重所属しています。`);
      } else {
        playerClubOwnership.set(pId, cId);
      }
    });
  }

  // Check players' clubId vs club.playerIds
  for (const [pId, p] of Object.entries(players)) {
    if (!clubs[p.clubId]) {
      mismatches.push(pId);
      logs.push(`[INVALID_CLUB] 選手 "${p.name}" (${pId}) が存在しないクラブ "${p.clubId}" に所属しています。`);
    } else {
      const club = clubs[p.clubId];
      if (!club.playerIds.includes(pId)) {
        mismatches.push(pId);
        logs.push(`[ROSTER_MISSING] 選手 "${p.name}" (${pId}) が所属クラブ "${club.name}" の名簿に登録されていません。`);
      }
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
    logs
  };
}

/**
 * 【Requirement 5 & TEST 13】PLAYER_DATABASE_INTEGRITY_CHECK
 * - 重複playerId
 * - 同一人物の重複
 * - 複数クラブ所属
 * - 存在しないクラブ
 * - 存在しないポジション
 */
export function PLAYER_DATABASE_INTEGRITY_CHECK(
  players: Record<string, Player>,
  clubs: Record<string, Club>
): {
  valid: boolean;
  errors: string[];
  totalPlayers: number;
  averagePerClub: number;
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const playerInMultipleClubs = new Map<string, string>();
  const VALID_POSITIONS: string[] = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

  // Check clubs rosters
  for (const [cId, club] of Object.entries(clubs)) {
    const clubPlayerIds = club.playerIds || [];
    clubPlayerIds.forEach(pId => {
      if (playerInMultipleClubs.has(pId)) {
        errors.push(`[複数クラブ所属] 選手ID "${pId}" がクラブ "${playerInMultipleClubs.get(pId)}" と "${cId}" に二重登録されています。`);
      } else {
        playerInMultipleClubs.set(pId, cId);
      }
    });
  }

  // Check players
  for (const [pId, p] of Object.entries(players)) {
    // 1. Duplicate playerId check
    if (seenIds.has(pId)) {
      errors.push(`[重複playerId] ID "${pId}" が重複しています。`);
    }
    seenIds.add(pId);

    // 2. Non-existent club
    if (!p.clubId || !clubs[p.clubId]) {
      errors.push(`[存在しないクラブ] 選手 "${p.name}" (${pId}) の所属先 "${p.clubId}" が存在しません。`);
    } else {
      const club = clubs[p.clubId];
      if (!club.playerIds.includes(pId)) {
        errors.push(`[名簿不一致] 選手 "${p.name}" (${pId}) が所属クラブ "${club.name}" の名簿に含まれていません。`);
      }
    }

    // 3. Valid position check
    if (!p.position || !VALID_POSITIONS.includes(p.position)) {
      errors.push(`[存在しないポジション] 選手 "${p.name}" (${pId}) のポジション "${p.position}" が不正です。`);
    }
  }

  const totalPlayers = Object.keys(players).length;
  const clubCount = Object.keys(clubs).length || 1;
  const averagePerClub = Math.round(totalPlayers / clubCount);

  return {
    valid: errors.length === 0,
    errors,
    totalPlayers,
    averagePerClub
  };
}

/**
 * 【11.3 INJURY_ELIGIBILITY_CHECK (怪我選手・出場資格チェック)】
 * Checks that no injured player is in starters or bench.
 */
export function INJURY_ELIGIBILITY_CHECK(
  tactics: TeamTactics,
  players: Record<string, Player>,
  currentDate?: string
): { valid: boolean; violations: string[]; logs: string[] } {
  const violations: string[] = [];
  const logs: string[] = [];

  const starterIds = tactics.lineup.starters.map(s => s.playerId);
  const benchIds = tactics.lineup.bench;

  starterIds.forEach(id => {
    const p = players[id];
    if (p) {
      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
      const isBeforeReturn = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;
      if (isInjured || isBeforeReturn) {
        violations.push(id);
        logs.push(`[INJURY_VIOLATION_STARTER] 負傷中の選手 "${p.name}" (${id}) がスタメンに登録されています。`);
      }
      if (p.suspension?.isSuspended) {
        violations.push(id);
        logs.push(`[SUSPENSION_VIOLATION] 出場停止中の選手 "${p.name}" (${id}) がスタメンに登録されています。`);
      }
    }
  });

  benchIds.forEach(id => {
    const p = players[id];
    if (p) {
      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
      const isBeforeReturn = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;
      if (isInjured || isBeforeReturn) {
        violations.push(id);
        logs.push(`[INJURY_VIOLATION_BENCH] 負傷中の選手 "${p.name}" (${id}) がベンチに登録されています。`);
      }
    }
  });

  return {
    valid: violations.length === 0,
    violations,
    logs
  };
}

/**
 * 【11.4 MATCH_RESULT_CHECK (試合結果反映チェック)】
 * Verifies that all finished matches are properly applied to the world.
 */
export function MATCH_RESULT_CHECK(
  fixtures: MatchFixture[]
): { valid: boolean; unreflectedCount: number; logs: string[] } {
  const logs: string[] = [];
  let unreflectedCount = 0;

  fixtures.forEach(f => {
    if (f.status === 'finished') {
      if (f.homeScore === undefined || f.awayScore === undefined) {
        unreflectedCount++;
        logs.push(`[RESULT_MISSING] 終了済み試合 "${f.id}" にスコアが記録されていません。`);
      }
    }
  });

  return {
    valid: unreflectedCount === 0,
    unreflectedCount,
    logs
  };
}

/**
 * 【11.5 STANDINGS_CHECK (順位表整合性チェック)】
 * Ensures points = won*3 + drawn and goalDiff = GF - GA.
 */
export function STANDINGS_CHECK(
  standings: Record<string, StandingsRow[]>
): { valid: boolean; discrepancies: string[]; logs: string[] } {
  const discrepancies: string[] = [];
  const logs: string[] = [];

  for (const [leagueKey, rows] of Object.entries(standings)) {
    rows.forEach(r => {
      const calcPoints = (r.won * 3) + r.drawn;
      if (r.points !== calcPoints) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_MATH_ERROR] ${leagueKey}の${r.clubName}: 勝ち点記録値(${r.points})と計算値(${calcPoints})が一致しません。`);
      }
      if (r.goalsFor - r.goalsAgainst !== r.goalDiff) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_GD_ERROR] ${r.clubName}: 得失点差記録値(${r.goalDiff})と計算値(${r.goalsFor - r.goalsAgainst})が一致しません。`);
      }
      if (r.played !== (r.won + r.drawn + r.lost)) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_GAMES_ERROR] ${r.clubName}: 試合数(${r.played})と勝敗合計(${r.won + r.drawn + r.lost})が一致しません。`);
      }
    });
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
    logs
  };
}

/**
 * Full master check & auto-repair system (PLAYER_DATA_INTEGRITY_CHECK)
 */
export function checkPlayerDataIntegrity(
  players: Record<string, Player>,
  clubs: Record<string, Club>
): { players: Record<string, Player>; clubs: Record<string, Club>; result: IntegrityCheckResult } {
  const result: IntegrityCheckResult = {
    isValid: true,
    duplicateIds: [],
    duplicateNames: [],
    clubMismatches: [],
    repairedCount: 0,
    logs: []
  };

  const cleanPlayers: Record<string, Player> = {};
  const seenCanonical = new Map<string, string>();

  for (const [pId, player] of Object.entries(players)) {
    if (!player || !player.id || !player.name) continue;

    // Strict Diogo Jota filter
    if (player.name.toLowerCase().includes('diogo jota') || player.id.includes('jota')) {
      result.logs.push(`[INTEGRITY] Removed excluded player: ${player.name} (${player.id})`);
      result.repairedCount++;
      continue;
    }

    // Remove punctuation, spaces, and separators while preserving Kanji, Hiragana, Katakana, Hangul, and Latin characters
    let canonicalName = player.name.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '') || player.name.trim().toLowerCase();

    if (canonicalName && seenCanonical.has(canonicalName)) {
      const existingId = seenCanonical.get(canonicalName)!;
      const existingPlayer = cleanPlayers[existingId];
      // If belongs to a different club, disambiguate name to prevent stripping squad of players
      if (existingPlayer && existingPlayer.clubId !== player.clubId) {
        player.name = `${player.name} (${clubs[player.clubId]?.shortName || player.clubId})`;
        canonicalName = player.name.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '');
      } else {
        result.duplicateNames.push(player.name);
        result.logs.push(`[DUPLICATE DETECTED] Duplicate player found: "${player.name}" (${existingId} vs ${player.id}). Eliminating duplicate clone.`);
        result.repairedCount++;
        continue;
      }
    }

    let assignedId = player.id;
    if (cleanPlayers[assignedId]) {
      result.duplicateIds.push(assignedId);
      assignedId = `${assignedId}_fixed_${Date.now()}`;
      result.repairedCount++;
    }

    const targetClubId = player.clubId || 'arsenal';
    const validClubId = clubs[targetClubId] ? targetClubId : 'arsenal';

    const resolvedAltPositions = (player.altPositions && player.altPositions.length > 0)
      ? player.altPositions
      : deriveRealisticAltPositions(player.position, player.preferredFoot, player.playstyle, player.name);

    const normalizedPlayer: Player = {
      ...player,
      id: assignedId,
      clubId: validClubId,
      currentClubId: validClubId,
      altPositions: resolvedAltPositions,
      squadStatus: player.squadStatus || 'OUT_OF_SQUAD',
      injuryStatus: (player.injury?.isInjured || player.injuryStatus === 'INJURED') ? 'INJURED' : 'HEALTHY'
    };

    cleanPlayers[assignedId] = normalizedPlayer;
    seenCanonical.set(canonicalName, assignedId);
  }

  const cleanClubs: Record<string, Club> = {};
  for (const [cId, club] of Object.entries(clubs)) {
    cleanClubs[cId] = {
      ...club,
      playerIds: []
    };
  }

  for (const p of Object.values(cleanPlayers)) {
    if (cleanClubs[p.clubId]) {
      if (!cleanClubs[p.clubId].playerIds.includes(p.id)) {
        cleanClubs[p.clubId].playerIds.push(p.id);
      }
    }
  }

  result.isValid = result.duplicateIds.length === 0 && result.duplicateNames.length === 0;

  return {
    players: cleanPlayers,
    clubs: cleanClubs,
    result
  };
}

/**
 * PLAYER_ELIGIBILITY_CHECK & Auto Replacement
 * Priority:
 * 1. Exact same position on bench
 * 2. Adaptable position on bench
 * 3. Suitable reserve player
 * 4. Leave vacant if no suitable player and notify user
 */
export function autoReplaceIneligiblePlayers(
  starters: string[],
  bench: string[],
  clubId: string,
  players: Record<string, Player>,
  currentDate?: string
): { starters: string[]; bench: string[]; replacedCount: number; vacantCount: number } {
  const currentStarterIds = [...starters];
  let currentBenchIds = [...bench];
  let replacedCount = 0;
  let vacantCount = 0;

  const clubPlayers = Object.values(players).filter(p => p.clubId === clubId);

  const isEligible = (p: Player | undefined): boolean => {
    if (!p) return false;
    if (p.clubId !== clubId) return false;
    if (p.injury?.isInjured || p.injuryStatus === 'INJURED') return false;
    if (currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate) return false;
    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) return false;
    return true;
  };

  const ADAPTABLE_MAP: Record<string, string[]> = {
    ST: ['CF', 'RW', 'LW', 'CAM'],
    CF: ['ST', 'CAM', 'RW', 'LW'],
    LW: ['LM', 'RW', 'ST', 'CAM'],
    RW: ['RM', 'LW', 'ST', 'CAM'],
    CAM: ['CM', 'CF', 'LW', 'RW'],
    CM: ['CDM', 'CAM', 'RM', 'LM'],
    CDM: ['CM', 'CB'],
    LM: ['LW', 'LWB', 'CM', 'RM'],
    RM: ['RW', 'RWB', 'CM', 'LM'],
    LB: ['LWB', 'CB', 'RB'],
    RB: ['RWB', 'CB', 'LB'],
    LWB: ['LB', 'LM'],
    RWB: ['RB', 'RM'],
    CB: ['CDM', 'LB', 'RB'],
    GK: ['GK']
  };

  const healthyBench = currentBenchIds.map(id => players[id]).filter((p): p is Player => !!p && isEligible(p));
  const healthyReserves = clubPlayers
    .filter(p => !currentStarterIds.includes(p.id) && !currentBenchIds.includes(p.id) && isEligible(p))
    .sort((a, b) => b.ovr - a.ovr);

  // 1. Replace ineligible starters
  currentStarterIds.forEach((pId, idx) => {
    const p = players[pId];
    if (!p || !isEligible(p) || p.squadStatus === 'OUT_OF_SQUAD') {
      const isGkSlot = idx === 0 || p?.position === 'GK';
      const targetPos = isGkSlot ? 'GK' : (p?.position || 'CM');
      let candidate: Player | undefined;

      // Priority 1: Exact position bench player
      const benchExactIdx = healthyBench.findIndex(bp => bp.position === targetPos);
      if (benchExactIdx !== -1) {
        candidate = healthyBench.splice(benchExactIdx, 1)[0];
        currentBenchIds = currentBenchIds.filter(id => id !== candidate!.id);
      }

      // Priority 2: Adaptable position bench player (Outfield only!)
      if (!candidate && !isGkSlot) {
        const adaptable = ADAPTABLE_MAP[targetPos] || [];
        const benchAdaptIdx = healthyBench.findIndex(bp => bp.position !== 'GK' && adaptable.includes(bp.position));
        if (benchAdaptIdx !== -1) {
          candidate = healthyBench.splice(benchAdaptIdx, 1)[0];
          currentBenchIds = currentBenchIds.filter(id => id !== candidate!.id);
        }
      }

      // Priority 3: Suitable reserve player
      if (!candidate) {
        const resExactIdx = healthyReserves.findIndex(rp => rp.position === targetPos);
        if (resExactIdx !== -1) {
          candidate = healthyReserves.splice(resExactIdx, 1)[0];
        } else if (!isGkSlot) {
          const adaptable = ADAPTABLE_MAP[targetPos] || [];
          const resAdaptIdx = healthyReserves.findIndex(rp => rp.position !== 'GK' && adaptable.includes(rp.position));
          if (resAdaptIdx !== -1) {
            candidate = healthyReserves.splice(resAdaptIdx, 1)[0];
          }
        }
      }

      if (candidate) {
        currentStarterIds[idx] = candidate.id;
        candidate.squadStatus = 'STARTING';
        if (p) p.squadStatus = 'OUT_OF_SQUAD';
        replacedCount++;
      } else {
        // Leave vacant if no suitable candidate available
        currentStarterIds[idx] = '';
        vacantCount++;
      }
    }
  });

  // 2. Remove / replace ineligible bench players
  const cleanBench: string[] = [];
  currentBenchIds.forEach(pId => {
    const p = players[pId];
    if (p && isEligible(p)) {
      cleanBench.push(pId);
    } else {
      if (p) p.squadStatus = 'OUT_OF_SQUAD';
      replacedCount++;
      if (healthyReserves.length > 0) {
        const replacement = healthyReserves.shift()!;
        replacement.squadStatus = 'BENCH';
        cleanBench.push(replacement.id);
      }
    }
  });

  return {
    starters: currentStarterIds,
    bench: cleanBench.slice(0, 9),
    replacedCount,
    vacantCount
  };
}

export const PLAYER_ELIGIBILITY_CHECK = autoReplaceIneligiblePlayers;

/**
 * Requirement 1 & 2: 選手 → 選手の自由な手動入替処理
 * 対象: スタメン、ベンチ、控え、全ポジション
 * 負傷・出場停止・別クラブ・レンタル中選手は選択不可
 */
export function executePlayerReplacement(
  tactics: TeamTactics,
  players: Record<string, Player>,
  userClubId: string,
  oldPlayerId: string,
  newPlayerId: string
): { newTactics: TeamTactics; updatedPlayers: Record<string, Player>; success: boolean; message?: string } {
  const oldPlayer = players[oldPlayerId];
  const newPlayer = players[newPlayerId];
  if (!oldPlayer || !newPlayer) {
    return { newTactics: tactics, updatedPlayers: players, success: false, message: '選手が見つかりません。' };
  }

  // Eligibility check on new replacement player
  if (newPlayer.clubId !== userClubId) {
    return { newTactics: tactics, updatedPlayers: players, success: false, message: '他クラブ所属の選手は選択できません。' };
  }
  if (newPlayer.injury?.isInjured || newPlayer.injuryStatus === 'INJURED') {
    return { newTactics: tactics, updatedPlayers: players, success: false, message: '負傷中の選手は選択できません。' };
  }
  if (newPlayer.suspension?.isSuspended || (newPlayer.suspension?.matchesRemaining || 0) > 0) {
    return { newTactics: tactics, updatedPlayers: players, success: false, message: '出場停止中の選手は選択できません。' };
  }
  if (newPlayer.isLoaned && newPlayer.loanClubId !== userClubId) {
    return { newTactics: tactics, updatedPlayers: players, success: false, message: '他クラブへレンタル中の選手は選択できません。' };
  }

  const updatedPlayers = { ...players };
  const currentStarters = [...tactics.lineup.starters];
  let currentBench = [...tactics.lineup.bench];
  let currentReserves = [...(tactics.lineup.reserves || [])];

  const oldStarterIdx = currentStarters.findIndex(s => s.playerId === oldPlayerId);
  const oldBenchIdx = currentBench.indexOf(oldPlayerId);
  const newBenchIdx = currentBench.indexOf(newPlayerId);
  const newStarterIdx = currentStarters.findIndex(s => s.playerId === newPlayerId);

  // CRITICAL REQUIREMENT: Strict GK position isolation
  // 1. Both are starters: GK and outfield player can NEVER exchange positions
  if (oldStarterIdx !== -1 && newStarterIdx !== -1) {
    const isOldGk = oldPlayer.position === 'GK' || currentStarters[oldStarterIdx].position === 'GK';
    const isNewGk = newPlayer.position === 'GK' || currentStarters[newStarterIdx].position === 'GK';
    if (isOldGk !== isNewGk) {
      return { 
        newTactics: tactics, 
        updatedPlayers: players, 
        success: false, 
        message: '【GK配置制限】GKとフィールドプレイヤーのスタメン位置交換はできません。GKは正GK枠専任です。' 
      };
    }
  }

  // 2. Old player is in Starters: new player must match slot GK type
  if (oldStarterIdx !== -1) {
    const slotIsGk = currentStarters[oldStarterIdx].position === 'GK' || oldPlayer.position === 'GK';
    if (slotIsGk && newPlayer.position !== 'GK') {
      return { 
        newTactics: tactics, 
        updatedPlayers: players, 
        success: false, 
        message: '【GK配置制限】フィールドプレイヤーはGK枠には配置できません。控えGKを選択してください。' 
      };
    }
    if (!slotIsGk && newPlayer.position === 'GK') {
      return { 
        newTactics: tactics, 
        updatedPlayers: players, 
        success: false, 
        message: '【GK配置制限】GKはフィールドプレイヤー枠には配置できません。正GK枠と交代してください。' 
      };
    }
  }

  // 3. New player is in Starters: old player must match slot GK type
  if (newStarterIdx !== -1) {
    const slotIsGk = currentStarters[newStarterIdx].position === 'GK' || newPlayer.position === 'GK';
    if (slotIsGk && oldPlayer.position !== 'GK') {
      return { 
        newTactics: tactics, 
        updatedPlayers: players, 
        success: false, 
        message: '【GK配置制限】フィールドプレイヤーはGK枠には配置できません。控えGKを選択してください。' 
      };
    }
    if (!slotIsGk && oldPlayer.position === 'GK') {
      return { 
        newTactics: tactics, 
        updatedPlayers: players, 
        success: false, 
        message: '【GK配置制限】GKはフィールドプレイヤー枠には配置できません。正GK枠と交代してください。' 
      };
    }
  }

  if (oldStarterIdx !== -1) {
    // 1. Old player is in Starters
    if (newStarterIdx !== -1) {
      // Both are in starters: directly exchange their positions (e.g. ST: A, CF: B -> ST: B, CF: A)
      currentStarters[oldStarterIdx] = {
        ...currentStarters[oldStarterIdx],
        playerId: newPlayerId
      };
      currentStarters[newStarterIdx] = {
        ...currentStarters[newStarterIdx],
        playerId: oldPlayerId
      };
    } else if (newBenchIdx !== -1) {
      // New player was on bench: swap old player onto bench
      currentStarters[oldStarterIdx] = {
        ...currentStarters[oldStarterIdx],
        playerId: newPlayerId
      };
      currentBench[newBenchIdx] = oldPlayerId;
    } else {
      // New player was in reserves
      currentStarters[oldStarterIdx] = {
        ...currentStarters[oldStarterIdx],
        playerId: newPlayerId
      };
      currentBench = currentBench.filter(id => id !== newPlayerId);
      currentReserves = currentReserves.filter(id => id !== newPlayerId);
      if (currentBench.length < 9) {
        currentBench.push(oldPlayerId);
      } else {
        if (!currentReserves.includes(oldPlayerId)) currentReserves.push(oldPlayerId);
      }
    }
  } else if (oldBenchIdx !== -1) {
    // 2. Old player is on Bench
    if (newStarterIdx !== -1) {
      // New player was starting: swap starter with old bench player
      currentStarters[newStarterIdx] = {
        ...currentStarters[newStarterIdx],
        playerId: oldPlayerId
      };
      currentBench[oldBenchIdx] = newPlayerId;
    } else if (newBenchIdx !== -1) {
      // Both on bench: swap their positions
      currentBench[oldBenchIdx] = newPlayerId;
      currentBench[newBenchIdx] = oldPlayerId;
    } else {
      // New player was in reserves
      currentBench[oldBenchIdx] = newPlayerId;
      currentReserves = currentReserves.filter(id => id !== newPlayerId);
      if (!currentReserves.includes(oldPlayerId)) currentReserves.push(oldPlayerId);
    }
  } else {
    // 3. Old player is in Reserves
    if (newStarterIdx !== -1) {
      currentStarters[newStarterIdx] = {
        ...currentStarters[newStarterIdx],
        playerId: oldPlayerId
      };
      currentReserves = currentReserves.filter(id => id !== oldPlayerId);
      if (!currentReserves.includes(newPlayerId)) currentReserves.push(newPlayerId);
    } else if (newBenchIdx !== -1) {
      currentBench[newBenchIdx] = oldPlayerId;
      currentReserves = currentReserves.filter(id => id !== oldPlayerId);
      if (!currentReserves.includes(newPlayerId)) currentReserves.push(newPlayerId);
    }
  }

  // Strict de-duplication to prevent duplicate placement of any player (Requirement 2 & TEST 06)
  const starterIdSet = new Set<string>();
  const sanitizedStarters: typeof currentStarters = [];
  currentStarters.forEach(s => {
    if (!starterIdSet.has(s.playerId)) {
      starterIdSet.add(s.playerId);
      sanitizedStarters.push(s);
    }
  });

  const sanitizedBench = currentBench.filter(id => !starterIdSet.has(id));
  const uniqueBench = Array.from(new Set(sanitizedBench)).slice(0, 9);

  // Update squad status metadata on player objects
  const isNowStarter = sanitizedStarters.some(s => s.playerId === newPlayerId);
  const isNowBench = uniqueBench.includes(newPlayerId);
  updatedPlayers[newPlayerId] = {
    ...newPlayer,
    squadStatus: isNowStarter ? 'STARTING' : isNowBench ? 'BENCH' : 'OUT_OF_SQUAD'
  };

  const isOldStarter = sanitizedStarters.some(s => s.playerId === oldPlayerId);
  const isOldBench = uniqueBench.includes(oldPlayerId);
  updatedPlayers[oldPlayerId] = {
    ...oldPlayer,
    squadStatus: isOldStarter ? 'STARTING' : isOldBench ? 'BENCH' : 'OUT_OF_SQUAD'
  };

  const newTactics: TeamTactics = {
    ...tactics,
    lineup: {
      starters: sanitizedStarters,
      bench: uniqueBench,
      reserves: currentReserves
    }
  };

  return { newTactics, updatedPlayers, success: true };
}

// -------------------------------------------------------------
// 【8. ユースアカデミー最低5名確保・ランダム生成・特級逸材】
// -------------------------------------------------------------
export function generateSingleYouthProspect(idSuffix?: string | number, clubCountry: string = '日本'): YouthProspect {
  return generateSingleRandomYouthProspect(idSuffix ?? 1, clubCountry);
}

export function ensureYouthAcademyProspects(currentAcademy?: YouthProspect[], clubCountry: string = '日本'): YouthProspect[] {
  let list = Array.isArray(currentAcademy) ? [...currentAcademy] : [];
  const activeCount = list.filter(p => !p.promoted).length;
  if (activeCount < 6) {
    const needed = 6 - activeCount;
    for (let i = 0; i < needed; i++) {
      list.push(generateSingleRandomYouthProspect(i + 1, clubCountry));
    }
  }
  return list;
}


