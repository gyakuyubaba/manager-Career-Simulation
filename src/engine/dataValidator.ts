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
    if (p.clubId === 'free_agent') {
      continue; // Free agents are valid without fixed club squad registration
    }
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
    if (p.clubId === 'free_agent') {
      continue; // Free agents are valid
    }
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

    const targetClubId = player.clubId || 'free_agent';
    const validClubId = targetClubId === 'free_agent' 
      ? 'free_agent' 
      : (clubs[targetClubId] ? targetClubId : 'free_agent');

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

/**
 * Realistically determines non-uniform potential based on age, current OVR, position, and growth trajectory.
 * Completely abolishes the uniform OVR+1 bug.
 */
export function deriveRealisticPlayerPotential(
  id: string,
  name: string,
  age: number,
  ovr: number,
  position: Position
): number {
  const hash = (id + name + position).split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

  if (age <= 19) {
    // Top young prospects: large growth headroom (+8 to +17)
    const baseGap = 8 + (hash % 10);
    return Math.min(96, Math.max(ovr + 6, ovr + baseGap));
  } else if (age <= 22) {
    // Emerging young stars (+4 to +11)
    const baseGap = 4 + (hash % 8);
    return Math.min(94, Math.max(ovr + 3, ovr + baseGap));
  } else if (age <= 25) {
    // Developing talents (+2 to +7)
    const baseGap = 2 + (hash % 6);
    return Math.min(92, Math.max(ovr + 1, ovr + baseGap));
  } else if (age <= 29) {
    // Prime players (+0 to +3)
    const baseGap = (hash % 4);
    return Math.min(94, ovr + baseGap);
  } else if (age <= 33) {
    // Mature veterans: ceiling equals OVR or slightly lower (-2 to +1)
    const diff = (hash % 4) - 2;
    return Math.min(93, Math.max(ovr - 2, ovr + diff));
  } else if (age <= 36) {
    // Experienced veterans: physical decline begins (-1 to -4)
    const decline = 1 + (hash % 4);
    return Math.max(50, ovr - decline);
  } else {
    // Late veterans (37+): gradual decline (-2 to -6)
    const decline = 2 + (hash % 5);
    return Math.max(50, ovr - decline);
  }
}

/**
 * Updates a player's shirt number with duplication verification and confirmation logic.
 */
export function updatePlayerShirtNumber(
  players: Record<string, Player>,
  clubs: Record<string, Club>,
  clubId: string,
  playerId: string,
  newShirtNumber: number,
  forceSwap: boolean = false
): {
  updatedPlayers: Record<string, Player>;
  conflictPlayer?: Player;
  success: boolean;
  message: string;
} {
  const targetPlayer = players[playerId];
  if (!targetPlayer) {
    return { updatedPlayers: players, success: false, message: '選手が見つかりませんでした。' };
  }

  const validNum = Math.max(1, Math.min(99, Math.floor(newShirtNumber)));
  const club = clubs[clubId];
  const clubPlayerIds = club?.playerIds || [];

  // Check if someone else in the same club currently wears this number
  const conflictPlayer = clubPlayerIds
    .map(pId => players[pId])
    .find(p => p && p.id !== playerId && p.shirtNumber === validNum);

  if (conflictPlayer && !forceSwap) {
    return {
      updatedPlayers: players,
      conflictPlayer,
      success: false,
      message: `背番号 #${validNum} は既に ${conflictPlayer.name} が着用しています。`
    };
  }

  const updated = { ...players };

  if (conflictPlayer && forceSwap) {
    // Swap numbers between the two players
    const oldNum = targetPlayer.shirtNumber;
    updated[conflictPlayer.id] = {
      ...conflictPlayer,
      shirtNumber: oldNum
    };
    updated[targetPlayer.id] = {
      ...targetPlayer,
      shirtNumber: validNum
    };
    return {
      updatedPlayers: updated,
      success: true,
      message: `${targetPlayer.name} に #${validNum}、${conflictPlayer.name} に #${oldNum} を割り当てました。`
    };
  }

  updated[targetPlayer.id] = {
    ...targetPlayer,
    shirtNumber: validNum
  };

  return {
    updatedPlayers: updated,
    success: true,
    message: `${targetPlayer.name} の背番号を #${validNum} に変更しました。`
  };
}

