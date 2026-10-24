export type Language = 'ja' | 'en' | 'es';

export interface Translations {
  // Navigation & General
  appTitle: string;
  season: string;
  date: string;
  nextDay: string;
  simulating: string;
  skipMenu: string;
  skipNextMatch: string;
  skipDeadline: string;
  skip7Days: string;
  skipMonthEnd: string;
  resetGameData: string;
  resetConfirmTitle: string;
  resetConfirmBody: string;
  resetTypeConfirmPrompt: string;
  cancel: string;
  confirmReset: string;
  resetSuccess: string;
  
  // Tabs
  tabHome: string;
  tabTactics: string;
  tabTransfers: string;
  tabFixtures: string;
  tabClub: string;

  // Header & Info
  transferBudget: string;
  wageBudget: string;
  boardConfidence: string;
  fanApproval: string;
  transferDeadlineDays: string;
  daysRemaining: string;

  // Manager Creation
  createManagerTitle: string;
  createManagerSub: string;
  managerName: string;
  nationality: string;
  age: string;
  managerIcon: string;
  managerStyle: string;
  tacticalType: string;
  specialty: string;
  createManagerSubmit: string;

  // Club Offers
  clubOffersTitle: string;
  clubOffersSub: string;
  officialOffers: string;
  browseAllClubs: string;
  reRollOffers: string;
  searchClubs: string;
  stadium: string;
  capacity: string;
  contractOffer: string;
  contractYears: string;
  managerSalary: string;
  clubTarget: string;
  fanExpectation: string;
  boardStatement: string;
  signContract: string;

  // Tactics & Squad
  tacticsTitle: string;
  formation: string;
  lineupTab: string;
  instructionsTab: string;
  rolesTab: string;
  starters: string;
  substitutes: string;
  reserves: string;
  subInstruction: string;
  subButton: string;
  captain: string;
  penaltyTaker: string;
  freeKickTaker: string;
  cornerTaker: string;

  // Instructions
  attackingStyle: string;
  defensiveStyle: string;
  defensiveLine: string;
  tempo: string;

  // Fatigue & Condition
  fatigue: string;
  condition: string;
  fatigueFresh: string;
  fatigueLight: string;
  fatigueModerate: string;
  fatigueHigh: string;
  fatigueExhausted: string;
  condPink: string;
  condRed: string;
  condYellow: string;
  condCyan: string;
  condPurple: string;

  // Match Simulation
  matchDay: string;
  kickoff: string;
  halftime: string;
  secondHalf: string;
  fulltime: string;
  matchFinished: string;
  matchEvents: string;
  liveTimeline: string;
  coachAdvice: string;
  motm: string;
  proceedToPress: string;
  speed: string;
  speedNormal: string;
  speedFast: string;
  speedVeryFast: string;
  speedInstant: string;
  goal: string;
  assist: string;
  ownGoal: string;
  penalty: string;
  yellowCard: string;
  redCard: string;
  substitution: string;
  injury: string;
  varCheck: string;
  bigChance: string;
  save: string;
  shots: string;
  shotsOnTarget: string;
  possession: string;
  corners: string;
  fouls: string;
  passAccuracy: string;
  expectedGoals: string;

  // Transfers & Rivalry
  marketTitle: string;
  allPositions: string;
  searchPlayers: string;
  makeOffer: string;
  marketValue: string;
  wage: string;
  rivalClubWarning: string;
  rivalBadge: string;
  clubNegotiation: string;
  playerNegotiation: string;
  bidAmount: string;
  offerWage: string;
  signingBonus: string;
  squadRole: string;
  patience: string;
  submitBid: string;
  agreeTransfer: string;
  negotiationCollapsed: string;

  // Competitions
  standings: string;
  fixtures: string;
  rank: string;
  club: string;
  played: string;
  won: string;
  drawn: string;
  lost: string;
  goalsFor: string;
  goalsAgainst: string;
  goalDiff: string;
  points: string;
  form: string;
  champSpot: string;
  uclSpot: string;
  uelSpot: string;
  relegationSpot: string;

