export type Position = 
  | 'GK' 
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW' | 'CF' | 'ST';

export type PlayerCondition = 'pink' | 'red' | 'yellow' | 'cyan' | 'purple';
// pink: 絶好調 (+8%), red: 好調 (+4%), yellow: 普通 (0%), cyan: 不調 (-4%), purple: 絶不調 (-8%)

export type PlayerPersonality = 
  | 'プロフェッショナル' // 高い練習意欲、文句が少ない
  | '野心的' // ビッグクラブ移籍やタイトルを熱望
  | '冷静沈着' // プレッシャーに強い
  | 'リーダー気質' // チーム結束力を高める
  | '出場機会重視' // 出番が減るとすぐ不満
  | '給与重視' // 契約更新で好条件を要求
  | 'タイトル至上主義' // 優勝を渇望
  | '努力家'
  | 'クラブ愛' // 忠誠心が高く移籍しにくい;

export type PlayStyle = 
  | 'ゴールゲッター'
  | 'シャドーストライカー'
  | 'ラインブレイカー'
  | 'バランス型'
  | 'チャンスメイカー'
  | '俊足ドリブラー'
  | 'スピードスター'
  | 'ターゲットマン'
  | 'ボックストゥボックス'
  | 'アンカー'
  | 'ハードタックラー'
  | 'ボール運べるCB'
  | '攻撃的SB'
  | '守備的SB'
  | '守備的GK'
  | 'ビルドアップ型GK'
  | 'ショットストッパー';

export type ManagerStyle = 
  | '戦術至上主義' 
  | '戦術家'
  | '情熱型モチベーター' 
  | '名伯楽（若手育成）' 
  | '厳格なディシプリン' 
  | '現実主義（結果重視）';

export type TacticalType = 
  | 'ゲーゲンプレス' 
  | 'ティキタカ（ポゼッション）' 
  | 'ポゼッション主導'
  | '堅守速攻（カウンター）' 
  | 'ダイレクト・カウンター'
  | 'ハイブリッドプレッシング' 
  | '5バック低重心守備' 
  | 'トータルフットボール';

export type ManagerSpecialty = 
  | '攻撃戦術' 
  | '守備構築' 
  | '若手育成' 
  | '選手マネジメント' 
  | '移籍交渉';

export interface ManagerProfile {
  name: string;
  nationality: string;
  age: number;
  avatar: string;
  style: ManagerStyle;
  tacticalType: TacticalType;
  specialty: ManagerSpecialty;
  reputation: number; // 1 - 100
  careerTrophies: number;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  nationalTeamOfferAvailable?: boolean;
  careerStartDate?: string;
  managerAppointmentDate?: string;
}

export interface PlayerRelationship {
  targetPlayerId: string;
  relation: '盟友' | '良好' | '普通' | 'ライバル' | '不仲';
}

export interface PlayerStats {
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  saves?: number;
  goalsConceded?: number;
}

export type MatchCompetitionType = 
  | 'preseason' 
  | 'league' 
  | 'domestic_cup' 
  | 'continental_competition' 
  | 'international';

export interface GoalDetail {
  minute: number;
  scorerId: string;
  scorerName: string;
  assistId?: string;
  assistName?: string;
  attackOrigin: 'counter' | 'possession' | 'flank_break' | 'set_piece' | 'high_press' | 'long_ball' | 'penalty' | 'own_goal';
  passType: 'through_ball' | 'cross' | 'cutback' | 'short_pass' | 'lob' | 'direct' | 'none';
  dribbleType: 'cut_inside' | 'burst_speed' | 'one_on_one' | 'feint' | 'none';
  shotType: 'volley' | 'header' | 'placed_shot' | 'power_drive' | 'chip' | 'curler' | 'tap_in' | 'penalty_kick' | 'own_goal_deflection';
  shotLocation: 'penalty_area_central' | 'penalty_area_left' | 'penalty_area_right' | 'box_edge' | 'six_yard_box' | 'long_range';
  shotFoot?: '右足' | '左足' | '頭' | '胸・その他';
  narrative: string;
}

