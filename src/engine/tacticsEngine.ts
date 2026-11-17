import { Position, FormationName, TeamTactics, Player, FreeCustomPositionCoord, AutoPlacementMode } from '../types/game';

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
  ],

  // =========================================================================
  // 【名将・最新トレンド現代戦術モデル】
  // =========================================================================
  '3-2-2-3 (WM・ボックスMF)': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 82 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 28, pitchY: 82 },
    { position: 'CDM', pitchX: 62, pitchY: 64 },
    { position: 'CDM', pitchX: 38, pitchY: 64 },
    { position: 'CAM', pitchX: 65, pitchY: 42 },
    { position: 'CAM', pitchX: 35, pitchY: 42 },
    { position: 'RW', pitchX: 86, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 14, pitchY: 22 }
  ],

  '4-3-3 偽9番 (ゼロトップ)': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 66, pitchY: 48 },
    { position: 'CM', pitchX: 34, pitchY: 48 },
    { position: 'RW', pitchX: 80, pitchY: 20 },
    { position: 'CF', pitchX: 50, pitchY: 34 },
    { position: 'LW', pitchX: 20, pitchY: 20 }
  ],

  '4-2-4 電撃カウンター型': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 78 },
    { position: 'CB', pitchX: 63, pitchY: 82 },
    { position: 'CB', pitchX: 37, pitchY: 82 },
    { position: 'LB', pitchX: 15, pitchY: 78 },
    { position: 'CM', pitchX: 60, pitchY: 56 },
    { position: 'CM', pitchX: 40, pitchY: 56 },
    { position: 'RW', pitchX: 88, pitchY: 20 },
    { position: 'ST', pitchX: 58, pitchY: 15 },
    { position: 'ST', pitchX: 42, pitchY: 15 },
    { position: 'LW', pitchX: 12, pitchY: 20 }
  ],

  '5-2-1-2 堅守速攻 (カテナチオ)': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 66 },
    { position: 'CB', pitchX: 68, pitchY: 82 },
    { position: 'CB', pitchX: 50, pitchY: 85 },
    { position: 'CB', pitchX: 32, pitchY: 82 },
    { position: 'LWB', pitchX: 12, pitchY: 66 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 38 },
    { position: 'ST', pitchX: 58, pitchY: 18 },
    { position: 'ST', pitchX: 42, pitchY: 18 }
  ],

  '3-3-3-1 全方位プレス (ビエルサ流)': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 28, pitchY: 80 },
    { position: 'RWB', pitchX: 86, pitchY: 56 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'LWB', pitchX: 14, pitchY: 56 },
    { position: 'CAM', pitchX: 68, pitchY: 36 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'CAM', pitchX: 32, pitchY: 36 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
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
  const isNago = player.id === 'JP_J1_000071' || (player.name || '').includes('名古');
  if (isNago && targetPosition === 'CM') {
    const penalty = 3;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'B', fitSymbol: '○', description: '類似ポジション・戦術的起用可 (92%)' };
  }

  // Global rule: players with CF aptitude automatically have ST = S (100%)
  const hasCf = player.position === 'CF'
    || player.preferredPositions?.includes('CF')
    || player.altPositions?.includes('CF')
    || player.secondaryPositions?.includes('CF')
    || ((player.positionProficiency?.CF ?? 0) >= 0.90);
  if (targetPosition === 'ST' && hasCf && player.position !== 'GK') {
    return { effectiveOvr: player.ovr, penalty: 0, fitGrade: 'S', fitSymbol: '◎', description: '本職・CF連動ST適性 (100%)' };
  }

  // 1. Natural match (100% capacity)
  if (player.position === targetPosition || player.preferredPositions?.includes(targetPosition)) {
    return { effectiveOvr: player.ovr, penalty: 0, fitGrade: 'S', fitSymbol: '◎', description: '本職・最適正 (100%)' };
  }

  // Check explicit positionProficiency overrides
  const explicitProf = player.positionProficiency?.[targetPosition];
  if (typeof explicitProf === 'number' && player.position !== 'GK') {
    if (explicitProf >= 0.99) {
      return { effectiveOvr: player.ovr, penalty: 0, fitGrade: 'S', fitSymbol: '◎', description: '本職・最適正 (100%)' };
    }
    if (explicitProf >= 0.96) {
      const penalty = 1;
      return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A', fitSymbol: '◎', description: `副ポジション・高い適応力 (${Math.round(explicitProf * 100)}%)` };
    }
    if (explicitProf >= 0.94) {
      const penalty = 2;
      return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A', fitSymbol: '○', description: `過去の経験ポジション・適性あり (${Math.round(explicitProf * 100)}%)` };
    }
    if (explicitProf >= 0.90) {
      const penalty = 3;
      return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'B', fitSymbol: '○', description: `類似ポジション・戦術的起用可 (${Math.round(explicitProf * 100)}%)` };
    }
  }

  // 2. Secondary / Alternative positions (98% capacity - minor penalty only)
  const isSecondary = (player.secondaryPositions && player.secondaryPositions.includes(targetPosition)) ||
                      (player.altPositions && player.altPositions.includes(targetPosition));
  if (isSecondary) {
    const penalty = 1;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A', fitSymbol: '◎', description: '副ポジション・高い適応力 (98%)' };
  }

  // 3. Historical positions (95% capacity)
  if (player.historicalPositions && player.historicalPositions.includes(targetPosition)) {
    const penalty = 2;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A', fitSymbol: '○', description: '過去の経験ポジション・適性あり (95%)' };
  }

  // 4. Closely related tactical roles (92% capacity)
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
    const penalty = 3;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'B', fitSymbol: '○', description: '類似ポジション・戦術的起用可 (92%)' };
  }

  // 5. Outfield general category (Defenders, Midfielders, Forwards) (88% capacity)
  const isDef = (pos: Position) => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
  const isMid = (pos: Position) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
  const isFwd = (pos: Position) => ['LW', 'RW', 'CF', 'ST'].includes(pos);

  if ((isDef(player.position) && isDef(targetPosition)) ||
      (isMid(player.position) && isMid(targetPosition)) ||
      (isFwd(player.position) && isFwd(targetPosition))) {
    const penalty = 6;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'C', fitSymbol: '△', description: '同系統・柔軟起用可能 (88%)' };
  }

  // 6. Emergency Outfield Cross-Sector (e.g. Defender placed at Forward) (82% capacity)
  if (player.position !== 'GK' && targetPosition !== 'GK') {
    const penalty = 10;
    return { effectiveOvr: Math.max(38, player.ovr - penalty), penalty, fitGrade: 'C', fitSymbol: '△', description: '不慣れなポジション・緊急起用 (82%)' };
  }

  // 7. GK vs Outfield mismatch (Strict separation between GK and Field players)
  const penalty = 28;
  return { effectiveOvr: Math.max(30, player.ovr - penalty), penalty, fitGrade: 'D', fitSymbol: '✕', description: '専門外ポジション・適性なし (大幅減衰)' };
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

  const syncedCustomPositions: Record<string, FreeCustomPositionCoord> = {};
  newStarters.forEach(s => {
    if (s.playerId) {
      syncedCustomPositions[s.playerId] = {
        x: Math.round((s.pitchX / 100) * 1000) / 1000,
        y: Math.round((s.pitchY / 100) * 1000) / 1000,
        position: s.position
      };
    }
  });

  return {
    ...currentTactics,
    formation: newFormation,
    placementMode: 'formation',
    customPositions: syncedCustomPositions,
    lineup: {
      ...currentTactics.lineup,
      starters: newStarters,
      bench: newBench
    }
  };
}

