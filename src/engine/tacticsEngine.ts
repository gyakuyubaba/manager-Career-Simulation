import { Position, FormationName, TeamTactics, Player } from '../types/game';

export interface FormationSlot {
  position: Position;
  pitchX: number; // 0 (left) to 100 (right)
  pitchY: number; // 0 (attack) to 100 (defense/GK)
}

// Coordinate system: X: 0-100 (horizontal), Y: 0 (opponent goal) - 90 (defense) - 95 (GK)
export const FORMATION_TEMPLATES: Record<FormationName, FormationSlot[]> = {
  '4-3-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 60 },
    { position: 'CM', pitchX: 68, pitchY: 48 },
    { position: 'CM', pitchX: 32, pitchY: 48 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-3-3 Holding': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 40 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-3-3 Defensive': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 64, pitchY: 66 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CDM', pitchX: 36, pitchY: 66 },
    { position: 'RW', pitchX: 82, pitchY: 24 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 24 }
  ],
  '4-3-3 Attacking': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 50, pitchY: 58 },
    { position: 'CAM', pitchX: 66, pitchY: 40 },
    { position: 'CAM', pitchX: 34, pitchY: 40 },
    { position: 'RW', pitchX: 84, pitchY: 20 },
    { position: 'ST', pitchX: 50, pitchY: 15 },
    { position: 'LW', pitchX: 16, pitchY: 20 }
  ],
  '4-1-2-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'CM', pitchX: 65, pitchY: 48 },
    { position: 'CM', pitchX: 35, pitchY: 48 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-2-4': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'RW', pitchX: 86, pitchY: 22 },
    { position: 'ST', pitchX: 60, pitchY: 16 },
    { position: 'ST', pitchX: 40, pitchY: 16 },
    { position: 'LW', pitchX: 14, pitchY: 22 }
  ],
  '4-2-3-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 38 },
    { position: 'RW', pitchX: 82, pitchY: 34 },
    { position: 'LW', pitchX: 18, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-4-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'RM', pitchX: 84, pitchY: 48 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'LM', pitchX: 16, pitchY: 48 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-4-1-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'RM', pitchX: 84, pitchY: 48 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'LM', pitchX: 16, pitchY: 48 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-1-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'RM', pitchX: 84, pitchY: 42 },
    { position: 'CM', pitchX: 62, pitchY: 46 },
    { position: 'CM', pitchX: 38, pitchY: 46 },
    { position: 'LM', pitchX: 16, pitchY: 42 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-1-3-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'RM', pitchX: 84, pitchY: 44 },
    { position: 'CAM', pitchX: 50, pitchY: 40 },
    { position: 'LM', pitchX: 16, pitchY: 44 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-5-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 66 },
    { position: 'RM', pitchX: 86, pitchY: 46 },
    { position: 'CM', pitchX: 64, pitchY: 50 },
    { position: 'CM', pitchX: 36, pitchY: 50 },
    { position: 'LM', pitchX: 14, pitchY: 46 },
    { position: 'ST', pitchX: 50, pitchY: 18 }
  ],
  '4-2-2-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 72, pitchY: 38 },
    { position: 'CAM', pitchX: 28, pitchY: 38 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-3-1-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 70, pitchY: 56 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 30, pitchY: 56 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-3-2-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 72, pitchY: 56 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 28, pitchY: 56 },
    { position: 'CAM', pitchX: 62, pitchY: 35 },
    { position: 'CAM', pitchX: 38, pitchY: 35 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '3-5-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RWB', pitchX: 88, pitchY: 52 },
    { position: 'CDM', pitchX: 60, pitchY: 62 },
    { position: 'CDM', pitchX: 40, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 40 },
    { position: 'LWB', pitchX: 12, pitchY: 52 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-4-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RM', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'LM', pitchX: 12, pitchY: 50 },
    { position: 'RW', pitchX: 80, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 20, pitchY: 22 }
  ],
  '3-4-2-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RWB', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 56 },
    { position: 'CM', pitchX: 38, pitchY: 56 },
    { position: 'LWB', pitchX: 12, pitchY: 50 },
    { position: 'CAM', pitchX: 64, pitchY: 34 },
    { position: 'CAM', pitchX: 36, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '3-4-1-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RM', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 56 },
    { position: 'CM', pitchX: 38, pitchY: 56 },
    { position: 'LM', pitchX: 12, pitchY: 50 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-1-4-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'CDM', pitchX: 50, pitchY: 66 },
    { position: 'RM', pitchX: 88, pitchY: 48 },
    { position: 'CM', pitchX: 64, pitchY: 46 },
    { position: 'CM', pitchX: 36, pitchY: 46 },
    { position: 'LM', pitchX: 12, pitchY: 48 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-2-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'CDM', pitchX: 62, pitchY: 64 },
    { position: 'CDM', pitchX: 38, pitchY: 64 },
    { position: 'RM', pitchX: 88, pitchY: 42 },
    { position: 'CAM', pitchX: 64, pitchY: 36 },
    { position: 'CAM', pitchX: 36, pitchY: 36 },
    { position: 'LM', pitchX: 12, pitchY: 42 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '3-3-3-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 74, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 26, pitchY: 78 },
    { position: 'RWB', pitchX: 86, pitchY: 58 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'LWB', pitchX: 14, pitchY: 58 },
    { position: 'RW', pitchX: 82, pitchY: 36 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'LW', pitchX: 18, pitchY: 36 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '5-3-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'CM', pitchX: 70, pitchY: 50 },
    { position: 'CDM', pitchX: 50, pitchY: 58 },
    { position: 'CM', pitchX: 30, pitchY: 50 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '5-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'RM', pitchX: 84, pitchY: 46 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'LM', pitchX: 16, pitchY: 46 },
    { position: 'ST', pitchX: 50, pitchY: 18 }
  ],
  '5-2-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 68 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 68 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'RW', pitchX: 80, pitchY: 24 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 20, pitchY: 24 }
  ],
  '5-2-2-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 68 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 68 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'CAM', pitchX: 66, pitchY: 34 },
    { position: 'CAM', pitchX: 34, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '5-3-1-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'CM', pitchX: 70, pitchY: 52 },
    { position: 'CDM', pitchX: 50, pitchY: 58 },
    { position: 'CM', pitchX: 30, pitchY: 52 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],

  // =========================================================================
  // 【変則フォーメーション (Requirement 10: 各配置でピッチ座標が明確に異なる)】
  // =========================================================================
  '非対称4-3-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 86, pitchY: 74 },
    { position: 'CB', pitchX: 64, pitchY: 80 },
    { position: 'CB', pitchX: 38, pitchY: 80 },
    { position: 'LB', pitchX: 14, pitchY: 70 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 66, pitchY: 54 },
    { position: 'CAM', pitchX: 34, pitchY: 42 },
    { position: 'RW', pitchX: 84, pitchY: 18 },
    { position: 'ST', pitchX: 48, pitchY: 16 },
    { position: 'LW', pitchX: 22, pitchY: 28 }
  ],

  '非対称4-2-3-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 86, pitchY: 78 },
    { position: 'CB', pitchX: 65, pitchY: 80 },
    { position: 'CB', pitchX: 38, pitchY: 80 },
    { position: 'LWB', pitchX: 14, pitchY: 62 },
    { position: 'CDM', pitchX: 62, pitchY: 64 },
    { position: 'CDM', pitchX: 40, pitchY: 60 },
    { position: 'CAM', pitchX: 52, pitchY: 38 },
    { position: 'RW', pitchX: 86, pitchY: 26 },
    { position: 'CAM', pitchX: 30, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],

  'ダイヤモンド型4-4-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 65 },
    { position: 'CM', pitchX: 70, pitchY: 52 },
    { position: 'CM', pitchX: 30, pitchY: 52 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],

  'フラット型4-5-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 78 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 78 },
    { position: 'RM', pitchX: 86, pitchY: 48 },
    { position: 'CM', pitchX: 68, pitchY: 50 },
    { position: 'CM', pitchX: 50, pitchY: 50 },
    { position: 'CM', pitchX: 32, pitchY: 50 },
    { position: 'LM', pitchX: 14, pitchY: 48 },
    { position: 'ST', pitchX: 50, pitchY: 18 }
  ],

  '2トップ＋トップ下型': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 70, pitchY: 54 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 30, pitchY: 54 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'ST', pitchX: 58, pitchY: 16 },
    { position: 'ST', pitchX: 42, pitchY: 16 }
  ],

  '中央密集型': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 70, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 30, pitchY: 80 },
    { position: 'RWB', pitchX: 88, pitchY: 56 },
    { position: 'LWB', pitchX: 12, pitchY: 56 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 64, pitchY: 38 },
    { position: 'CAM', pitchX: 36, pitchY: 38 },
    { position: 'CF', pitchX: 50, pitchY: 18 }
  ],

  '両ウイング高位置型': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 60 },
    { position: 'CM', pitchX: 66, pitchY: 46 },
    { position: 'CM', pitchX: 34, pitchY: 46 },
    { position: 'RW', pitchX: 86, pitchY: 14 },
    { position: 'CF', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 14, pitchY: 14 }
  ],

  '片側ウイング偏重型': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 84, pitchY: 78 },
    { position: 'CB', pitchX: 62, pitchY: 80 },
    { position: 'CB', pitchX: 38, pitchY: 80 },
    { position: 'LB', pitchX: 16, pitchY: 68 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'CM', pitchX: 28, pitchY: 48 },
    { position: 'CAM', pitchX: 36, pitchY: 34 },
    { position: 'LW', pitchX: 18, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 18 },
    { position: 'RW', pitchX: 88, pitchY: 18 }
  ]
};

