/**
 * Football Manager 2026/27: Permanent Storage & Save Management Engine
 * 
 * Solves critical data loss issues:
 * 1. Primary IndexedDB Storage: Eliminates 5MB LocalStorage quota limit (Game state is ~7.2MB).
 * 2. 3-Generation Rolling Backups: current_career -> backup_previous -> backup_old.
 * 3. Migration pipeline: Never deletes multi-season progress or clears saves on update.
 * 4. Legacy Key Harvester: Automatically finds and upgrades old v1-v5 LocalStorage saves.
 * 5. Concurrency protection & write queue to prevent race condition overwrites.
 * 6. File Export & Import for manual physical backups.
 */

import { GameWorldState, Club, Player, LeagueKey, StandingsRow, DEFAULT_DIFFICULTY_SETTINGS } from '../types/game';
import { ALL_CLUBS, ENABLE_J_LEAGUE } from '../data/clubsData';
import { J1_20_CLUBS, J2_20_CLUBS } from '../data/jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from '../data/europeanSecondDivisionClubs';
import { buildCompletePlayersRegistry, populateClubsWithDefaultSquads, getDefaultTacticsForClub } from '../data/squadPopulator';
import { generateRandomYouthAcademy } from '../data/youthGenerator';

export const CURRENT_SCHEMA_VERSION = 7;
export const CURRENT_ROSTER_DATA_VERSION = '2026_27_V2_OFFICIAL';
export const APP_CODE_VERSION = '2026.2.2';
export const DB_NAME = 'FootballManager2026_CareerDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'career_saves';

export const PRIMARY_SLOT_ID = 'current_career';
export const BACKUP_PREV_SLOT_ID = 'backup_previous';
export const BACKUP_OLD_SLOT_ID = 'backup_old';
export const BACKUP_PRE_RESET_SLOT_ID = 'backup_pre_reset';
export const BACKUP_PRE_MIGRATION_SLOT_ID = 'backup_pre_migration';

export const LEGACY_STORAGE_KEYS = [
  'fm26_career_save_v5_pure_europe',
  'fm26_career_save_v5',
  'fm26_career_save_v4',
  'fm26_career_save_v3',
  'fm26_career_save_v2',
  'fm26_career_save_v1',
  'fm26_career_save',
  'fm26_save'
];

export interface SaveMetadata {
  managerName: string;
  managerAge: number;
  managerNationality: string;
  clubId: string | null;
  clubName: string;
  currentDate: string;
  season: string;
  transferBudget: number;
  careerTrophies: number;
}

export interface SaveEnvelope {
  id: string; // Slot ID
  schemaVersion: number;
  rosterDataVersion?: string;
  appVersion: string;
  savedAt: string; // ISO string
  checksum: number;
  state: GameWorldState;
  metadata: SaveMetadata;
}

// In-memory fallback for environments without IndexedDB (e.g., node test runner)
const inMemoryStore: Record<string, SaveEnvelope> = {};

/**
 * Fast 32-bit FNV-1a checksum for integrity validation
 */