export function clampFreePitchCoord(
  x: number,
  y: number,
  isGk: boolean = false
): { x: number; y: number } {
  const safeX = Number.isFinite(x) ? x : 0.5;
  const safeY = Number.isFinite(y) ? y : isGk ? 0.92 : 0.5;
  if (isGk) {
    return {
      x: Math.round(Math.max(0.35, Math.min(0.65, safeX)) * 1000) / 1000,
      y: Math.round(Math.max(0.85, Math.min(0.96, safeY)) * 1000) / 1000
    };
  }
  return {
    x: Math.round(Math.max(0.06, Math.min(0.94, safeX)) * 1000) / 1000,
    y: Math.round(Math.max(0.06, Math.min(0.87, safeY)) * 1000) / 1000
  };
}

export function inferPositionFromNormalizedCoords(
  x: number,
  y: number,
  currentPos: Position,
  isGk: boolean = false
): Position {
  if (isGk || currentPos === 'GK') return 'GK';

  if (y <= 0.27) {
    if (x < 0.30) return 'LW';
    if (x > 0.70) return 'RW';
    return currentPos === 'CF' ? 'CF' : 'ST';
  }
  if (y <= 0.43) {
    if (x < 0.25) return 'LW';
    if (x > 0.75) return 'RW';
    return 'CAM';
  }
  if (y <= 0.58) {
    if (x < 0.24) return 'LM';
    if (x > 0.76) return 'RM';
    return 'CM';
  }
  if (y <= 0.70) {
    if (x < 0.24) return 'LWB';
    if (x > 0.76) return 'RWB';
    return 'CDM';
  }
  if (x < 0.27) return 'LB';
  if (x > 0.73) return 'RB';
  return 'CB';
}