// Calculate Positional Suitability and Effective OVR
export function getPositionFitOvr(player: Player, targetPosition: Position): {
  effectiveOvr: number;
  penalty: number;
  fitGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  fitSymbol: '◎' | '○' | '△' | '✕';
  description: string;
} {
  // 1. Natural match
  if (player.position === targetPosition) {
    return { effectiveOvr: player.ovr, penalty: 0, fitGrade: 'S', fitSymbol: '◎', description: '本職・最適正' };
  }

  // 2. Listed in alternative positions
  if (player.altPositions && player.altPositions.includes(targetPosition)) {
    const penalty = 2;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A', fitSymbol: '◎', description: 'サブ適性・高い適応力' };
  }

  // 3. Closely related tactical roles
  const relatedGroups: Record<Position, Position[]> = {
    GK: [],
    CB: ['LB', 'RB', 'CDM'],
    LB: ['LWB', 'CB', 'LM'],
    RB: ['RWB', 'CB', 'RM'],
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

  if (relatedGroups[player.position]?.includes(targetPosition)) {
    const penalty = 4;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'B', fitSymbol: '○', description: '類似ポジション・起用可能' };
  }

  // 4. Same field category (Defenders, Midfielders, Forwards)
  const isDef = (pos: Position) => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
  const isMid = (pos: Position) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
  const isFwd = (pos: Position) => ['LW', 'RW', 'CF', 'ST'].includes(pos);

  if ((isDef(player.position) && isDef(targetPosition)) ||
      (isMid(player.position) && isMid(targetPosition)) ||
      (isFwd(player.position) && isFwd(targetPosition))) {
    const penalty = 8;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'C', fitSymbol: '△', description: '適性外・能力低下あり' };
  }

  // 5. Severe positional mismatch (e.g. ST at CB, or outfield at GK)
  const penalty = targetPosition === 'GK' || player.position === 'GK' ? 32 : 18;
  return { effectiveOvr: Math.max(35, player.ovr - penalty), penalty, fitGrade: 'D', fitSymbol: '✕', description: '著しい不適性・大幅減衰' };
}