export interface SeasonStatsHistory {
  seasonId: string;
  seasonName: string; // e.g. "2026/27"
  clubId: string;
  clubName: string;
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  avgRating: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  saves: number;
  goalsConceded: number;
  competitionStats?: Record<string, PlayerStats>;
  awards?: string[];
}

export interface PlayerInjury {
  isInjured: boolean;
  type?: string;
  recoveryDays?: number;
  returnDate?: string;
  severity?: 'minor' | 'moderate' | 'severe';
  daysRemaining?: number;
}

export interface PlayerSuspension {
  isSuspended: boolean;
  matchesRemaining: number;
  reason?: 'レッドカード' | '累積警告' | string;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  nationality: string;
  position: Position;
  altPositions: Position[];
  preferredPositions?: Position[];
  secondaryPositions?: Position[];
  historicalPositions?: Position[];
  positionProficiency?: Partial<Record<Position, number>>;
  preferredFoot: '右' | '左' | '両足';
  ovr: number;
  initialOvr?: number; // Starting OVR to track season net growth (+1, +2, etc.)
  exactOvr?: number; // Continuous fractional OVR (e.g. 78.2) for long-term growth
  ovrGrowthProgress?: number;
  matchRatingsHistory?: number[];
  potential: number;
  
  // Specific Attributes (1-99)
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gk: number;

  marketValue: number; // in Euros (€)
  wage: number; // Weekly wage in Euros (€)
  contractYears: number; // Remaining years
  clubId: string;
  currentClubId?: string;
  canonicalPlayerId?: string;
  squadRole: '絶対的主力' | '重要選手' | 'ローテーション' | '控え・バックアップ' | '若手・育成枠';

  // Loan status & Period management
  isLoaned: boolean;
  loanFromClubId?: string;
  parentClubId?: string;
  loanClubId?: string;
  loanStartDate?: string;
  loanEndDate?: string;
  loanType?: 'permanent' | 'loan' | 'buy_option' | 'dev_loan';
  buyOptionFee?: number;
  developmentLoan?: boolean;
  loanOptionBuyFee?: number;
  loanPlayingTimeGuaranteed?: boolean;

  // Formal Squad Status
  squadStatus?: 'STARTING' | 'BENCH' | 'RESERVE' | 'OUT_OF_SQUAD';

  playstyle: PlayStyle;
  personality: PlayerPersonality;
  managerTrust: number; // 0 - 100
  relationships: PlayerRelationship[];

  condition: PlayerCondition;
  fatigue: number; // 0 (fresh) - 100 (exhausted)
  stamina?: number; // 60 - 99 natural stamina
  inMatchStamina?: number; // 0 - 100 live during match
  injuryStatus?: 'HEALTHY' | 'INJURED' | 'FIT' | 'DOUBTFUL';
  injuryStartDate?: string;
  injuryReturnDate?: string;
  injuryType?: string;
  injuryDaysRemaining?: number;
  injury: PlayerInjury;
  suspension: PlayerSuspension;

  stats: PlayerStats;
  preseasonStats?: PlayerStats;
  seasonHistory?: SeasonStatsHistory[];
  shirtNumber: number;
  isTransferListed?: boolean;
  transferListed?: boolean;
  isLoanListed?: boolean;
  loanListed?: boolean;
  contractYearsRemaining?: number;
  accumulatedYellowCards?: Record<string, number>; // competition -> count
  accumulatedRedCards?: Record<string, number>;
  // Type 2 High School Player Registration (2種登録選手)
  isType2Registered?: boolean;
  type2HighSchool?: string;
  type2UnavailableDates?: string[];
  competitionStats?: Record<string, PlayerStats>;
}