export function resolveFreePlacementCollisions(
  positions: Record<string, FreeCustomPositionCoord>,
  anchorPlayerId?: string,
  gkPlayerId?: string
): Record<string, FreeCustomPositionCoord> {
  const ids = Object.keys(positions);
  if (ids.length <= 1) return positions;

  const working: Record<string, FreeCustomPositionCoord> = {};
  ids.forEach(id => {
    working[id] = { ...positions[id] };
  });

  const minDist = 0.078;
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i];
        const idB = ids[j];
        const a = working[idA];
        const b = working[idB];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        if (dist < minDist) {
          const overlap = (minDist - dist) + 0.004;
          const angle = dist > 0.0001 ? Math.atan2(dy, dx) : ((i + j) % 2 === 0 ? 0 : Math.PI / 2);
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);

          const aFixed = idA === anchorPlayerId || idA === gkPlayerId;
          const bFixed = idB === anchorPlayerId || idB === gkPlayerId;

          let pushA = 0.5;
          let pushB = 0.5;
          if (aFixed && !bFixed) {
            pushA = 0.1;
            pushB = 0.9;
          } else if (bFixed && !aFixed) {
            pushA = 0.9;
            pushB = 0.1;
          }

          const clampedA = clampFreePitchCoord(a.x - ux * overlap * pushA, a.y - uy * overlap * pushA, idA === gkPlayerId || a.position === 'GK');
          const clampedB = clampFreePitchCoord(b.x + ux * overlap * pushB, b.y + uy * overlap * pushB, idB === gkPlayerId || b.position === 'GK');

          working[idA] = { ...a, x: clampedA.x, y: clampedA.y };
          working[idB] = { ...b, x: clampedB.x, y: clampedB.y };
        }
      }
    }
  }

  return working;
}

export function syncCustomPositionsFromStarters(
  tactics: TeamTactics,
  playersMap?: Record<string, Player>
): Record<string, FreeCustomPositionCoord> {
  const existing = tactics.customPositions || {};
  const result: Record<string, FreeCustomPositionCoord> = {};

  (tactics.lineup?.starters || []).forEach(s => {
    if (!s.playerId) return;
    const isGk = playersMap?.[s.playerId]?.position === 'GK' || s.position === 'GK';
    const prev = existing[s.playerId];
    if (prev && Number.isFinite(prev.x) && Number.isFinite(prev.y)) {
      const clamped = clampFreePitchCoord(prev.x, prev.y, isGk);
      result[s.playerId] = {
        x: clamped.x,
        y: clamped.y,
        position: prev.position || s.position
      };
    } else {
      const clamped = clampFreePitchCoord((s.pitchX || 50) / 100, (s.pitchY || 50) / 100, isGk);
      result[s.playerId] = {
        x: clamped.x,
        y: clamped.y,
        position: s.position
      };
    }
  });

  return result;
}