  // Settings & Languages
  settingsTitle: string;
  languageSelect: string;
  languageJa: string;
  languageEn: string;
  languageEs: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ja: {
    appTitle: 'フットボールマネージャー 2026/27',
    season: '2026/27シーズン',
    date: '日付',
    nextDay: '次の日へ',
    simulating: 'シミュレーション中...',
    skipMenu: 'スマートスキップ',
    skipNextMatch: '次の試合まで進む',
    skipDeadline: '移籍市場閉幕まで進む',
    skip7Days: '1週間進む（7日間）',
    skipMonthEnd: '月末まで進む',
    resetGameData: '🔄 ゲームデータを初期化',
    resetConfirmTitle: 'ゲームデータを初期化しますか？',
    resetConfirmBody: '現在の監督キャリア、試合結果、移籍履歴、選手状態、順位がすべて消去され、2026/27開始時の初期状態に完全リセットされます。実在選手やクラブの基本データは保持されます。',
    resetTypeConfirmPrompt: '確認のため「RESET」と入力してください：',
    cancel: 'キャンセル',
    confirmReset: '初期化を実行する',
    resetSuccess: '初期化が完了しました。新しいキャリアを開始します。',

    tabHome: 'ホーム',
    tabTactics: 'チーム編成',
    tabTransfers: '移籍市場',
    tabFixtures: '日程・順位',
    tabClub: 'クラブ・設定',

    transferBudget: '移籍予算',
    wageBudget: '週給予算',
    boardConfidence: '理事会信頼度',
    fanApproval: 'サポーター支持率',
    transferDeadlineDays: '移籍締切まで',
    daysRemaining: '日',

    createManagerTitle: 'オリジナル監督プロファイル作成',
    createManagerSub: '2026/27シーズン、世界最高峰の舞台に挑む指揮官の能力を設定してください',
    managerName: '監督名',
    nationality: '国籍',
    age: '年齢',
    managerIcon: '監督アイコン',
    managerStyle: '指導哲学・スタイル',
    tacticalType: '得意な戦術コンセプト',
    specialty: '特化スキル（得意分野）',
    createManagerSubmit: '監督登録を完了し、5クラブの就任オファーを見る',

    clubOffersTitle: '監督就任オファーの受諾・クラブ決定',
    clubOffersSub: '監督プロファイルと戦術哲学に高い関心を示すクラブからの正式就任打診です。',
    officialOffers: '★ 正式オファー（推薦5クラブ）',
    browseAllClubs: '🌍 全116クラブから自由に選択',
    reRollOffers: '🎲 別の5クラブを再抽選',
    searchClubs: 'クラブ名で検索...',
    stadium: '本拠地',
    capacity: '収容人数',
    contractOffer: '契約条件',
    contractYears: '契約期間: 3年 (2029年まで)',
    managerSalary: '提示監督年俸',
    clubTarget: 'クラブ目標',
    fanExpectation: 'ファンの期待',
    boardStatement: 'フロント・取締役会からのメッセージ',
    signContract: 'の監督就任契約にサインする',

    tacticsTitle: 'チーム編成・戦術司令塔',
    formation: 'フォーメーション',
    lineupTab: 'スタメン＆ベンチ',
    instructionsTab: '戦術指示',
    rolesTab: '役割・キッカー',
    starters: 'スターティングメンバー (11名)',
    substitutes: 'ベンチメンバー (交代枠)',
    reserves: 'リザーブ・登録枠外',
    subInstruction: '← 交代させたい選手をタップしてください',
    subButton: '交代',
    captain: '主将 (キャプテン)',
    penaltyTaker: 'PKキッカー',
    freeKickTaker: 'FKキッカー',
    cornerTaker: 'CKキッカー',

    attackingStyle: '攻撃スタイル',
    defensiveStyle: '守備スタイル',
    defensiveLine: 'ディフェンスライン',
    tempo: '試合テンポ',

    fatigue: '疲労',
    condition: 'コンディション',
    fatigueFresh: 'ほぼ疲労なし',
    fatigueLight: '軽い疲労',
    fatigueModerate: '中程度',
    fatigueHigh: '高疲労',
    fatigueExhausted: '非常に高い疲労',
    condPink: '絶好調 (+8%)',
    condRed: '好調 (+4%)',
    condYellow: '普通 (0%)',
    condCyan: '不調 (-4%)',
    condPurple: '絶不調 (-8%)',

    matchDay: 'マッチデイ',
    kickoff: 'キックオフ！試合開始',
    halftime: 'ハーフタイム',
    secondHalf: '後半開始',
    fulltime: '試合終了 (タイムアップ)',
    matchFinished: '試合終了',
    matchEvents: '試合イベントタイムライン',
    liveTimeline: 'リアルタイム経過ログ',
    coachAdvice: 'アシスタントコーチの分析',
    motm: 'MOM (マン・オブ・ザ・マッチ)',
    proceedToPress: '記者会見へ進む',
    speed: '速度',
    speedNormal: '標準 1x',
    speedFast: '速い 2x',
    speedVeryFast: '高速 4x',
    speedInstant: '即時スキップ',
    goal: 'ゴール！',
    assist: 'アシスト',
    ownGoal: 'オウンゴール',
    penalty: 'PKゴール',
    yellowCard: '警告 (イエローカード)',
    redCard: '退場 (レッドカード)',
    substitution: '選手交代',
    injury: '負傷発生',
    varCheck: 'VAR確認',
    bigChance: '決定機！',
    save: 'ファインセーブ！',
    shots: 'シュート数',
    shotsOnTarget: '枠内シュート',
    possession: 'ボール支配率',
    corners: 'コーナーキック',
    fouls: 'ファウル数',
    passAccuracy: 'パス成功率',
    expectedGoals: 'ゴール期待値 (xG)',

    marketTitle: '移籍市場・スカウティング',
    allPositions: '全ポジション',
    searchPlayers: '選手名で検索...',
    makeOffer: '獲得交渉を開始',
    marketValue: '市場価値',
    wage: '週給',
    rivalClubWarning: '【宿敵クラブ警告】ライバル関係にあるクラブとの交渉のため、移籍金・年俸の要求額が大幅に引き上げられています。',
    rivalBadge: '宿敵',
    clubNegotiation: 'クラブ間移籍金交渉',
    playerNegotiation: '選手個人契約交渉',
    bidAmount: '提示移籍金額',
    offerWage: '提示週給',
    signingBonus: '契約金 (ボーナス)',
    squadRole: 'チーム内役割',
    patience: 'クラブ忍耐度',
    submitBid: 'オファーを提示する',
    agreeTransfer: '契約合意・移籍完了！',
    negotiationCollapsed: '交渉決裂',

    standings: '順位表',
    fixtures: '対戦日程・結果',
    rank: '順位',
    club: 'クラブ',
    played: '試合',
    won: '勝',
    drawn: '分',
    lost: '敗',
    goalsFor: '得点',
    goalsAgainst: '失点',
    goalDiff: '得失差',
    points: '勝点',
    form: '直近',
    champSpot: 'リーグ優勝',
    uclSpot: '欧州CL本戦 / ACL本戦',
    uelSpot: '欧州EL出場圏',
    relegationSpot: '降格圏 (残留争い)',

    settingsTitle: 'キャリア管理・言語設定',
    languageSelect: 'ゲーム内言語 (Language)',
    languageJa: '日本語 (Japanese)',
    languageEn: 'English (英語)',
    languageEs: 'Español (スペイン語)'
  },