export type LeagueKey = 
  | 'premier-league'
  | 'championship'
  | 'laliga'
  | 'segunda-division'
  | 'bundesliga'
  | '2-bundesliga'
  | 'serie-a'
  | 'serie-b'
  | 'ligue-1'
  | 'ligue-2'
  | 'j1-league'
  | 'j2-league'
  | 'j3-league';

export type CupKey = 
  | 'ucl'
  | 'uel'
  | 'uecl'
  | 'fa-cup'
  | 'carabao-cup'
  | 'copa-del-rey'
  | 'dfb-pokal'
  | 'coppa-italia'
  | 'coupe-de-france'
  | 'super-cup'
  | 'levain-cup'
  | 'emperors-cup';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: LeagueKey;
  division?: 1 | 2;
  country: string;
  tier: 'Elite' | 'Upper' | 'Mid' | 'Lower';
  reputation: number; // 1-100
  transferBudget: number; // €
  wageBudget: number; // € / week
  currentWageSpend: number; // € / week
  target: 'リーグ優勝' | 'チャンピオンズリーグ出場圏' | '欧州大会圏内' | '上位進出' | '中位安定' | 'リーグ残留' | 'カップ戦タイトル' | '1部昇格' | '昇格プレーオフ進出';
  fanExpectation: '極めて高い（タイトル必須）' | '高い（上位争い）' | '現実的（堅実な戦い）' | '残留最優先' | '昇格争い' | '自動昇格必須' | '上位進出' | '中位以上' | '中位安定' | 'プレーオフ進出';
  stadiumName: string;
  stadiumCapacity: number;
  primaryColor: string;
  secondaryColor: string;
  currentFormation: FormationName;
  playerIds: string[];
  rivalClubIds?: string[];
  isUserClub?: boolean;
  tactics?: TeamTactics;
}

export type FormationName = 
  | '4-3-3'
  | '4-3-3 Holding'
  | '4-3-3 Defensive'
  | '4-3-3 Attacking'
  | '4-2-3-1'
  | '4-2-2-2'
  | '4-4-2'
  | '4-4-1-1'
  | '4-1-4-1'
  | '4-1-2-3'
  | '4-1-3-2'
  | '4-5-1'
  | '4-3-1-2'
  | '4-3-2-1'
  | '4-2-4'
  | '3-5-2'
  | '3-4-3'
  | '3-4-2-1'
  | '3-4-1-2'
  | '3-1-4-2'
  | '3-2-4-1'
  | '3-3-3-1'
  | '5-3-2'
  | '5-4-1'
  | '5-2-3'
  | '5-2-2-1'
  | '5-3-1-1'
  | '非対称4-3-3'
  | '非対称4-2-3-1'
  | 'ダイヤモンド型4-4-2'
  | 'フラット型4-5-1'
  | '2トップ＋トップ下型'
  | '中央密集型'
  | '両ウイング高位置型'
  | '片側ウイング偏重型';

export interface PeriodSummary {
  startDate: string;
  endDate: string;
  matchesPlayed: number;
  userMatchesCount: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  injuriesOccurred: number;
  matchDetails: {
    matchId: string;
    date: string;
    opponentName: string;
    isHome: boolean;
    score: string;
    result: 'W' | 'D' | 'L';
  }[];
}

