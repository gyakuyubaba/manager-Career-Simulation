import { Player, Position, PlayStyle, PlayerPersonality, PlayerCondition } from '../types/game';
import { deriveRealisticAltPositions } from './playerPositionsHelper';

// Helper to construct fully structured real players
export function makeRealPlayer(
  id: string,
  name: string,
  clubId: string,
  position: Position,
  age: number,
  nationality: string,
  ovr: number,
  potential: number,
  marketValue: number,
  wage: number,
  shirtNumber: number,
  preferredFoot: '右' | '左' | '両足' = '右',
  playstyle: PlayStyle = 'チャンスメイカー',
  param14?: Position[] | PlayerPersonality,
  param15?: Position[] | PlayerPersonality,
  condition: PlayerCondition = 'yellow'
): Player {
  const isGk = position === 'GK';
  const isDef = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position);
  const isMid = ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position);
  const isFwd = ['ST', 'CF', 'LW', 'RW'].includes(position);

  let resolvedPersonality: PlayerPersonality = 'プロフェッショナル';
  let resolvedAltPositions: Position[] = [];

  if (Array.isArray(param14)) {
    resolvedAltPositions = param14;
    if (typeof param15 === 'string') {
      resolvedPersonality = param15 as PlayerPersonality;
    }
  } else if (typeof param14 === 'string') {
    resolvedPersonality = param14 as PlayerPersonality;
    if (Array.isArray(param15)) {
      resolvedAltPositions = param15;
    }
  }

  // If no alternative positions provided, procedurally derive realistic ones
  if (resolvedAltPositions.length === 0) {
    resolvedAltPositions = deriveRealisticAltPositions(position, preferredFoot, playstyle, name);
  }

  // Derive realistic attributes from OVR and position
  const pace = Math.min(99, Math.max(45, isFwd ? ovr + 2 : isDef ? ovr - 4 : ovr - 2));
  const shooting = Math.min(99, Math.max(30, isFwd ? ovr : isMid ? ovr - 6 : isDef ? ovr - 25 : 18));
  const passing = Math.min(99, Math.max(35, isMid ? ovr + 1 : isFwd ? ovr - 5 : isDef ? ovr - 8 : 45));
  const dribbling = Math.min(99, Math.max(35, isFwd ? ovr + 1 : isMid ? ovr : isDef ? ovr - 12 : 25));
  const defending = Math.min(99, Math.max(25, isDef ? ovr + 2 : position === 'CDM' ? ovr : isMid ? ovr - 12 : 35));
  const physical = Math.min(99, Math.max(45, isDef || position === 'ST' ? ovr : ovr - 3));
  const gk = isGk ? ovr : 12;
  const stamina = Math.min(98, Math.max(68, isMid ? ovr + 3 : isDef ? ovr : ovr - 2) - (age >= 33 ? (age - 32) * 2 : 0));

  return {
    id,
    name,
    age,
    birthDate: (() => {
      const hash = (id + name).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const bMonth = ((hash % 12) + 1);
      const bDay = ((hash % 28) + 1);
      // As of 2026-07-01: if birthday has already passed this year (month <= 6), birthYear = 2026 - age.
      // If birthday is later in the year (month >= 7), birthday hasn't occurred yet, so birthYear = 2026 - age - 1 = 2025 - age.
      const bYear = bMonth <= 6 ? (2026 - age) : (2025 - age);
      return `${bYear}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;
    })(),
    nationality,
    position,
    altPositions: resolvedAltPositions,
    preferredFoot,
    ovr,
    potential,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
    gk,
    stamina,
    inMatchStamina: stamina,
    marketValue,
    wage,
    contractYears: Math.max(1, Math.min(5, 2028 - (2025 - (id.length % 3)))),
    clubId,
    squadRole: ovr >= 85 ? '絶対的主力' : ovr >= 78 ? '重要選手' : ovr >= 73 ? 'ローテーション' : '控え・バックアップ',
    isLoaned: false,
    playstyle,
    personality: resolvedPersonality,
    managerTrust: 85,
    relationships: [],
    condition,
    fatigue: 5 + (shirtNumber % 12),
    injury: { isInjured: false },
    suspension: { isSuspended: false, matchesRemaining: 0 },
    stats: { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0 },
    shirtNumber,
    isTransferListed: false,
    isLoanListed: false,
    accumulatedYellowCards: {},
    accumulatedRedCards: {}
  };
}