  en: {
    appTitle: 'Football Manager 2026/27',
    season: '2026/27 Season',
    date: 'Date',
    nextDay: 'Next Day',
    simulating: 'Simulating...',
    skipMenu: 'Fast Forward',
    skipNextMatch: 'Until Next Match',
    skipDeadline: 'Until Transfer Deadline',
    skip7Days: 'Advance 1 Week (7 Days)',
    skipMonthEnd: 'Until End of Month',
    resetGameData: '🔄 Reset Game Data',
    resetConfirmTitle: 'Reset Game Data Completely?',
    resetConfirmBody: 'This will erase all current manager career history, match results, transfers, player conditions, and standings, returning the world state to 2026/27 pre-season. Base database of real clubs and players will remain intact.',
    resetTypeConfirmPrompt: 'Type "RESET" to confirm:',
    cancel: 'Cancel',
    confirmReset: 'Execute Reset',
    resetSuccess: 'Game data successfully reset. Starting a new career.',

    tabHome: 'Home',
    tabTactics: 'Tactics & Squad',
    tabTransfers: 'Transfers',
    tabFixtures: 'Fixtures & Tables',
    tabClub: 'Club & Settings',

    transferBudget: 'Transfer Budget',
    wageBudget: 'Wage Budget',
    boardConfidence: 'Board Confidence',
    fanApproval: 'Fan Approval',
    transferDeadlineDays: 'Transfer Window Closes in',
    daysRemaining: 'days',

    createManagerTitle: 'Create Manager Profile',
    createManagerSub: 'Configure your attributes to begin your journey across world football in the 2026/27 season.',
    managerName: 'Manager Name',
    nationality: 'Nationality',
    age: 'Age',
    managerIcon: 'Manager Avatar',
    managerStyle: 'Managerial Philosophy',
    tacticalType: 'Tactical Preference',
    specialty: 'Specialty Area',
    createManagerSubmit: 'Confirm Profile & View 5 Club Offers',

    clubOffersTitle: 'Official Managerial Proposals',
    clubOffersSub: 'Select your starting club from five distinct, balanced projects that match your profile.',
    officialOffers: '★ 5 Official Offers',
    browseAllClubs: '🌍 Browse All 116 Clubs',
    reRollOffers: '🎲 Re-roll 5 Random Offers',
    searchClubs: 'Search club...',
    stadium: 'Stadium',
    capacity: 'Capacity',
    contractOffer: 'Contract Offer',
    contractYears: 'Contract Duration: 3 Years (until 2029)',
    managerSalary: 'Offered Salary',
    clubTarget: 'Board Objective',
    fanExpectation: 'Supporter Expectations',
    boardStatement: 'Board of Directors Message',
    signContract: 'Sign Managerial Contract with',

    tacticsTitle: 'Tactical Board & Squad Selection',
    formation: 'Formation',
    lineupTab: 'Starting XI & Bench',
    instructionsTab: 'Tactical Instructions',
    rolesTab: 'Roles & Set Pieces',
    starters: 'Starting Lineup (11 Players)',
    substitutes: 'Substitutes',
    reserves: 'Reserves',
    subInstruction: '← Tap a player on the bench to substitute',
    subButton: 'Sub',
    captain: 'Team Captain',
    penaltyTaker: 'Penalty Taker',
    freeKickTaker: 'Free Kick Taker',
    cornerTaker: 'Corner Taker',

    attackingStyle: 'Attacking Style',
    defensiveStyle: 'Pressing Style',
    defensiveLine: 'Defensive Line',
    tempo: 'Match Tempo',

    fatigue: 'Fatigue',
    condition: 'Condition',
    fatigueFresh: 'Fresh',
    fatigueLight: 'Light Fatigue',
    fatigueModerate: 'Moderate',
    fatigueHigh: 'High Fatigue',
    fatigueExhausted: 'Exhausted',
    condPink: 'Superb (+8%)',
    condRed: 'Good (+4%)',
    condYellow: 'Normal (0%)',
    condCyan: 'Poor (-4%)',
    condPurple: 'Terrible (-8%)',

    matchDay: 'Matchday',
    kickoff: 'Kickoff! Match Underway',
    halftime: 'Half Time',
    secondHalf: 'Second Half Begins',
    fulltime: 'Full Time',
    matchFinished: 'Match Finished',
    matchEvents: 'Match Events Timeline',
    liveTimeline: 'Live Match Log',
    coachAdvice: 'Assistant Coach Assessment',
    motm: 'Player of the Match (MOTM)',
    proceedToPress: 'Proceed to Press Conference',
    speed: 'Speed',
    speedNormal: 'Normal 1x',
    speedFast: 'Fast 2x',
    speedVeryFast: 'Very Fast 4x',
    speedInstant: 'Instant Skip',
    goal: 'GOAL!',
    assist: 'Assist',
    ownGoal: 'Own Goal',
    penalty: 'Penalty Goal',
    yellowCard: 'Yellow Card',
    redCard: 'Red Card',
    substitution: 'Substitution',
    injury: 'Injury Sustained',
    varCheck: 'VAR Check',
    bigChance: 'Big Chance!',
    save: 'Great Save!',
    shots: 'Total Shots',
    shotsOnTarget: 'Shots on Target',
    possession: 'Possession',
    corners: 'Corners',
    fouls: 'Fouls Committed',
    passAccuracy: 'Pass Accuracy',
    expectedGoals: 'Expected Goals (xG)',

    marketTitle: 'Transfer Market & Scouting',
    allPositions: 'All Positions',
    searchPlayers: 'Search player name...',
    makeOffer: 'Submit Transfer Bid',
    marketValue: 'Market Value',
    wage: 'Wage',
    rivalClubWarning: '【Rival Club Warning】Negotiating with a fierce rival! Transfer fee and wage expectations are substantially increased.',
    rivalBadge: 'RIVAL',
    clubNegotiation: 'Club-to-Club Fee Negotiation',
    playerNegotiation: 'Player Personal Terms',
    bidAmount: 'Offered Transfer Fee',
    offerWage: 'Offered Weekly Wage',
    signingBonus: 'Signing Bonus',
    squadRole: 'Squad Role',
    patience: 'Club Patience',
    submitBid: 'Send Official Bid',
    agreeTransfer: 'Agreement Reached & Transfer Finalized!',
    negotiationCollapsed: 'Negotiations Collapsed',

    standings: 'League Table',
    fixtures: 'Fixtures & Results',
    rank: 'Pos',
    club: 'Club',
    played: 'P',
    won: 'W',
    drawn: 'D',
    lost: 'L',
    goalsFor: 'GF',
    goalsAgainst: 'GA',
    goalDiff: 'GD',
    points: 'Pts',
    form: 'Form',
    champSpot: 'Champions',
    uclSpot: 'Champions League',
    uelSpot: 'Europa League',
    relegationSpot: 'Relegation Zone',

    settingsTitle: 'Career Management & Language',
    languageSelect: 'In-Game Language',
    languageJa: '日本語 (Japanese)',
    languageEn: 'English',
    languageEs: 'Español (Spanish)'
  },