export interface TeamTactics {
  formation: FormationName;
  lineup: {
    starters: { playerId: string; position: Position; pitchX: number; pitchY: number }[];
    bench: string[];
    reserves: string[];
  };
  instructions: {
    attackingStyle: 'ポゼッション・パス' | 'ダイレクト・カウンター' | 'サイド攻撃・クロス' | '中央突破';
    defensiveStyle: 'ハイプレス' | 'ミドルブロック' | 'ローブロック・堅守' | 'ゲーゲンプレス';
    pressIntensity: '非常に激しい' | '標準的' | '自陣引き気味';
    defensiveLine: 'ハイライン' | '標準' | 'ディープライン';
    tempo: '高速テンポ' | '標準' | 'じっくりビルドアップ';
    counterUrgency: 'ボール奪取時即カウンター' | '一度落ち着いて組み立て';
  };
  roles: {
    captainId?: string;
    penaltyTakerId?: string;
    freeKickTakerId?: string;
    cornerTakerId?: string;
  };
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'assist' | 'yellow_card' | 'second_yellow' | 'red_card' | 'injury' | 'sub' | 'big_chance' | 'save' | 'penalty' | 'var' | 'woodwork';
  clubId: string;
  playerId: string;
  playerName: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  subInPlayerId?: string;
  subInPlayerName?: string;
  description: string;
  goalDetail?: GoalDetail;
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  possession: number; // e.g. 54 for 54%
  shots: [number, number]; // [home, away]
  shotsOnTarget: [number, number];
  xG: [number, number];
  corners: [number, number];
  fouls: [number, number];
  passesCompleted: [number, number];
  passAccuracy: [number, number];
  playerRatings: Record<string, number>; // playerId -> rating 1.0 - 10.0
}

export interface MatchFixture {
  id: string; // matchId
  date: string;
  competition: LeagueKey | CupKey | 'pre-season' | string; // competitionId
  competitionType?: MatchCompetitionType;
  competitionName: string;
  seasonId?: string;
  round?: string; // e.g. Round of 32, Round of 16, Quarter-Final, Semi-Final, Final
  roundId?: string; // Unique round identifier
  matchSeed?: number; // Deterministic simulation seed
  homeClubId: string;
  awayClubId: string;
  status: 'upcoming' | 'playing' | 'halftime' | 'finished';
  homeScore?: number;
  awayScore?: number;
  events?: MatchEvent[];
  stats?: MatchStats;
  motmPlayerId?: string;
  isUserMatch: boolean;
  extraTimePlayed?: boolean;
  penaltyShootout?: { homeScore: number; awayScore: number };
  isResultApplied?: boolean;
}

export type TournamentStatus = 'not_started' | 'in_progress' | 'completed';

export interface TournamentRound {
  roundId: string;
  roundName: string;
  roundOrder: number;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  fixtureIds: string[];
}

export interface TournamentCompetition {
  id: CupKey;
  name: string;
  shortName: string;
  country: string;
  format: 'european-league-phase' | 'knockout-bracket';
  seasonId: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  currentRoundId?: string;
  currentRoundName?: string;
  rounds: TournamentRound[];
  championClubId?: string;
  runnerUpClubId?: string;
  leaguePhaseTable?: StandingsRow[];
}

export interface StandingsRow {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface TransferNegotiation {
  id: string;
  playerId: string;
  sellerClubId: string;
  buyerClubId: string;
  status: 'club_negotiating' | 'club_agreed' | 'player_negotiating' | 'completed' | 'collapsed';
  isLoan: boolean;
  negotiationType?: 'permanent' | 'loan' | 'buy_option' | 'dev_loan';
  buyOptionFee?: number;
  cooldownUntil?: string; // 10-day renegotiation ban date after collapse
  
  // Club Stage
  initialAskingPrice: number;
  currentBidFee: number;
  clubPatience: number; // 1 to 4 warnings before walkout
  clubMessages: { sender: 'user' | 'ai'; text: string; date: string }[];