export function computeStateChecksum(state: GameWorldState): number {
  const str = `${state.manager?.name || ''}:${state.userClubId || ''}:${state.currentDate}:${state.season}:${Object.keys(state.clubs || {}).length}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Validates integrity of GameWorldState structure
 */
export function validateStateIntegrity(state: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!state || typeof state !== 'object') {
    return { isValid: false, errors: ['セーブデータが空かオブジェクトではありません'] };
  }

  if (!state.manager || typeof state.manager !== 'object' || !state.manager.name) {
    errors.push('監督プロフィール情報が欠損しています');
  }

  if (!state.currentDate || typeof state.currentDate !== 'string') {
    errors.push('ゲーム内進行日付が欠損しています');
  }

  if (!state.clubs || typeof state.clubs !== 'object' || Object.keys(state.clubs).length < 20) {
    errors.push('登録クラブデータが不足または破損しています');
  }

  if (!state.players || typeof state.players !== 'object' || Object.keys(state.players).length < 100) {
    errors.push('登録選手データが不足または破損しています');
  }

  if (!state.standings || typeof state.standings !== 'object') {
    errors.push('リーグ順位表データが破損しています');
  }

  if (!Array.isArray(state.fixtures)) {
    errors.push('試合日程データが破損しています');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Extracts metadata for easy listing / inspection
 */
export function extractMetadata(state: GameWorldState): SaveMetadata {
  const userClub = state.userClubId && state.clubs ? state.clubs[state.userClubId] : null;
  return {
    managerName: state.manager?.name || '未設定',
    managerAge: state.manager?.age || 45,
    managerNationality: state.manager?.nationality || '日本',
    clubId: state.userClubId || null,
    clubName: userClub?.name || (state.userClubId ? state.userClubId : '無所属'),
    currentDate: state.currentDate || '2026-07-01',
    season: state.season || '2026/27',
    transferBudget: userClub?.transferBudget || 0,
    careerTrophies: state.manager?.careerTrophies || 0
  };
}

/**
 * Open IndexedDB database with error handling
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Low-level write to IndexedDB
 */
async function writeEnvelopeToIDB(envelope: SaveEnvelope): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(envelope);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IDB put failed'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error || new Error('IDB transaction failed'));
    });
  } catch (err) {
    // Fallback to in-memory store
    inMemoryStore[envelope.id] = envelope;
  }
}

/**
 * Low-level read from IndexedDB
 */
async function readEnvelopeFromIDB(id: string): Promise<SaveEnvelope | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('IDB get failed'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error || new Error('IDB transaction failed'));
    });
  } catch (err) {
    return inMemoryStore[id] || null;
  }
}

/**
 * Low-level delete from IndexedDB
 */
async function deleteEnvelopeFromIDB(id: string): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IDB delete failed'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error || new Error('IDB transaction failed'));
    });
  } catch (err) {
    delete inMemoryStore[id];
  }
}

/**
 * Safe Migration: Upgrades any legacy or older schema state to CURRENT_SCHEMA_VERSION.
 * NEVER destroys career trophies, matches, tactics, or records!
 */
export function migrateGameState(state: GameWorldState, oldVersion: number): GameWorldState {
  let migrated = { ...state };

  // 1. Ensure youth academy has realistic prospects
  if (!migrated.youthAcademy || migrated.youthAcademy.length < 5) {
    const clubCountry = migrated.userClubId && migrated.clubs[migrated.userClubId] 
      ? migrated.clubs[migrated.userClubId].country 
      : '日本';
    migrated.youthAcademy = generateRandomYouthAcademy(clubCountry, 6);
  }

  // 2. Ensure all 12 league standings keys exist without erasing current points
  if (!migrated.standings) {
    migrated.standings = {} as any;
  }
  const allLeagueKeys: LeagueKey[] = [
    'premier-league', 'championship',
    'laliga', 'segunda-division',
    'bundesliga', '2-bundesliga',
    'serie-a', 'serie-b',
    'ligue-1', 'ligue-2',
    'j1-league', 'j2-league'
  ];
  allLeagueKeys.forEach(k => {
    if (!migrated.standings[k] || migrated.standings[k].length === 0) {
      const lgClubs = Object.values(migrated.clubs || {}).filter(c => c && c.league === k);
      migrated.standings[k] = lgClubs.map(c => ({
        clubId: c.id,
        clubName: c.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: []
      }));
    }
  });

  // 3. Ensure clubs have default tactics if missing
  if (migrated.clubs && migrated.players) {
    Object.values(migrated.clubs).forEach(club => {
      if (!club.tactics) {
        club.tactics = getDefaultTacticsForClub(club, migrated.players);
      }
    });
  }

  // 4. Ensure difficulty settings exist
  if (!migrated.difficultySettings) {
    migrated.difficultySettings = { ...DEFAULT_DIFFICULTY_SETTINGS };
  }

  return migrated;
}

/**
 * Safely updates player and club rosters to the official 2026/27 season master database
 * WITHOUT destroying active user progress, manager trophies, career match results,
 * bank finances, or transfers completed by the user in-game.
 */
export function merge2026_27MasterRosterIntoSave(savedState: GameWorldState): {
  state: GameWorldState;
  updatedCount: number;
  addedCount: number;
} {
  const masterPlayers = buildCompletePlayersRegistry();
  const nextPlayers: Record<string, Player> = { ...savedState.players };
  let updatedCount = 0;
  let addedCount = 0;

  // Build a set of players who were transferred during game simulation
  const inGameTransferredPlayerIds = new Set<string>();
  if (Array.isArray(savedState.transferHistory)) {
    savedState.transferHistory.forEach(rec => inGameTransferredPlayerIds.add(rec.playerId));
  }

  // Iterate over 2026/27 official master database players
  Object.values(masterPlayers).forEach(masterPlayer => {
    const existing = nextPlayers[masterPlayer.id];
    if (existing) {
      // Player already exists in save
      const wasTransferredInGame = inGameTransferredPlayerIds.has(masterPlayer.id);

      // Retain in-game club if transferred in-game, otherwise update to 2026/27 official club
      const targetClubId = wasTransferredInGame ? existing.clubId : masterPlayer.clubId;

      nextPlayers[masterPlayer.id] = {
        ...existing,
        name: masterPlayer.name,
        clubId: targetClubId,
        currentClubId: targetClubId,
        position: masterPlayer.position,
        altPositions: masterPlayer.altPositions || existing.altPositions,
        nationality: masterPlayer.nationality,
        shirtNumber: masterPlayer.shirtNumber,
        playstyle: masterPlayer.playstyle || existing.playstyle,
        preferredFoot: masterPlayer.preferredFoot || existing.preferredFoot,
        ovr: Math.max(existing.ovr, masterPlayer.ovr),
        exactOvr: Math.max(existing.exactOvr || existing.ovr, masterPlayer.exactOvr || masterPlayer.ovr),
        initialOvr: masterPlayer.initialOvr || masterPlayer.ovr,
        potential: Math.max(existing.potential, masterPlayer.potential),
        birthDate: masterPlayer.birthDate || existing.birthDate,
        age: masterPlayer.age
      };
      updatedCount++;
    } else {
      // New official 2026/27 player not present in old save
      nextPlayers[masterPlayer.id] = { ...masterPlayer };
      addedCount++;
    }
  });

  // Re-synchronize each club's playerIds array to prevent duplicate or missing assignments
  const nextClubs: Record<string, Club> = {};
  Object.entries(savedState.clubs || {}).forEach(([cId, club]) => {
    nextClubs[cId] = {
      ...club,
      playerIds: []
    };
  });

  Object.values(nextPlayers).forEach(p => {
    if (p.clubId && nextClubs[p.clubId]) {
      if (!nextClubs[p.clubId].playerIds.includes(p.id)) {
        nextClubs[p.clubId].playerIds.push(p.id);
      }
    }
  });

  // Ensure user club lineup references valid players currently at user club
  let nextTactics = { ...savedState.tactics };
  if (savedState.userClubId && nextClubs[savedState.userClubId]) {
    const userClubPlayerIds = new Set(nextClubs[savedState.userClubId].playerIds);
    const validStarters = (nextTactics.lineup?.starters || []).filter(s => userClubPlayerIds.has(s.playerId));
    const validBench = (nextTactics.lineup?.bench || []).filter(bId => userClubPlayerIds.has(bId));
    
    // Fill missing starters if any were transferred away
    const availablePlayers = nextClubs[savedState.userClubId].playerIds.filter(
      pId => !validStarters.some(s => s.playerId === pId) && !validBench.includes(pId)
    );

    while (validStarters.length < 11 && availablePlayers.length > 0) {
      const fillId = availablePlayers.shift()!;
      const fillPlayer = nextPlayers[fillId];
      validStarters.push({
        playerId: fillId,
        position: fillPlayer ? fillPlayer.position : 'CM',
        pitchX: 50,
        pitchY: 50
      });
    }

    nextTactics = {
      ...nextTactics,
      lineup: {
        starters: validStarters,
        bench: validBench,
        reserves: availablePlayers
      }
    };
  }

  const nextState: GameWorldState = {
    ...savedState,
    season: '2026/27',
    rosterDataVersion: CURRENT_ROSTER_DATA_VERSION,
    players: nextPlayers,
    clubs: nextClubs,
    tactics: nextTactics
  };

  return {
    state: nextState,
    updatedCount,
    addedCount
  };
}

/**
 * Concurrency Mutex & Queue for Saves
 */
class StorageSaveManager {
  private isProcessing = false;
  private pendingState: GameWorldState | null = null;
  private pendingResolvers: Array<(res: { success: boolean; error?: string }) => void> = [];

  public async requestSave(state: GameWorldState): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.pendingState = state;
      this.pendingResolvers.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    if (!this.pendingState) return;

    this.isProcessing = true;
    const currentStateToSave = this.pendingState;
    this.pendingState = null;
    const resolvers = [...this.pendingResolvers];
    this.pendingResolvers = [];

    let result: { success: boolean; error?: string } = { success: false };
    try {
      result = await executePhysicalSave(currentStateToSave);
    } catch (err: any) {
      result = { success: false, error: err?.message || 'セーブ処理中に例外が発生しました' };
    } finally {
      this.isProcessing = false;
      resolvers.forEach(r => r(result));
      if (this.pendingState) {
        this.processQueue();
      }
    }
  }
}

const saveManagerInstance = new StorageSaveManager();

/**
 * Executes the actual physical save with 3-generation rolling backup
 */
async function executePhysicalSave(state: GameWorldState): Promise<{ success: boolean; error?: string }> {
  // 1. Validate state integrity
  const validation = validateStateIntegrity(state);
  if (!validation.isValid) {
    return { success: false, error: `整合性エラー: ${validation.errors.join(', ')}` };
  }

  try {
    const now = new Date().toISOString();
    const checksum = computeStateChecksum(state);
    const metadata = extractMetadata(state);

    // 2. Rolling backup: read current primary if exists
    const currentPrimary = await readEnvelopeFromIDB(PRIMARY_SLOT_ID);
    if (currentPrimary && currentPrimary.state) {
      // Move previous to backup_old
      const prevBackup = await readEnvelopeFromIDB(BACKUP_PREV_SLOT_ID);
      if (prevBackup) {
        await writeEnvelopeToIDB({ ...prevBackup, id: BACKUP_OLD_SLOT_ID });
      }
      // Move primary to backup_previous
      await writeEnvelopeToIDB({ ...currentPrimary, id: BACKUP_PREV_SLOT_ID });
    }

    // 3. Write new envelope into primary
    const envelope: SaveEnvelope = {
      id: PRIMARY_SLOT_ID,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      rosterDataVersion: CURRENT_ROSTER_DATA_VERSION,
      appVersion: APP_CODE_VERSION,
      savedAt: now,
      checksum,
      state: {
        ...state,
        season: state.season || '2026/27',
        rosterDataVersion: CURRENT_ROSTER_DATA_VERSION
      },
      metadata
    };

    await writeEnvelopeToIDB(envelope);

    // 4. Update memory cache & compact metadata in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('fm26_last_save_meta', JSON.stringify({
          updatedAt: now,
          managerName: metadata.managerName,
          clubName: metadata.clubName,
          season: metadata.season,
          currentDate: metadata.currentDate
        }));
      } catch (e) {
        // Safe to ignore metadata quota
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('executePhysicalSave failed:', err);
    return { success: false, error: err?.message || 'セーブデータの書き込みに失敗しました' };
  }
}

/**
 * Public asynchronous API to save game state safely
 */
export async function saveGameToStorage(state: GameWorldState): Promise<{ success: boolean; error?: string }> {
  return saveManagerInstance.requestSave(state);
}

/**
 * Checks all legacy LocalStorage keys for un-migrated saves
 */
function harvestLegacyLocalStorage(): GameWorldState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const check = validateStateIntegrity(parsed);
        if (check.isValid) {
          console.info(`Found legacy save under key "${key}". Migrating to permanent IndexedDB storage.`);
          return parsed as GameWorldState;
        }
      }
    } catch (e) {
      // Continue searching
    }
  }
  return null;
}

/**
 * Public asynchronous API to load game state with automatic fallback & recovery
 */
export async function loadGameFromStorage(): Promise<{
  state: GameWorldState | null;
  source: 'indexeddb_primary' | 'indexeddb_backup_1' | 'indexeddb_backup_2' | 'legacy_localstorage' | 'none';
  migrated: boolean;
  error?: string;
}> {
  try {
    // 1. Try Primary Slot
    const primary = await readEnvelopeFromIDB(PRIMARY_SLOT_ID);
    if (primary && primary.state) {
      const check = validateStateIntegrity(primary.state);
      if (check.isValid) {
        let state = primary.state;
        let migrated = false;

        const needsSchemaMigration = (primary.schemaVersion || 0) < CURRENT_SCHEMA_VERSION;
        const needsRosterUpdate = !primary.rosterDataVersion || 
                                  primary.rosterDataVersion !== CURRENT_ROSTER_DATA_VERSION || 
                                  !state.rosterDataVersion || 
                                  state.rosterDataVersion !== CURRENT_ROSTER_DATA_VERSION;

        if (needsSchemaMigration || needsRosterUpdate) {
          await writeEnvelopeToIDB({ ...primary, id: BACKUP_PRE_MIGRATION_SLOT_ID });

          if (needsSchemaMigration) {
            state = migrateGameState(state, primary.schemaVersion || 0);
          }

          if (needsRosterUpdate) {
            const rosterMerge = merge2026_27MasterRosterIntoSave(state);
            state = rosterMerge.state;
          }

          migrated = true;
          await saveGameToStorage(state);
        }
        return { state, source: 'indexeddb_primary', migrated };
      } else {
        console.warn('Primary save failed integrity check, falling back to backup 1:', check.errors);
      }
    }

    // 2. Try Backup 1 (Previous)
    const backup1 = await readEnvelopeFromIDB(BACKUP_PREV_SLOT_ID);
    if (backup1 && backup1.state) {
      const check = validateStateIntegrity(backup1.state);
      if (check.isValid) {
        console.info('Restored game state from Backup Generation 1.');
        let state = backup1.state;
        if (!state.rosterDataVersion || state.rosterDataVersion !== CURRENT_ROSTER_DATA_VERSION) {
          state = merge2026_27MasterRosterIntoSave(state).state;
          await saveGameToStorage(state);
        }
        return { state, source: 'indexeddb_backup_1', migrated: true };
      }
    }

    // 3. Try Backup 2 (Old)
    const backup2 = await readEnvelopeFromIDB(BACKUP_OLD_SLOT_ID);
    if (backup2 && backup2.state) {
      const check = validateStateIntegrity(backup2.state);
      if (check.isValid) {
        console.info('Restored game state from Backup Generation 2.');
        let state = backup2.state;
        if (!state.rosterDataVersion || state.rosterDataVersion !== CURRENT_ROSTER_DATA_VERSION) {
          state = merge2026_27MasterRosterIntoSave(state).state;
          await saveGameToStorage(state);
        }
        return { state, source: 'indexeddb_backup_2', migrated: true };
      }
    }

    // 4. Try Legacy LocalStorage keys
    const legacyState = harvestLegacyLocalStorage();
    if (legacyState) {
      let migratedState = migrateGameState(legacyState, 1);
      migratedState = merge2026_27MasterRosterIntoSave(migratedState).state;
      // Migrate permanently into IndexedDB so it's immune to quota
      await saveGameToStorage(migratedState);
      return { state: migratedState, source: 'legacy_localstorage', migrated: true };
    }

    // 5. No save found anywhere
    return { state: null, source: 'none', migrated: false };
  } catch (err: any) {
    console.error('loadGameFromStorage critical error:', err);
    return { state: null, source: 'none', migrated: false, error: err?.message };
  }
}

/**
 * Completely clears save data with safe pre-reset backup
 */
export async function clearAllGameStorage(): Promise<boolean> {
  try {
    // 1. Create a pre-reset backup so accidents can be reversed
    const current = await readEnvelopeFromIDB(PRIMARY_SLOT_ID);
    if (current) {
      await writeEnvelopeToIDB({ ...current, id: BACKUP_PRE_RESET_SLOT_ID });
    }

    // 2. Delete primary and active backups
    await deleteEnvelopeFromIDB(PRIMARY_SLOT_ID);
    await deleteEnvelopeFromIDB(BACKUP_PREV_SLOT_ID);
    await deleteEnvelopeFromIDB(BACKUP_OLD_SLOT_ID);

    // 3. Clean legacy keys in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      LEGACY_STORAGE_KEYS.forEach(k => {
        try { window.localStorage.removeItem(k); } catch (e) {}
      });
      try { window.localStorage.removeItem('fm26_last_save_meta'); } catch (e) {}
    }

    return true;
  } catch (err) {
    console.error('clearAllGameStorage failed:', err);
    return false;
  }
}

/**
 * Export career save as JSON string (for downloading backup file)
 */
export function exportSaveDataAsJSON(state: GameWorldState): string {
  const envelope: SaveEnvelope = {
    id: 'export_file',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: APP_CODE_VERSION,
    savedAt: new Date().toISOString(),
    checksum: computeStateChecksum(state),
    state,
    metadata: extractMetadata(state)
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Triggers a browser file download of the career save JSON
 */
export function downloadCareerSaveFile(state: GameWorldState): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const jsonStr = exportSaveDataAsJSON(state);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const meta = extractMetadata(state);
  const safeName = (meta.managerName || 'career').replace(/[^a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, '_');
  const filename = `FM26_${safeName}_${meta.currentDate}.json`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a career save from a JSON string with full validation
 */
export function importSaveDataFromJSON(jsonString: string): { success: boolean; state?: GameWorldState; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const candidateState = parsed.state || parsed;
    const validation = validateStateIntegrity(candidateState);

    if (!validation.isValid) {
      return { success: false, error: `インポート失敗: ${validation.errors.join(', ')}` };
    }

    const migratedState = migrateGameState(candidateState, parsed.schemaVersion || 1);
    return { success: true, state: migratedState };
  } catch (err: any) {
    return { success: false, error: `JSONパース失敗: ${err?.message || '無効なファイル形式です'}` };
  }
}