export function applyFreePlacementMove(
  tactics: TeamTactics,
  playerId: string,
  normX: number,
  normY: number,
  isGk: boolean,
  playersMap?: Record<string, Player>
): TeamTactics {
  const baseCustom = syncCustomPositionsFromStarters(tactics, playersMap);
  const starter = (tactics.lineup?.starters || []).find(s => s.playerId === playerId);
  const clamped = clampFreePitchCoord(normX, normY, isGk);
  const inferredPos = inferPositionFromNormalizedCoords(clamped.x, clamped.y, starter?.position || (isGk ? 'GK' : 'CM'), isGk);

  baseCustom[playerId] = {
    x: clamped.x,
    y: clamped.y,
    position: inferredPos
  };

  const gkStarter = (tactics.lineup?.starters || []).find(s =>
    playersMap?.[s.playerId]?.position === 'GK' || s.position === 'GK'
  );
  const resolved = resolveFreePlacementCollisions(baseCustom, playerId, gkStarter?.playerId);

  const nextStarters = (tactics.lineup?.starters || []).map(s => {
    const coord = resolved[s.playerId];
    if (!coord) return s;
    const sIsGk = playersMap?.[s.playerId]?.position === 'GK' || s.position === 'GK';
    return {
      ...s,
      pitchX: Math.round(coord.x * 1000) / 10,
      pitchY: Math.round(coord.y * 1000) / 10,
      position: s.playerId === playerId ? (coord.position || s.position) : (sIsGk ? 'GK' : s.position)
    };
  });

  return {
    ...tactics,
    placementMode: 'free',
    customPositions: resolved,
    lineup: {
      ...tactics.lineup,
      starters: nextStarters
    }
  };
}

export function resetFreePlacementToFormation(
  tactics: TeamTactics,
  playersMap?: Record<string, Player>
): TeamTactics {
  const template = FORMATION_TEMPLATES[tactics.formation];
  if (!template || template.length !== 11) return tactics;

  const synced = updateTacticsFormation(
    { ...tactics, placementMode: 'formation', customPositions: undefined },
    tactics.formation,
    playersMap
  );
  return {
    ...synced,
    placementMode: tactics.placementMode || 'formation'
  };
}

function getRoleAttributeScore(player: Player, slotPos: Position): number {
  const stamina = player.stamina ?? Math.round((player.physical || 75) * 0.92 + 6);
  const pace = player.pace || 70;
  const shooting = player.shooting || 70;
  const passing = player.passing || 70;
  const dribbling = player.dribbling || 70;
  const defending = player.defending || 70;
  const physical = player.physical || 70;
  const gkStat = player.gk || 65;

  if (slotPos === 'GK') {
    return gkStat * 0.78 + passing * 0.12 + physical * 0.10;
  }
  if (slotPos === 'CB') {
    return defending * 0.54 + physical * 0.28 + passing * 0.10 + pace * 0.08;
  }
  if (['LB', 'RB', 'LWB', 'RWB'].includes(slotPos)) {
    return pace * 0.25 + defending * 0.30 + stamina * 0.20 + passing * 0.15 + dribbling * 0.10;
  }
  if (slotPos === 'CDM') {
    return defending * 0.38 + passing * 0.24 + physical * 0.22 + stamina * 0.16;
  }
  if (slotPos === 'CM') {
    return passing * 0.32 + stamina * 0.24 + dribbling * 0.20 + defending * 0.14 + shooting * 0.10;
  }
  if (slotPos === 'CAM') {
    return passing * 0.34 + dribbling * 0.30 + shooting * 0.24 + pace * 0.12;
  }
  if (['LM', 'RM', 'LW', 'RW'].includes(slotPos)) {
    return pace * 0.28 + dribbling * 0.28 + passing * 0.22 + shooting * 0.14 + stamina * 0.08;
  }
  return shooting * 0.42 + physical * 0.20 + pace * 0.18 + dribbling * 0.15 + passing * 0.05;
}

function getTacticalInstructionAffinity(
  player: Player,
  slotPos: Position,
  instructions?: TeamTactics['instructions']
): number {
  if (!instructions || slotPos === 'GK') return 0;
  const stamina = player.stamina ?? Math.round((player.physical || 75) * 0.92 + 6);
  let bonus = 0;

  const press = instructions.pressIntensity || '';
  const defStyle = instructions.defensiveStyle || '';
  const atkStyle = instructions.attackingStyle || '';
  const defLine = instructions.defensiveLine || '';

  if (press.includes('激') || defStyle.includes('プレス') || defStyle.includes('マン')) {
    bonus += (stamina - 70) * 0.35 + (player.pace - 70) * 0.15;
  }
  if (atkStyle.includes('ポゼッション') || atkStyle.includes('ティキタカ') || atkStyle.includes('ハーフスペース')) {
    bonus += (player.passing - 70) * 0.35 + (player.dribbling - 70) * 0.20;
  } else if (atkStyle.includes('カウンター') || atkStyle.includes('サイド')) {
    bonus += (player.pace - 70) * 0.35 + (player.shooting - 70) * 0.15;
  }
  if (defStyle.includes('ローブロック') || defStyle.includes('カテナチオ')) {
    bonus += (player.defending - 70) * 0.30 + (player.physical - 70) * 0.25;
  }
  if (defLine.includes('ハイ') && ['CB', 'LB', 'RB', 'CDM'].includes(slotPos)) {
    bonus += (player.pace - 70) * 0.28;
  }
  return bonus;
}