  // Player Stage
  wageOffered: number;
  wageDemanded: number;
  contractYearsOffered: number;
  squadRoleOffered: Player['squadRole'];
  signingBonusOffered: number;
  playerPatience: number;
  playerMessages: { sender: 'agent' | 'user'; text: string; date: string }[];
}

export interface IncomingAIOffer {
  id: string;
  date: string;
  buyerClubId: string;
  playerId: string;
  type: 'permanent' | 'loan' | 'buy_option' | 'dev_loan';
  fee: number;
  bonusFee?: number;
  bonusCondition?: string;
  installments?: number;
  sellOnPercentage?: number;
  buybackClause?: boolean;
  wageContribution: number;
  loanDurationMonths?: number;
  buyOptionFee?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  negotiationRounds?: number;
  aiPatience?: number;
  dialogueHistory?: { speaker: 'ai' | 'user'; message: string; termsSummary?: string }[];
}

export interface CompletedTransferRecord {
  id: string;
  date: string;
  playerId: string;
  playerName: string;
  sellerClubId: string;
  buyerClubId: string;
  fee: number;
  type: 'permanent' | 'loan' | 'buy_option' | 'dev_loan';
}

export interface NewsItem {
  id: string;
  date: string;
  headline: string;
  body: string;
  category: 'transfer' | 'match' | 'injury' | 'crisis' | 'press' | 'tournament' | 'youth' | 'board';
  relatedClubId?: string;
  relatedPlayerId?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface YouthProspect {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: Position;
  ovr: number;
  potential: number;
  playstyle: PlayStyle;
  personality: PlayerPersonality;
  scoutReport: string;
  promoted: boolean;
}

export interface SeasonHistory {
  season: string;
  clubId: string;
  clubName: string;
  leagueName: string;
  leagueFinish: number;
  cupResults: string[];
  trophies: string[];
  record: { played: number; wins: number; draws: number; losses: number };
}

export interface CareerSummary {
  profile: ManagerProfile;
  seasons: SeasonHistory[];
  totalTrophiesWon: string[];
  historyLog: string[];
}

export interface DifficultySettings {
  transferDifficulty: 'easy' | 'normal' | 'realistic'; // 簡単 / 普通 / 現実的
  injuryFrequency: 'low' | 'normal' | 'high'; // 少ない / 普通 / 多い
  playerGrowthRate: 'slow' | 'normal' | 'fast'; // 遅い / 普通 / 速い
  aiTransferActivity: 'low' | 'normal' | 'high'; // 少ない / 普通 / 活発
  matchGoalRate: 'low' | 'normal' | 'high'; // 少ない / 普通 / 多い
  managerJobDifficulty: 'lenient' | 'normal' | 'strict'; // 寛容 / 普通 / 厳格
}

export const DEFAULT_DIFFICULTY_SETTINGS: DifficultySettings = {
  transferDifficulty: 'normal',
  injuryFrequency: 'normal',
  playerGrowthRate: 'normal',
  aiTransferActivity: 'normal',
  matchGoalRate: 'normal',
  managerJobDifficulty: 'normal'
};

export interface PreSeasonTournament {
  id: string;
  name: string;
  region: string;
  prizeMoney: number;
  participants: string[];
  matchesCount: number;
  deadline: string;
}

export interface ClubRoadmapGoal {
  id: string;
  yearTarget: number; // 1 (今季), 2 (2年目), 3 (3年目), etc.
  category: 'league' | 'cup' | 'continental' | 'financial' | 'growth';
  title: string;
  description: string;
  targetCondition: string;
  achieved?: boolean;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface ClubVisionRoadmap {
  clubId: string;
  clubName: string;
  leagueId: LeagueKey;
  division: 1 | 2;
  overviewPhilosophy: string;
  shortTermObjective: string; // 今季の至上命題
  midTermObjective: string;   // 2〜3年以内
  longTermObjective: string;  // 3〜5年後の到達点
  goals: ClubRoadmapGoal[];
  boardPatienceLevel: '忍耐強い' | '標準的' | '結果即時要求';
  transferPolicy: string;
  updatedAtSeason: string;
}

export interface MatchIncidentNotice {
  id: string;
  minute: number;
  type: 'injury' | 'red_card' | 'second_yellow';
  clubId: string;
  clubName?: string;
  isUserClub?: boolean;
  playerId?: string;
  playerName?: string;
  message?: string;
  requiresConfirmation?: boolean;
  injuryDetails?: {
    injuryType: string;
    severity?: 'minor' | 'moderate' | 'severe';
    daysOut?: number;
    returnDate?: string;
    canContinue?: boolean;
  };
  redCardDetails?: {
    isSecondYellow?: boolean;
    reason: string;
    severity?: string;
    matchesRemaining: number;
  };
  details?: {
    injuryType?: string;
    recoveryDays?: number;
    returnDate?: string;
    substitutionRequired?: boolean;
    cardReason?: string;
  };
  event?: MatchEvent;
}

export interface GameWorldState {
  currentDate: string; // ISO string e.g. "2026-07-01"
  season: string; // "2026/27" (2026/27 official database)
  rosterDataVersion?: string; // Tracks official roster updates e.g. "2026_27_V2_OFFICIAL"
  isTransferWindowOpen: boolean;
  transferWindowClosingDays: number;
  manager: ManagerProfile;
  managerAppointmentDate?: string;
  isMidSeasonAppointment?: boolean;
  userClubId: string | null;
  boardConfidence: number; // 0 - 100
  fanApproval: number; // 0 - 100
  consecutiveLosses: number;
  consecutiveWinless?: number; // Tracks draws + losses for realistic crisis penalty
  isSacked: boolean;
  difficultySettings: DifficultySettings;