/**
 * Requirement 5: 既存セーブデータの修復 (REPAIR_SAVE_DATA_INTEGRITY)
 * ロード時にデータの整合性を安全に検証・修復
 * - 大会開始前なのに試合済みになっている未来の試合をupcomingにリセット
 * - 開催日程より先のラウンドや決勝前の不正な優勝クラブを取り消し
 * - プレシーズンの試合が公式個人成績に混入している場合に再計算・分離
 * - 重複試合の二重計上を防止
 * - 既存のバックアップを作成した上で実行
 */
export function REPAIR_SAVE_DATA_INTEGRITY(
  state: GameWorldState
): { state: GameWorldState; repairsCount: number; repairLogs: string[] } {
  let repairsCount = 0;
  const repairLogs: string[] = [];
  const currentDate = state.currentDate || '2026-07-01';
  const seasonYear = parseInt(state.season?.split('/')[0], 10) || 2026;

  // 1. Repair fixtures: find matches finished with future date or ahead of schedule
  const seenMatchIds = new Set<string>();
  const repairedFixtures: MatchFixture[] = [];

  state.fixtures.forEach(f => {
    // Deduplication check
    if (seenMatchIds.has(f.id)) {
      repairsCount++;
      repairLogs.push(`[重複試合除外] 重複マッチID "${f.id}" を除外しました。`);
      return;
    }
    seenMatchIds.add(f.id);

    // If fixture is marked finished but date is strictly after currentDate, reset to upcoming!
    if (f.status === 'finished' && f.date > currentDate) {
      repairsCount++;
      repairLogs.push(`[未来試合修復] ${f.competitionName || f.competition} (${f.date}) がゲーム日(${currentDate})より先なのに終了扱いになっていたため、未実施(upcoming)に安全復元しました。`);
      repairedFixtures.push({
        ...f,
        status: 'upcoming',
        homeScore: undefined,
        awayScore: undefined,
        events: undefined,
        stats: undefined,
        isResultApplied: false,
        extraTimePlayed: undefined,
        penaltyShootout: undefined
      });
      return;
    }

    repairedFixtures.push(f);
  });

  // 2. Repair Tournaments state
  const tournaments = (state.tournaments || {}) as Record<string, any>;
  const isCupTournament = (k: string) => k.includes('cup') || ['copa-del-rey', 'dfb-pokal', 'coppa-italia', 'coupe-de-france', 'ucl', 'uel', 'uecl'].includes(k);

  Object.entries(tournaments).forEach(([cupKey, t]: [string, any]) => {
    if (t.startDate && currentDate < t.startDate) {
      if (t.status !== 'not_started' || t.championClubId) {
        repairsCount++;
        repairLogs.push(`[未開始大会修復] ${t.name} は開幕前(${t.startDate})のため、未開始状態に修復し優勝設定をクリアしました。`);
        t.status = 'not_started';
        t.championClubId = undefined;
        t.runnerUpClubId = undefined;
      }
    }
  });

  // 3. Repair player stats: separate any pre-season stats from official competitive stats
  const officialFinishedFixtures = repairedFixtures.filter(
    f => f.status === 'finished' && f.competition !== 'pre-season' && f.competitionType !== 'preseason'
  );
  const preseasonFinishedFixtures = repairedFixtures.filter(
    f => f.status === 'finished' && (f.competition === 'pre-season' || f.competitionType === 'preseason')
  );

  const repairedPlayers = { ...state.players };
  const repairedClubs = { ...state.clubs };

  // 3a. Ko Itakura (板倉 滉) club assignment audit: strictly Borussia Mönchengladbach (mgladbach)
  Object.values(repairedPlayers).forEach(p => {
    if (p.name.includes('板倉') && p.clubId !== 'mgladbach') {
      const oldClubId = p.clubId;
      if (repairedClubs[oldClubId]) {
        repairedClubs[oldClubId].playerIds = repairedClubs[oldClubId].playerIds.filter(id => id !== p.id);
      }
      p.clubId = 'mgladbach';
      p.currentClubId = 'mgladbach';
      if (repairedClubs['mgladbach'] && !repairedClubs['mgladbach'].playerIds.includes(p.id)) {
        repairedClubs['mgladbach'].playerIds.push(p.id);
      }
      repairsCount++;
      repairLogs.push(`[所属クラブ修正] 板倉滉選手をボルシアMG (mgladbach) へ正常配置しました。`);
    }
  });

  // 3b. European clubs Japanese players audit: Evict non-European domestic/orphan Japanese players from Arsenal and all European clubs
  const VALID_EURO_JAPANESE_PLAYERS = new Set([
    'arsenal_takehiro_tomiyasu',
    'liverpool_wataru_endo',
    'crystal_palace_daichi_kamada',
    'palace_kamada',
    'brighton_kaoru_mitoma',
    'southampton_sugawara',
    'southampton_yukinari_sugawara',
    'real_sociedad_takefusa_kubo',
    'sociedad_kubo',
    'bayern_hiroki_ito',
    'freiburg_ritsu_doan',
    'mgladbach_ko_itakura',
    'mainz_kaishu_sano',
    'parma_zion_suzuki',
    'monaco_takumi_minamino',
    'reims_junya_ito',
    'reims_keito_nakamura',
    'leeds_ao_tanaka'
  ]);

  const INVALID_J3_ORPHAN_IDS = new Set(['JP_000401', 'JP_000402', 'JP_000403', 'JP_000404', 'JP_000405']);
  const INVALID_ARSENAL_JAPANESE_NAMES = new Set(['矢野 貴章', '細川 淳矢', '端戸 仁', '浅川 隼人', '藤本 憲明']);
  const isInvalidJapaneseName = (name?: string): boolean => {
    if (!name) return false;
    const stripped = name.replace(/[\s\-_・·\.\,\'\"\(\)]/g, '');
    return (
      INVALID_ARSENAL_JAPANESE_NAMES.has(name) ||
      stripped === '矢野貴章' ||
      stripped === '細川淳矢' ||
      stripped === '端戸仁' ||
      stripped === '浅川隼人' ||
      stripped === '藤本憲明'
    );
  };

  // Purge the 5 non-existent J3 players from existence completely
  INVALID_J3_ORPHAN_IDS.forEach(badId => {
    if (repairedPlayers[badId]) {
      const p = repairedPlayers[badId];
      const cId = p.clubId;
      if (repairedClubs[cId]) {
        repairedClubs[cId].playerIds = repairedClubs[cId].playerIds.filter(id => id !== badId);
      }
      delete repairedPlayers[badId];
      repairsCount++;
      repairLogs.push(`[不要選手完全削除] 存在しないJ3所属選手 ${p.name} (${badId}) を名簿から完全削除しました。`);
    }
  });

  // Check all European clubs:
  Object.values(repairedClubs).forEach(club => {
    if (club.country !== '日本') {
      const playersToEvict: string[] = [];
      club.playerIds.forEach(pId => {
        const p = repairedPlayers[pId];
        if (!p) {
          playersToEvict.push(pId);
          return;
        }
        if (isInvalidJapaneseName(p.name)) {
          playersToEvict.push(pId);
          return;
        }
        if (p.nationality === '日本') {
          const isAllowedEuroJapanese = VALID_EURO_JAPANESE_PLAYERS.has(p.id) ||
            p.name.includes('冨安') ||
            p.name.includes('遠藤 航') ||
            p.name.includes('三笘') ||
            p.name.includes('久保') ||
            p.name.includes('伊藤 洋輝') ||
            p.name.includes('堂安') ||
            p.name.includes('板倉') ||
            p.name.includes('鎌田') ||
            p.name.includes('菅原') ||
            p.name.includes('佐野 海舟') ||
            p.name.includes('鈴木 彩艶') ||
            p.name.includes('南野') ||
            p.name.includes('伊東 純也') ||
            p.name.includes('中村 敬斗') ||
            p.name.includes('田中 碧');

          if (!isAllowedEuroJapanese) {
            playersToEvict.push(pId);
            p.clubId = 'free_agent';
            p.currentClubId = 'free_agent';
            if (repairedClubs['free_agent'] && !repairedClubs['free_agent'].playerIds.includes(p.id)) {
              repairedClubs['free_agent'].playerIds.push(p.id);
            }
            repairsCount++;
            repairLogs.push(`[欧州クラブ誤配備選手除外] ${p.name} 選手を ${club.name} の名簿から除外しました。`);
          }
        }
      });

      if (playersToEvict.length > 0) {
        club.playerIds = club.playerIds.filter(id => !playersToEvict.includes(id));
      }
    }
  });

  // Also sweep repairedPlayers directly to ensure non-existent Japanese players are completely cleared
  const allEvictedPlayerIds = new Set<string>([...INVALID_J3_ORPHAN_IDS]);
  Object.values(repairedPlayers).forEach(p => {
    if (isInvalidJapaneseName(p.name)) {
      allEvictedPlayerIds.add(p.id);
      delete repairedPlayers[p.id];
      repairsCount++;
      repairLogs.push(`[実在外選手完全抹消] 実在しない選手 ${p.name} (${p.id}) を完全削除しました。`);
    }
  });

  // Ensure all clubs playerIds remove allEvictedPlayerIds
  Object.values(repairedClubs).forEach(c => {
    c.playerIds = c.playerIds.filter(id => !allEvictedPlayerIds.has(id));
  });

  // Ensure tactics lineups do not have deleted/evicted players
  if (state.tactics?.lineup) {
    state.tactics.lineup.bench = state.tactics.lineup.bench.filter(id => !allEvictedPlayerIds.has(id));
    if (state.tactics.lineup.reserves) {
      state.tactics.lineup.reserves = state.tactics.lineup.reserves.filter(id => !allEvictedPlayerIds.has(id));
    }
    state.tactics.lineup.starters = state.tactics.lineup.starters.filter(s => !allEvictedPlayerIds.has(s.playerId));
  }

  // 3b-2. 5-Day Injury Return Date Auto-Repair: Ensure players past their returnDate are restored to HEALTHY
  Object.values(repairedPlayers).forEach(p => {
    if (p.injuryStatus === 'INJURED' || p.injury?.isInjured) {
      const returnDate = p.injuryReturnDate || p.injury?.returnDate;
      if (returnDate && currentDate >= returnDate) {
        p.injuryStatus = 'HEALTHY';
        p.injury = { isInjured: false, recoveryDays: 0 };
        p.injuryReturnDate = undefined;
        p.injuryStartDate = undefined;
        p.injuryType = undefined;
        p.injuryDaysRemaining = 0;
        if (p.squadStatus === 'OUT_OF_SQUAD') {
          p.squadStatus = 'RESERVE';
        }
        repairsCount++;
        repairLogs.push(`[怪我復帰修復] 復帰予定日(${returnDate})を経過した${p.name}をHEALTHYに復帰させました。`);
      }
    }
  });

  // 3c. Repair player stats & fix 58 appearances bug:
  // Reconstruct player appearances and stats strictly from official finished fixtures
  const clubOfficialMatchesMap = new Map<string, MatchFixture[]>();
  officialFinishedFixtures.forEach(f => {
    if (f.homeClubId) {
      if (!clubOfficialMatchesMap.has(f.homeClubId)) clubOfficialMatchesMap.set(f.homeClubId, []);
      clubOfficialMatchesMap.get(f.homeClubId)!.push(f);
    }
    if (f.awayClubId) {
      if (!clubOfficialMatchesMap.has(f.awayClubId)) clubOfficialMatchesMap.set(f.awayClubId, []);
      clubOfficialMatchesMap.get(f.awayClubId)!.push(f);
    }
  });

  Object.values(repairedPlayers).forEach(p => {
    const clubMatches = clubOfficialMatchesMap.get(p.clubId) || [];
    const maxPossibleApps = clubMatches.length;

    // Condition A: Club has not played any official matches yet (e.g. July/August pre-season)
    if (maxPossibleApps === 0) {
      if (p.stats.appearances > 0 || p.stats.goals > 0 || p.stats.assists > 0 || p.stats.cleanSheets > 0) {
        repairsCount++;
        repairLogs.push(`[プレシーズン成績分離・架空シーズン同期] ${p.name} 選手の公式戦未消化時の成績 (出場${p.stats.appearances}試合) を0にリセットし、架空シーズン(${state.season || '2026/27'})と同期しました。`);
        if (!p.preseasonStats && (p.stats.appearances > 0 || p.stats.goals > 0)) {
          p.preseasonStats = { ...p.stats };
        } else if (p.preseasonStats) {
          p.preseasonStats.appearances = Math.max(p.preseasonStats.appearances, p.stats.appearances);
          p.preseasonStats.goals = Math.max(p.preseasonStats.goals, p.stats.goals);
          p.preseasonStats.assists = Math.max(p.preseasonStats.assists, p.stats.assists);
        }
        p.stats = {
          appearances: 0,
          starts: 0,
          minutes: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          yellowCards: 0,
          redCards: 0,
          avgRating: 0,
          saves: 0,
          goalsConceded: 0
        };
        p.competitionStats = {};
      }
    } else {
      // Condition B: Club has played official matches in this game season:
      // Reconcile and calculate player stats strictly from in-game finished fixtures
      let actualGoals = 0;
      let actualAssists = 0;
      let actualYellows = 0;
      let actualReds = 0;
      const compEventsMap: Record<string, { goals: number; assists: number; yellows: number; reds: number; matches: Set<string> }> = {};

      clubMatches.forEach(f => {
        const cKey = f.competition;
        if (!compEventsMap[cKey]) {
          compEventsMap[cKey] = { goals: 0, assists: 0, yellows: 0, reds: 0, matches: new Set() };
        }
        let playerParticipatedInMatch = false;
        if (f.stats?.playerRatings && f.stats.playerRatings[p.id] !== undefined) {
          playerParticipatedInMatch = true;
        }

        (f.events || []).forEach(e => {
          if (e.playerId === p.id) {
            playerParticipatedInMatch = true;
            if (e.type === 'goal') {
              actualGoals++;
              compEventsMap[cKey].goals++;
            }
            if (e.type === 'yellow_card') {
              actualYellows++;
              compEventsMap[cKey].yellows++;
            }
            if (e.type === 'red_card' || e.type === 'second_yellow') {
              actualReds++;
              compEventsMap[cKey].reds++;
            }
          }
          if (e.assistPlayerId === p.id && e.type === 'goal') {
            playerParticipatedInMatch = true;
            actualAssists++;
            compEventsMap[cKey].assists++;
          }
        });

        if (playerParticipatedInMatch) {
          compEventsMap[cKey].matches.add(f.id);
        }
      });

      // Clamp appearances strictly to maxPossibleApps
      let clampedApps = Math.min(maxPossibleApps, Math.max(0, p.stats.appearances || 0));
      const minRequiredApps = Math.max(actualGoals > 0 ? 1 : 0, actualAssists > 0 ? 1 : 0);
      clampedApps = Math.min(maxPossibleApps, Math.max(clampedApps, minRequiredApps));

      const statsDiffer = p.stats.goals !== actualGoals ||
        p.stats.assists !== actualAssists ||
        p.stats.appearances !== clampedApps ||
        p.stats.yellowCards !== actualYellows ||
        p.stats.redCards !== actualReds;

      if (statsDiffer) {
        repairsCount++;
        repairLogs.push(`[架空シーズン個人成績完全同期] ${p.name} 選手の今季個人成績をゲーム内の実試合シミュレーション記録（出場:${clampedApps}/${maxPossibleApps}試合, 得点:${actualGoals}, アシスト:${actualAssists}）へ完全同期しました。`);
        p.stats.appearances = clampedApps;
        p.stats.starts = Math.min(clampedApps, p.stats.starts ?? clampedApps);
        p.stats.minutes = p.stats.starts * 90 + Math.max(0, clampedApps - p.stats.starts) * 25;
        p.stats.goals = actualGoals;
        p.stats.assists = actualAssists;
        p.stats.yellowCards = actualYellows;
        p.stats.redCards = actualReds;
        if (clampedApps === 0) {
          p.stats.avgRating = 0;
          p.stats.cleanSheets = 0;
        } else if (!p.stats.avgRating || p.stats.avgRating <= 0) {
          p.stats.avgRating = 6.6;
        }
      }

      // Rebuild competitionStats accurately
      if (!p.competitionStats) p.competitionStats = {};
      Object.entries(compEventsMap).forEach(([cKey, d]) => {
        const cMatches = clubMatches.filter(m => m.competition === cKey);
        const cApps = Math.min(cMatches.length, Math.max(d.matches.size, Math.min(clampedApps, cMatches.length)));
        p.competitionStats![cKey] = {
          appearances: cApps,
          starts: cApps,
          minutes: cApps * 90,
          goals: d.goals,
          assists: d.assists,
          cleanSheets: (p.position === 'GK' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position))
            ? cMatches.filter(m => (m.homeClubId === p.clubId && m.awayScore === 0) || (m.awayClubId === p.clubId && m.homeScore === 0)).length
            : 0,
          yellowCards: d.yellows,
          redCards: d.reds,
          avgRating: p.stats.avgRating || 6.6,
          saves: 0,
          goalsConceded: 0
        };
      });
    }
  });

  const repairedState: GameWorldState = {
    ...state,
    fixtures: repairedFixtures,
    clubs: repairedClubs,
    players: repairedPlayers,
    tournaments: tournaments as any
  };

  return {
    state: repairedState,
    repairsCount,
    repairLogs
  };
}