function getConditionFreshnessScore(player: Player): number {
  const condMap: Record<Player['condition'], number> = {
    pink: 100,
    red: 85,
    yellow: 68,
    cyan: 44,
    purple: 22
  };
  const condScore = condMap[player.condition] ?? 68;
  const fatigue = Math.max(0, Math.min(100, player.fatigue ?? 0));
  const freshness = 100 - fatigue;
  const stamina = player.stamina ?? 75;
  return freshness * 0.58 + condScore * 0.30 + stamina * 0.12;
}

export function scorePlayerForAutoSlot(
  player: Player,
  slotPos: Position,
  mode: AutoPlacementMode,
  instructions?: TeamTactics['instructions']
): number {
  const isPlayerGk = player.position === 'GK';
  const isSlotGk = slotPos === 'GK';
  if (isPlayerGk !== isSlotGk) {
    return -999999;
  }

  const fit = getPositionFitOvr(player, slotPos);
  const roleAttr = getRoleAttributeScore(player, slotPos);
  const condFresh = getConditionFreshnessScore(player);
  const tactAffinity = getTacticalInstructionAffinity(player, slotPos, instructions);
  const fatigue = Math.max(0, Math.min(100, player.fatigue ?? 0));

  switch (mode) {
    case 'overall':
      return player.ovr * 1.25 + roleAttr * 0.42 - fit.penalty * 4.5 - fatigue * 0.08;
    case 'tactical': {
      const naturalBonus = player.position === slotPos ? 26 : fit.fitGrade === 'S' ? 22 : fit.fitGrade === 'A' ? 14 : 0;
      return fit.effectiveOvr * 0.85 + roleAttr * 0.35 + tactAffinity * 0.75 + naturalBonus - fit.penalty * 6.5 - fatigue * 0.12;
    }
    case 'condition': {
      const heavyFatiguePenalty = fatigue >= 60 ? (fatigue - 55) * 1.15 : 0;
      return condFresh * 1.35 + fit.effectiveOvr * 0.55 + roleAttr * 0.25 - fit.penalty * 3.8 - heavyFatiguePenalty;
    }
    case 'balanced':
    default:
      return fit.effectiveOvr * 0.85 + roleAttr * 0.38 + condFresh * 0.48 + tactAffinity * 0.30 - fit.penalty * 4.8;
  }
}

/**
 * 4-Mode Auto-Placement Solver:
 * - 'overall': 総合能力重視
 * - 'tactical': 戦術適性重視
 * - 'condition': コンディション重視
 * - 'balanced': バランス重視
 *
 * Strictly preserves natural player.position, separates GK vs outfield,
 * and supports liveMatchPitchOnly (rearranging only the active on-pitch players during a live match).
 */