  clubs: Record<string, Club>;
  players: Record<string, Player>;
  tactics: TeamTactics;
  fixtures: MatchFixture[];
  standings: Record<LeagueKey, StandingsRow[]>;
  negotiations: Record<string, TransferNegotiation>;
  news: NewsItem[];
  youthAcademy: YouthProspect[];
  careerHistory: SeasonHistory[];

  clubVision?: ClubVisionRoadmap; // 未来予想図・クラブ成長計画
  selectedPreSeason?: string;
  trainingFocus: 'バランス総合' | '攻撃・連係強化' | '守備戦術・プレス' | 'コンディション回復' | '若手重点育成';
  incomingOffers?: IncomingAIOffer[];
  transferHistory?: CompletedTransferRecord[];
  showDeadlineSummary?: boolean;
  year2UCLQualifiedClubIds?: string[];
  lastSquadAutoChangeNotice?: {
    transferredPlayerName: string;
    replacedPlayerName: string | null;
    position: string;
    date: string;
  };

  // Board Confidence 4 Stages & Audit Log
  boardConfidenceStage?: '通常' | '警告' | '解任危機' | '解任';
  boardConfidenceAuditLog?: {
    date: string;
    matchId?: string;
    opponentName?: string;
    delta: number;
    newConfidence: number;
    reason: string;
    stage: '通常' | '警告' | '解任危機' | '解任';
  }[];
  processedBoardConfidenceMatchIds?: string[];

  // Monthly Scout System (1/month)
  scoutMonthlyState?: {
    lastScoutedMonth?: string;
    scoutedThisMonth?: boolean;
    prospects?: ScoutProspect[];
    signedPlayerId?: string;
  };

  // Ballon d'Or November Event & Predictions
  ballonDorYear?: number;
  ballonDorNomineesAnnounced?: boolean;
  ballonDorWinnerAnnounced?: boolean;
  ballonDorWinnerId?: string;
  ballonDorRankings?: BallonDorCandidate[];

  // Tournaments State (CL, Cups)
  tournaments?: Record<CupKey, TournamentCompetition>;
}

export interface ScoutProspect {
  id: string;
  name: string;
  age: number;
  birthDate: string;
  nationality: string;
  originRegion: string;
  schoolOrAcademy?: string;
  position: Position;
  altPositions: Position[];
  preferredFoot: '右' | '左' | '両足';
  ovr: number;
  potential: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gk: number;
  marketValue: number;
  wage: number;
  playstyle: PlayStyle;
  personality: PlayerPersonality;
  scoutReport: string;
  isGenerationalTalent?: boolean;
  isType2Eligible?: boolean;
}

export interface BallonDorCandidate {
  rank: number;
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  nationality: string;
  position: Position;
  age: number;
  ovr: number;
  goals: number;
  assists: number;
  avgRating: number;
  trophiesCount: number;
  winProbability: number;
  summary: string;
}