  es: {
    appTitle: 'Football Manager 2026/27',
    season: 'Temporada 2026/27',
    date: 'Fecha',
    nextDay: 'Siguiente día',
    simulating: 'Simulando...',
    skipMenu: 'Avance rápido',
    skipNextMatch: 'Hasta el próximo partido',
    skipDeadline: 'Hasta cierre de mercado',
    skip7Days: 'Avanzar 1 semana (7 días)',
    skipMonthEnd: 'Hasta final de mes',
    resetGameData: '🔄 Reiniciar datos del juego',
    resetConfirmTitle: '¿Reiniciar todos los datos?',
    resetConfirmBody: 'Se eliminarán la carrera del entrenador, resultados de partidos, fichajes, estados de jugadores y clasificaciones. Se restablecerá el estado al inicio de la temporada 2026/27. La base de datos de clubes y jugadores reales se mantendrá intacta.',
    resetTypeConfirmPrompt: 'Escribe "RESET" para confirmar:',
    cancel: 'Cancelar',
    confirmReset: 'Confirmar reinicio',
    resetSuccess: 'Datos reiniciados con éxito. Comenzando nueva carrera.',

    tabHome: 'Inicio',
    tabTactics: 'Táctica y Plantilla',
    tabTransfers: 'Fichajes',
    tabFixtures: 'Partidos y Tabla',
    tabClub: 'Club y Ajustes',

    transferBudget: 'Presupuesto de fichajes',
    wageBudget: 'Presupuesto salarial',
    boardConfidence: 'Confianza directiva',
    fanApproval: 'Aprobación de la afición',
    transferDeadlineDays: 'Cierre de mercado en',
    daysRemaining: 'días',

    createManagerTitle: 'Crear Perfil de Entrenador',
    createManagerSub: 'Configura tus atributos para iniciar tu carrera en la élite del fútbol mundial en la temporada 2026/27.',
    managerName: 'Nombre del entrenador',
    nationality: 'Nacionalidad',
    age: 'Edad',
    managerIcon: 'Avatar',
    managerStyle: 'Filosofía de gestión',
    tacticalType: 'Preferencia táctica',
    specialty: 'Especialidad',
    createManagerSubmit: 'Confirmar perfil y ver ofertas de 5 clubes',

    clubOffersTitle: 'Ofertas Oficiales de Clubes',
    clubOffersSub: 'Elige tu club de inicio entre cinco proyectos equilibrados según tu perfil táctico.',
    officialOffers: '★ 5 Ofertas Oficiales',
    browseAllClubs: '🌍 Explorar los 116 Clubes',
    reRollOffers: '🎲 Sortear 5 ofertas distintas',
    searchClubs: 'Buscar club...',
    stadium: 'Estadio',
    capacity: 'Capacidad',
    contractOffer: 'Oferta de contrato',
    contractYears: 'Duración: 3 Años (hasta 2029)',
    managerSalary: 'Salario propuesto',
    clubTarget: 'Objetivo de la directiva',
    fanExpectation: 'Expectativas de la afición',
    boardStatement: 'Mensaje de la directiva',
    signContract: 'Firmar contrato de entrenador con',

    tacticsTitle: 'Pizarra Táctica y Plantilla',
    formation: 'Alineación',
    lineupTab: 'Once Titular y Suplentes',
    instructionsTab: 'Instrucciones Tácticas',
    rolesTab: 'Roles y Balón Parado',
    starters: 'Once Titular (11 Jugadores)',
    substitutes: 'Banquillo',
    reserves: 'Reservas',
    subInstruction: '← Toca a un jugador del banquillo para sustituir',
    subButton: 'Cambio',
    captain: 'Capitán del equipo',
    penaltyTaker: 'Lanzador de penaltis',
    freeKickTaker: 'Tiros libres',
    cornerTaker: 'Lanzador de córners',

    attackingStyle: 'Estilo de ataque',
    defensiveStyle: 'Estilo de presión',
    defensiveLine: 'Línea defensiva',
    tempo: 'Ritmo de juego',

    fatigue: 'Fatiga',
    condition: 'Forma física',
    fatigueFresh: 'Fresco',
    fatigueLight: 'Fatiga leve',
    fatigueModerate: 'Moderada',
    fatigueHigh: 'Fatiga alta',
    fatigueExhausted: 'Agotado',
    condPink: 'Excelente (+8%)',
    condRed: 'Buena (+4%)',
    condYellow: 'Normal (0%)',
    condCyan: 'Baja (-4%)',
    condPurple: 'Muy baja (-8%)',

    matchDay: 'Jornada de Partido',
    kickoff: '¡Comienza el partido!',
    halftime: 'Descanso',
    secondHalf: 'Comienza la segunda parte',
    fulltime: 'Final del partido',
    matchFinished: 'Partido Finalizado',
    matchEvents: 'Cronología de Eventos',
    liveTimeline: 'Registro en Vivo',
    coachAdvice: 'Análisis del segundo entrenador',
    motm: 'Jugador del Partido (MVP)',
    proceedToPress: 'Ir a Rueda de Prensa',
    speed: 'Velocidad',
    speedNormal: 'Normal 1x',
    speedFast: 'Rápido 2x',
    speedVeryFast: 'Muy Rápido 4x',
    speedInstant: 'Salto directo',
    goal: '¡GOL!',
    assist: 'Asistencia',
    ownGoal: 'Gol en propia puerta',
    penalty: 'Gol de penalti',
    yellowCard: 'Tarjeta Amarilla',
    redCard: 'Tarjeta Roja',
    substitution: 'Sustitución',
    injury: 'Lesión',
    varCheck: 'Revisión del VAR',
    bigChance: '¡Ocasión clara!',
    save: '¡Paradón!',
    shots: 'Tiros totales',
    shotsOnTarget: 'Tiros a puerta',
    possession: 'Posesión',
    corners: 'Córners',
    fouls: 'Faltas cometidas',
    passAccuracy: 'Precisión de pase',
    expectedGoals: 'Goles esperados (xG)',

    marketTitle: 'Mercado de Fichajes y Ojeo',
    allPositions: 'Todas las posiciones',
    searchPlayers: 'Buscar jugador...',
    makeOffer: 'Iniciar negociación',
    marketValue: 'Valor de mercado',
    wage: 'Salario',
    rivalClubWarning: '【Aviso de Rivalidad】¡Negociando con un máximo rival! El precio de traspaso y el sueldo exigido son considerablemente más altos.',
    rivalBadge: 'RIVAL',
    clubNegotiation: 'Negociación entre clubes',
    playerNegotiation: 'Condiciones del jugador',
    bidAmount: 'Oferta de traspaso',
    offerWage: 'Salario semanal ofrecido',
    signingBonus: 'Prima de fichaje',
    squadRole: 'Rol en el equipo',
    patience: 'Paciencia del club',
    submitBid: 'Enviar oferta oficial',
    agreeTransfer: '¡Acuerdo alcanzado y fichaje completado!',
    negotiationCollapsed: 'Negociación rota',

    standings: 'Clasificación',
    fixtures: 'Calendario y Resultados',
    rank: 'Pos',
    club: 'Club',
    played: 'PJ',
    won: 'PG',
    drawn: 'PE',
    lost: 'PP',
    goalsFor: 'GF',
    goalsAgainst: 'GC',
    goalDiff: 'DG',
    points: 'Pts',
    form: 'Racha',
    champSpot: 'Campeón',
    uclSpot: 'Liga de Campeones',
    uelSpot: 'Liga Europa',
    relegationSpot: 'Zona de descenso',

    settingsTitle: 'Gestión de Carrera e Idioma',
    languageSelect: 'Idioma del juego',
    languageJa: '日本語 (Japonés)',
    languageEn: 'English (Inglés)',
    languageEs: 'Español'
  }
};

const LANG_KEY = 'fm26_app_language';
let memoryLanguage: Language = 'ja';

export function getSavedLanguage(): Language {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'es' || saved === 'ja') {
        return saved;
      }
    }
  } catch (e) {
    // Ignore
  }
  return memoryLanguage;
}

export function saveLanguage(lang: Language): void {
  memoryLanguage = lang;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_KEY, lang);
    }
  } catch (e) {
    // Ignore
  }
}