export function autoArrangeTacticsLineup(
  currentTactics: TeamTactics,
  clubPlayerIds: string[],
  playersMap: Record<string, Player>,
  mode: AutoPlacementMode = 'balanced',
  options?: {
    liveMatchPitchOnly?: boolean;
    excludedPlayerIds?: string[];
  }
): TeamTactics {
  const template = FORMATION_TEMPLATES[currentTactics.formation] || FORMATION_TEMPLATES['4-3-3'];
  if (!template || template.length !== 11) return currentTactics;

  const excludedSet = new Set(options?.excludedPlayerIds || []);
  const liveMatchPitchOnly = Boolean(options?.liveMatchPitchOnly);

  if (liveMatchPitchOnly) {
    const activePitchIds = (currentTactics.lineup?.starters || [])
      .map(s => s.playerId)
      .filter(id => id && Boolean(playersMap[id]) && !excludedSet.has(id));

    if (activePitchIds.length === 0) return currentTactics;

    const assignedPlayerIds = new Set<string>();
    const assignedSlotIndices = new Set<number>();
    const newStarters: Array<{ playerId: string; position: Position; pitchX: number; pitchY: number }> = [];

    // 1. GK slot first
    const gkSlotIdx = template.findIndex(s => s.position === 'GK');
    if (gkSlotIdx !== -1) {
      const gkSlot = template[gkSlotIdx];
      let bestGkId = activePitchIds.find(id => playersMap[id]?.position === 'GK');
      if (!bestGkId) {
        bestGkId = activePitchIds[0];
      }
      if (bestGkId) {
        assignedPlayerIds.add(bestGkId);
        assignedSlotIndices.add(gkSlotIdx);
        newStarters[gkSlotIdx] = {
          playerId: bestGkId,
          position: gkSlot.position,
          pitchX: gkSlot.pitchX,
          pitchY: gkSlot.pitchY
        };
      }
    }

    // 2. Optimal global greedy bipartite pairing of remaining active pitch players -> template outfield slots
    while (assignedPlayerIds.size < activePitchIds.length && assignedSlotIndices.size < template.length) {
      let bestPairScore = -Infinity;
      let bestPId = '';
      let bestSlotIdx = -1;

      for (const pId of activePitchIds) {
        if (assignedPlayerIds.has(pId)) continue;
        const p = playersMap[pId];
        if (!p) continue;
        for (let sIdx = 0; sIdx < template.length; sIdx++) {
          if (assignedSlotIndices.has(sIdx)) continue;
          const s = scorePlayerForAutoSlot(p, template[sIdx].position, mode, currentTactics.instructions);
          if (s > bestPairScore) {
            bestPairScore = s;
            bestPId = pId;
            bestSlotIdx = sIdx;
          }
        }
      }

      if (!bestPId || bestSlotIdx === -1) break;
      assignedPlayerIds.add(bestPId);
      assignedSlotIndices.add(bestSlotIdx);
      const slot = template[bestSlotIdx];
      newStarters[bestSlotIdx] = {
        playerId: bestPId,
        position: slot.position,
        pitchX: slot.pitchX,
        pitchY: slot.pitchY
      };
    }

    const compactStarters = newStarters.filter(Boolean);
    const syncedCustom: Record<string, FreeCustomPositionCoord> = {};
    compactStarters.forEach(s => {
      if (s.playerId) {
        syncedCustom[s.playerId] = {
          x: Math.round((s.pitchX / 100) * 1000) / 1000,
          y: Math.round((s.pitchY / 100) * 1000) / 1000,
          position: s.position
        };
      }
    });

    return {
      ...currentTactics,
      customPositions: currentTactics.placementMode === 'free' ? syncedCustom : currentTactics.customPositions,
      lineup: {
        ...currentTactics.lineup,
        starters: compactStarters
      }
    };
  }

  // Full Squad Selection (Pre-match / Tactics Squad Tab)
  const squadPlayers = clubPlayerIds
    .map(id => playersMap[id])
    .filter((p): p is Player => Boolean(p) && !excludedSet.has(p.id));

  const healthyEligible = squadPlayers.filter(
    p => !p.injury?.isInjured && p.injuryStatus !== 'INJURED' && !p.suspension?.isSuspended
  );
  const candidatePool = healthyEligible.length >= 11 ? healthyEligible : squadPlayers;

  const assignedIds = new Set<string>();
  const assignedSlotIndices = new Set<number>();
  const newStarters: Array<{ playerId: string; position: Position; pitchX: number; pitchY: number }> = new Array(11);

  // 1. Strict GK slot assignment
  const gkSlotIdx = template.findIndex(s => s.position === 'GK');
  if (gkSlotIdx !== -1) {
    const gkSlot = template[gkSlotIdx];
    const gkCandidates = candidatePool
      .filter(p => p.position === 'GK')
      .sort(
        (a, b) =>
          scorePlayerForAutoSlot(b, 'GK', mode, currentTactics.instructions) -
          scorePlayerForAutoSlot(a, 'GK', mode, currentTactics.instructions)
      );
    const chosenGk = gkCandidates[0] || candidatePool[0];
    if (chosenGk) {
      assignedIds.add(chosenGk.id);
      assignedSlotIndices.add(gkSlotIdx);
      newStarters[gkSlotIdx] = {
        playerId: chosenGk.id,
        position: gkSlot.position,
        pitchX: gkSlot.pitchX,
        pitchY: gkSlot.pitchY
      };
    }
  }

  // 2. Pair best available outfield players to remaining formation slots globally
  // Prioritize most specialist / highest impact pairings cleanly
  while (assignedSlotIndices.size < template.length) {
    let bestScore = -Infinity;
    let bestCandidate: Player | null = null;
    let bestSlotIdx = -1;

    for (const p of candidatePool) {
      if (assignedIds.has(p.id)) continue;
      if (p.position === 'GK') continue;
      for (let sIdx = 0; sIdx < template.length; sIdx++) {
        if (assignedSlotIndices.has(sIdx)) continue;
        const slot = template[sIdx];
        if (slot.position === 'GK') continue;
        const sc = scorePlayerForAutoSlot(p, slot.position, mode, currentTactics.instructions);
        if (sc > bestScore) {
          bestScore = sc;
          bestCandidate = p;
          bestSlotIdx = sIdx;
        }
      }
    }

    if (!bestCandidate || bestSlotIdx === -1) break;
    assignedIds.add(bestCandidate.id);
    assignedSlotIndices.add(bestSlotIdx);
    const slot = template[bestSlotIdx];
    newStarters[bestSlotIdx] = {
      playerId: bestCandidate.id,
      position: slot.position,
      pitchX: slot.pitchX,
      pitchY: slot.pitchY
    };
  }

  // Fill any edge empty slot if roster < 11
  for (let sIdx = 0; sIdx < template.length; sIdx++) {
    if (!newStarters[sIdx]) {
      const slot = template[sIdx];
      const fallback = squadPlayers.find(p => !assignedIds.has(p.id) && (slot.position === 'GK' ? p.position === 'GK' : p.position !== 'GK'));
      if (fallback) assignedIds.add(fallback.id);
      newStarters[sIdx] = {
        playerId: fallback?.id || '',
        position: slot.position,
        pitchX: slot.pitchX,
        pitchY: slot.pitchY
      };
    }
  }

  // 3. Build Bench (max 9, guarantee 1 GK if available, sorted by mode score)
  const remainingHealthy = candidatePool.filter(p => !assignedIds.has(p.id));
  const benchGk = remainingHealthy
    .filter(p => p.position === 'GK')
    .sort((a, b) => scorePlayerForAutoSlot(b, 'GK', mode) - scorePlayerForAutoSlot(a, 'GK', mode))[0];

  const newBench: string[] = [];
  if (benchGk) {
    newBench.push(benchGk.id);
    assignedIds.add(benchGk.id);
  }

  const remainingOutfield = remainingHealthy
    .filter(p => p.position !== 'GK' && !assignedIds.has(p.id))
    .sort((a, b) => {
      const aScore = scorePlayerForAutoSlot(a, a.position, mode, currentTactics.instructions);
      const bScore = scorePlayerForAutoSlot(b, b.position, mode, currentTactics.instructions);
      return bScore - aScore;
    });

  for (const op of remainingOutfield) {
    if (newBench.length >= 9) break;
    newBench.push(op.id);
    assignedIds.add(op.id);
  }

  const newReserves = squadPlayers.filter(p => !assignedIds.has(p.id)).map(p => p.id);

  const syncedCustomPositions: Record<string, FreeCustomPositionCoord> = {};
  newStarters.forEach(s => {
    if (s.playerId) {
      syncedCustomPositions[s.playerId] = {
        x: Math.round((s.pitchX / 100) * 1000) / 1000,
        y: Math.round((s.pitchY / 100) * 1000) / 1000,
        position: s.position
      };
    }
  });

  return {
    ...currentTactics,
    placementMode: currentTactics.placementMode || 'formation',
    customPositions: currentTactics.placementMode === 'free' ? syncedCustomPositions : currentTactics.customPositions,
    lineup: {
      starters: newStarters,
      bench: newBench,
      reserves: newReserves
    }
  };
}