// Generate updated tactics when changing formation with intelligent slot matching
export function updateTacticsFormation(
  currentTactics: TeamTactics, 
  newFormation: FormationName,
  playersMap?: Record<string, Player>
): TeamTactics {
  const template = FORMATION_TEMPLATES[newFormation];
  if (!template || template.length !== 11) return currentTactics;

  const currentStarters = [...(currentTactics.lineup?.starters || [])];
  
  // If no starters exist, return template with empty playerIds
  if (currentStarters.length === 0) {
    return {
      ...currentTactics,
      formation: newFormation,
      lineup: {
        ...currentTactics.lineup,
        starters: template.map(slot => ({
          playerId: '',
          position: slot.position,
          pitchX: slot.pitchX,
          pitchY: slot.pitchY
        }))
      }
    };
  }

  // Helper to categorize position
  const getLine = (pos: Position) => {
    if (pos === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'DF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MF';
    return 'FW';
  };

  const getSide = (x: number) => {
    if (x < 42) return 'L';
    if (x > 58) return 'R';
    return 'C';
  };

  const getSideFromPos = (pos: Position) => {
    if (['LB', 'LWB', 'LM', 'LW'].includes(pos)) return 'L';
    if (['RB', 'RWB', 'RM', 'RW'].includes(pos)) return 'R';
    return 'C';
  };

  // Find GK slot and GK starter
  const gkSlotIndex = template.findIndex(s => s.position === 'GK');
  let gkStarterIndex = currentStarters.findIndex(s => {
    const p = playersMap?.[s.playerId];
    return p?.position === 'GK' || s.position === 'GK';
  });

  const assignedSlotIndices = new Set<number>();
  const assignedStarterIndices = new Set<number>();
  const newStarters: { playerId: string; position: Position; pitchX: number; pitchY: number }[] = new Array(11);
  let newBench = [...(currentTactics.lineup?.bench || [])];

  // Assign GK strictly
  if (gkSlotIndex !== -1) {
    const gkSlot = template[gkSlotIndex];
    let assignedGkId = '';

    if (gkStarterIndex !== -1) {
      assignedGkId = currentStarters[gkStarterIndex].playerId;
      assignedStarterIndices.add(gkStarterIndex);
    } else {
      // Find GK from bench or reserves
      const benchGkId = newBench.find(bId => playersMap?.[bId]?.position === 'GK');
      if (benchGkId) {
        assignedGkId = benchGkId;
        newBench = newBench.filter(id => id !== benchGkId);
      } else {
        const reserveGkId = (currentTactics.lineup?.reserves || []).find(rId => playersMap?.[rId]?.position === 'GK');
        if (reserveGkId) {
          assignedGkId = reserveGkId;
        } else if (currentStarters.length > 0) {
          assignedGkId = currentStarters[0].playerId;
          assignedStarterIndices.add(0);
        }
      }
    }

    newStarters[gkSlotIndex] = {
      playerId: assignedGkId,
      position: gkSlot.position,
      pitchX: gkSlot.pitchX,
      pitchY: gkSlot.pitchY
    };
    assignedSlotIndices.add(gkSlotIndex);
  }

  // For remaining outfield players, match optimally to slots
  const calcAffinity = (starterIdx: number, slotIdx: number) => {
    const starter = currentStarters[starterIdx];
    const slot = template[slotIdx];
    const p = playersMap?.[starter.playerId];

    const playerPos = p?.position || starter.position;
    const slotLine = getLine(slot.position);
    const playerLine = getLine(playerPos);

    // CRITICAL REQUIREMENT: GK can NEVER play outfield slots, Outfield players can NEVER play GK slot!
    if (playerPos === 'GK' && slot.position !== 'GK') {
      return -999999;
    }
    if (playerPos !== 'GK' && slot.position === 'GK') {
      return -999999;
    }

    let score = 0;

    if (p) {
      const fit = getPositionFitOvr(p, slot.position);
      // S: 0 penalty, A: -2, B: -4, C: -8, D: -18/-32
      score += (100 - fit.penalty * 3);
    } else {
      if (playerPos === slot.position) score += 90;
      else if (playerLine === slotLine) score += 40;
    }

    // Heavy penalty for severe line crossover (e.g. ST playing CB or CB playing ST)
    if ((slotLine === 'DF' && playerLine === 'FW') || (slotLine === 'FW' && playerLine === 'DF')) {
      score -= 120;
    }

    // Side match (Left / Right / Center)
    const slotSide = getSide(slot.pitchX);
    const playerSide = getSideFromPos(playerPos);
    if (slotSide === playerSide && slotSide !== 'C') {
      score += 25;
    } else if (slotSide !== playerSide && slotSide !== 'C' && playerSide !== 'C') {
      score -= 40; // Lateral mismatch penalty
    }

    // Continuity bonus if player was already playing this position or slot
    if (starter.position === slot.position) {
      score += 30;
    }

    return score;
  };

  // Pair remaining starters to remaining slots greedily by highest affinity
  while (assignedSlotIndices.size < template.length && assignedStarterIndices.size < currentStarters.length) {
    let bestScore = -Infinity;
    let bestStarterIdx = -1;
    let bestSlotIdx = -1;

    for (let sIdx = 0; sIdx < currentStarters.length; sIdx++) {
      if (assignedStarterIndices.has(sIdx)) continue;
      for (let slIdx = 0; slIdx < template.length; slIdx++) {
        if (assignedSlotIndices.has(slIdx)) continue;
        const score = calcAffinity(sIdx, slIdx);
        if (score > bestScore) {
          bestScore = score;
          bestStarterIdx = sIdx;
          bestSlotIdx = slIdx;
        }
      }
    }

    if (bestStarterIdx !== -1 && bestSlotIdx !== -1) {
      const slot = template[bestSlotIdx];
      newStarters[bestSlotIdx] = {
        playerId: currentStarters[bestStarterIdx].playerId,
        position: slot.position,
        pitchX: slot.pitchX,
        pitchY: slot.pitchY
      };
      assignedSlotIndices.add(bestSlotIdx);
      assignedStarterIndices.add(bestStarterIdx);
    } else {
      break;
    }
  }

  // Realistic bench swap: If any outfield slot ended up with an empty playerId OR a severe mismatch (Grade D / penalty >= 18)
  // find the best matching player from bench/reserves so that defenders defend, midfielders midfield, attackers attack
  if (playersMap) {
    for (let slIdx = 0; slIdx < template.length; slIdx++) {
      const slot = template[slIdx];
      const currentAssignedId = newStarters[slIdx]?.playerId;
      const currentPlayer = currentAssignedId ? playersMap[currentAssignedId] : null;
      const fit = currentPlayer ? getPositionFitOvr(currentPlayer, slot.position) : null;

      const isSevereMismatch = !currentAssignedId || (fit && fit.fitGrade === 'D') || (slot.position !== 'GK' && currentPlayer?.position === 'GK');
      if (isSevereMismatch && newBench.length > 0) {
        // Find best bench candidate for this slot
        let bestBenchIdx = -1;
        let bestBenchScore = -Infinity;

        newBench.forEach((bId, bIdx) => {
          const bp = playersMap[bId];
          if (!bp) return;
          // CRITICAL: Never swap bench GK into outfield slot, never swap outfield into GK slot
          if (slot.position !== 'GK' && bp.position === 'GK') return;
          if (slot.position === 'GK' && bp.position !== 'GK') return;

          const bFit = getPositionFitOvr(bp, slot.position);
          if (bFit.fitGrade === 'S' || bFit.fitGrade === 'A' || bFit.fitGrade === 'B') {
            const bScore = 100 - bFit.penalty * 3 + bp.ovr;
            if (bScore > bestBenchScore) {
              bestBenchScore = bScore;
              bestBenchIdx = bIdx;
            }
          }
        });

        if (bestBenchIdx !== -1) {
          const chosenBenchId = newBench[bestBenchIdx];
          // Remove from bench
          newBench.splice(bestBenchIdx, 1);
          // If there was an old starter, send them to bench
          if (currentAssignedId) {
            newBench.push(currentAssignedId);
          }
          // Assign to slot
          newStarters[slIdx] = {
            playerId: chosenBenchId,
            position: slot.position,
            pitchX: slot.pitchX,
            pitchY: slot.pitchY
          };
        }
      }
    }
  }

  // Fill any remaining unassigned slots
  for (let slIdx = 0; slIdx < template.length; slIdx++) {
    if (!newStarters[slIdx]) {
      const slot = template[slIdx];
      newStarters[slIdx] = {
        playerId: '',
        position: slot.position,
        pitchX: slot.pitchX,
        pitchY: slot.pitchY
      };
    }
  }

  // Final Invariant Safeguard: Ensure no GK is in an outfield slot
  if (playersMap) {
    for (let slIdx = 0; slIdx < template.length; slIdx++) {
      const slot = template[slIdx];
      const s = newStarters[slIdx];
      const p = s?.playerId ? playersMap[s.playerId] : null;
      if (slot.position !== 'GK' && p?.position === 'GK') {
        // Find outfield replacement from bench
        const outfieldCandidateIdx = newBench.findIndex(bId => playersMap[bId]?.position !== 'GK');
        if (outfieldCandidateIdx !== -1) {
          const outId = newBench[outfieldCandidateIdx];
          newBench.splice(outfieldCandidateIdx, 1);
          const oldGkId = s.playerId;
          newStarters[slIdx].playerId = outId;
          newBench.unshift(oldGkId);
        }
      }
    }
  }

  return {
    ...currentTactics,
    formation: newFormation,
    lineup: {
      ...currentTactics.lineup,
      starters: newStarters,
      bench: newBench
    }
  };
}
