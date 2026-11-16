import { Club, LeagueKey } from '../types/game';

/**
 * 2026/27 Season Official UEFA European Competition Participants (108 Total Clubs)
 * - UEFA Champions League (UCL): 36 clubs (28 Group A in 17-league DB + 8 Group B Tournament-Only)
 * - UEFA Europa League (UEL): 36 clubs (18 Group A in 17-league DB + 18 Group B Tournament-Only)
 * - UEFA Conference League (UECL): 36 clubs (11 Group A in 17-league DB + 25 Group B Tournament-Only)
 *
 * CRITICAL DESIGN RULES:
 * - Zero duplicate clubs across CL, EL, and ECL (108 unique clubs total).
 * - Group A (57 clubs): Existing clubs inside the 17 domestic leagues. Excluded from fixed tournament-only slots;
 *   from Season 2 onward, Group A slots are dynamically recalculated EVERY season from domestic league standings + cup winners.
 * - Group B (51 clubs): Clubs outside the 17 domestic leagues. Registered ONLY as `isTournamentOnly: true` clubs
 *   with individualized UEFA strength ratings (`tournamentRatings`) and fixed `europeanFixedComp`.
 *   They NEVER appear in domestic leagues, ClubOfferModal, TransferMarketTab, or manager job offers.
 */

export const UCL_2026_GROUP_A_IDS: string[] = [
  // Pot 1 (9/9)
  'psg', 'bayern', 'real_madrid', 'liverpool', 'inter',
  'man_city', 'arsenal', 'barcelona', 'atletico_madrid',
  // Pot 2 (9/9)
  'dortmund', 'roma', 'sporting_cp', 'aston_villa', 'fc_porto',
  'man_united', 'club_brugge', 'real_betis', 'psv_eindhoven',
  // Pot 3 (7 Group A + 2 Group B)
  'feyenoord', 'lille', 'napoli', 'rb_leipzig', 'villarreal',
  'fenerbahce', 'galatasaray',
  // Pot 4 (3 Group A + 6 Group B)
  'stuttgart', 'como', 'lens'
]; // Total = 28 Group A clubs

export const UEL_2026_GROUP_A_IDS: string[] = [
  'bournemouth', 'crystal_palace', 'sunderland',
  'lyon', 'marseille', 'rennes',
  'hoffenheim', 'leverkusen',
  'milan', 'juventus',
  'real_sociedad', 'celta_vigo',
  'sl_benfica',
  'az_alkmaar', 'nec_nijmegen',
  'rsc_anderlecht', 'union_sg',
  'besiktas'
]; // Total = 18 Group A clubs

export const UECL_2026_GROUP_A_IDS: string[] = [
  'kaa_gent', 'sint_truiden',
  'brighton',
  'monaco',
  'freiburg',
  'atalanta',
  'afc_ajax', 'fc_twente',
  'sc_braga',
  'getafe',
  'trabzonspor'
]; // Total = 11 Group A clubs

export const EUROPEAN_GROUP_A_SLOT_COUNTS = {
  ucl: 28,
  uel: 18,
  uecl: 11
} as const;

interface TournamentOnlyClubSeed {
  id: string;
  name: string;
  shortName: string;
  country: string;
  comp: 'ucl' | 'uel' | 'uecl';
  reputation: number;
  tier: Club['tier'];
  stadiumName: string;
  stadiumCapacity: number;
  primaryColor: string;
  secondaryColor: string;
  ratings: {
    overall: number;
    attack: number;
    midfield: number;
    defense: number;
    gk: number;
  };
}

const GROUP_B_SEEDS: TournamentOnlyClubSeed[] = [
  // ============================================================================
  // UCL Group B (8 clubs — Pot 3 & Pot 4)
  // ============================================================================
  {
    id: 'euro_bodo_glimt',
    name: 'Bodø/Glimt',
    shortName: 'BOD',
    country: 'ノルウェー',
    comp: 'ucl',
    reputation: 79,
    tier: 'Upper',
    stadiumName: 'Aspmyra Stadion',
    stadiumCapacity: 8270,
    primaryColor: '#FACC15',
    secondaryColor: '#111827',
    ratings: { overall: 77, attack: 79, midfield: 77, defense: 75, gk: 75 }
  },
  {
    id: 'euro_shakhtar_donetsk',
    name: 'Shakhtar Donetsk',
    shortName: 'SHA',
    country: 'ウクライナ',
    comp: 'ucl',
    reputation: 80,
    tier: 'Upper',
    stadiumName: 'Arena Lviv',
    stadiumCapacity: 34915,
    primaryColor: '#EA580C',
    secondaryColor: '#111827',
    ratings: { overall: 77, attack: 78, midfield: 77, defense: 75, gk: 76 }
  },
  {
    id: 'euro_slavia_praha',
    name: 'SK Slavia Praha',
    shortName: 'SLA',
    country: 'チェコ',
    comp: 'ucl',
    reputation: 78,
    tier: 'Mid',
    stadiumName: 'Fortuna Arena',
    stadiumCapacity: 19370,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 76, attack: 77, midfield: 76, defense: 76, gk: 75 }
  },
  {
    id: 'euro_slovan_bratislava',
    name: 'ŠK Slovan Bratislava',
    shortName: 'SLO',
    country: 'スロバキア',
    comp: 'ucl',
    reputation: 73,
    tier: 'Mid',
    stadiumName: 'Tehelné pole',
    stadiumCapacity: 22500,
    primaryColor: '#0284C7',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 73, attack: 74, midfield: 73, defense: 72, gk: 72 }
  },
  {
    id: 'euro_aek_athens',
    name: 'AEK Athens',
    shortName: 'AEK',
    country: 'ギリシャ',
    comp: 'ucl',
    reputation: 75,
    tier: 'Mid',
    stadiumName: 'OPAP Arena',
    stadiumCapacity: 32500,
    primaryColor: '#EAB308',
    secondaryColor: '#171717',
    ratings: { overall: 75, attack: 76, midfield: 75, defense: 73, gk: 74 }
  },
  {
    id: 'euro_lask',
    name: 'LASK',
    shortName: 'LAS',
    country: 'オーストリア',
    comp: 'ucl',
    reputation: 74,
    tier: 'Mid',
    stadiumName: 'Raiffeisen Arena',
    stadiumCapacity: 19080,
    primaryColor: '#171717',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 73, attack: 74, midfield: 73, defense: 73, gk: 72 }
  },
  {
    id: 'euro_viking_fk',
    name: 'Viking FK',
    shortName: 'VIK',
    country: 'ノルウェー',
    comp: 'ucl',
    reputation: 73,
    tier: 'Mid',
    stadiumName: 'Lyse Arena',
    stadiumCapacity: 15900,
    primaryColor: '#1E3A8A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 73, attack: 74, midfield: 73, defense: 72, gk: 72 }
  },
  {
    id: 'euro_sabah_fk',
    name: 'Sabah FK',
    shortName: 'SAB',
    country: 'アゼルバイジャン',
    comp: 'ucl',
    reputation: 67,
    tier: 'Lower',
    stadiumName: 'Bank Respublika Arena',
    stadiumCapacity: 13000,
    primaryColor: '#0F172A',
    secondaryColor: '#38BDF8',
    ratings: { overall: 69, attack: 70, midfield: 69, defense: 68, gk: 68 }
  },

  // ============================================================================
  // UEL Group B (18 clubs)
  // ============================================================================
  {
    id: 'euro_olympiacos',
    name: 'Olympiacos',
    shortName: 'OLY',
    country: 'ギリシャ',
    comp: 'uel',
    reputation: 78,
    tier: 'Upper',
    stadiumName: 'Karaiskakis Stadium',
    stadiumCapacity: 33334,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 76, attack: 77, midfield: 76, defense: 75, gk: 75 }
  },
  {
    id: 'euro_rb_salzburg',
    name: 'FC Red Bull Salzburg',
    shortName: 'SAL',
    country: 'オーストリア',
    comp: 'uel',
    reputation: 77,
    tier: 'Upper',
    stadiumName: 'Red Bull Arena',
    stadiumCapacity: 30188,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 75, attack: 77, midfield: 75, defense: 74, gk: 74 }
  },
  {
    id: 'euro_celtic',
    name: 'Celtic',
    shortName: 'CEL',
    country: 'スコットランド',
    comp: 'uel',
    reputation: 78,
    tier: 'Upper',
    stadiumName: 'Celtic Park',
    stadiumCapacity: 60411,
    primaryColor: '#16A34A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 76, attack: 77, midfield: 76, defense: 75, gk: 75 }
  },
  {
    id: 'euro_dinamo_zagreb',
    name: 'GNK Dinamo Zagreb',
    shortName: 'DIN',
    country: 'クロアチア',
    comp: 'uel',
    reputation: 76,
    tier: 'Mid',
    stadiumName: 'Stadion Maksimir',
    stadiumCapacity: 24851,
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 75, attack: 76, midfield: 75, defense: 74, gk: 74 }
  },
  {
    id: 'euro_sparta_praha',
    name: 'AC Sparta Praha',
    shortName: 'SPA',
    country: 'チェコ',
    comp: 'uel',
    reputation: 75,
    tier: 'Mid',
    stadiumName: 'epet ARENA',
    stadiumCapacity: 18349,
    primaryColor: '#991B1B',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 74, attack: 75, midfield: 74, defense: 74, gk: 73 }
  },
  {
    id: 'euro_viktoria_plzen',
    name: 'FC Viktoria Plzeň',
    shortName: 'PLZ',
    country: 'チェコ',
    comp: 'uel',
    reputation: 74,
    tier: 'Mid',
    stadiumName: 'Doosan Arena',
    stadiumCapacity: 11700,
    primaryColor: '#1D4ED8',
    secondaryColor: '#DC2626',
    ratings: { overall: 74, attack: 74, midfield: 74, defense: 73, gk: 74 }
  },
  {
    id: 'euro_ferencvaros',
    name: 'Ferencvárosi TC',
    shortName: 'FTC',
    country: 'ハンガリー',
    comp: 'uel',
    reputation: 74,
    tier: 'Mid',
    stadiumName: 'Groupama Arena',
    stadiumCapacity: 22000,
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 73, attack: 74, midfield: 73, defense: 73, gk: 72 }
  },
  {
    id: 'euro_sturm_graz',
    name: 'SK Sturm Graz',
    shortName: 'STU',
    country: 'オーストリア',
    comp: 'uel',
    reputation: 73,
    tier: 'Mid',
    stadiumName: 'Merkur Arena',
    stadiumCapacity: 16364,
    primaryColor: '#171717',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 73, attack: 73, midfield: 73, defense: 72, gk: 72 }
  },
  {
    id: 'euro_lech_poznan',
    name: 'Lech Poznań',
    shortName: 'LEC',
    country: 'ポーランド',
    comp: 'uel',
    reputation: 73,
    tier: 'Mid',
    stadiumName: 'Enea Stadion',
    stadiumCapacity: 42837,
    primaryColor: '#1E40AF',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 72, attack: 73, midfield: 72, defense: 72, gk: 71 }
  },
  {
    id: 'euro_jagiellonia',
    name: 'Jagiellonia Białystok',
    shortName: 'JAG',
    country: 'ポーランド',
    comp: 'uel',
    reputation: 72,
    tier: 'Mid',
    stadiumName: 'Chorten Arena',
    stadiumCapacity: 22372,
    primaryColor: '#EAB308',
    secondaryColor: '#DC2626',
    ratings: { overall: 72, attack: 73, midfield: 72, defense: 71, gk: 71 }
  },
  {
    id: 'euro_lillestrom',
    name: 'Lillestrøm SK',
    shortName: 'LIL',
    country: 'ノルウェー',
    comp: 'uel',
    reputation: 69,
    tier: 'Mid',
    stadiumName: 'Åråsen Stadion',
    stadiumCapacity: 11500,
    primaryColor: '#FACC15',
    secondaryColor: '#171717',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_levski_sofia',
    name: 'PFC Levski Sofia',
    shortName: 'LEV',
    country: 'ブルガリア',
    comp: 'uel',
    reputation: 69,
    tier: 'Lower',
    stadiumName: 'Vivacom Arena',
    stadiumCapacity: 25000,
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 70, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_omonia',
    name: 'Omonia Nicosia',
    shortName: 'OMO',
    country: 'キプロス',
    comp: 'uel',
    reputation: 70,
    tier: 'Lower',
    stadiumName: 'GSP Stadium',
    stadiumCapacity: 22859,
    primaryColor: '#16A34A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_ofi_crete',
    name: 'OFI Crete',
    shortName: 'OFI',
    country: 'ギリシャ',
    comp: 'uel',
    reputation: 68,
    tier: 'Lower',
    stadiumName: 'Theodoros Vardinogiannis',
    stadiumCapacity: 9088,
    primaryColor: '#171717',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 69, attack: 69, midfield: 69, defense: 68, gk: 68 }
  },
  {
    id: 'euro_hapoel_beer_sheva',
    name: "Hapoel Be'er Sheva",
    shortName: 'HBS',
    country: 'イスラエル',
    comp: 'uel',
    reputation: 70,
    tier: 'Lower',
    stadiumName: 'Turner Stadium',
    stadiumCapacity: 16126,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 70 }
  },
  {
    id: 'euro_celje',
    name: 'NK Celje',
    shortName: 'CELJ',
    country: 'スロベニア',
    comp: 'uel',
    reputation: 69,
    tier: 'Lower',
    stadiumName: 'Stadion Z’dežele',
    stadiumCapacity: 13059,
    primaryColor: '#2563EB',
    secondaryColor: '#FACC15',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_torreense',
    name: 'SCU Torreense',
    shortName: 'TOR',
    country: 'ポルトガル',
    comp: 'uel',
    reputation: 68,
    tier: 'Lower',
    stadiumName: 'Estádio Manuel Marques',
    stadiumCapacity: 12000,
    primaryColor: '#1D4ED8',
    secondaryColor: '#DC2626',
    ratings: { overall: 69, attack: 70, midfield: 69, defense: 69, gk: 68 }
  },
  {
    id: 'euro_ararat_armenia',
    name: 'FC Ararat-Armenia',
    shortName: 'ARA',
    country: 'アルメニア',
    comp: 'uel',
    reputation: 64,
    tier: 'Lower',
    stadiumName: 'Yerevan Football Academy',
    stadiumCapacity: 1428,
    primaryColor: '#DC2626',
    secondaryColor: '#111827',
    ratings: { overall: 67, attack: 68, midfield: 67, defense: 66, gk: 66 }
  },

  // ============================================================================
  // UECL Group B (25 clubs)
  // ============================================================================
  {
    id: 'euro_red_star',
    name: 'Red Star Belgrade (Crvena zvezda)',
    shortName: 'CZV',
    country: 'セルビア',
    comp: 'uecl',
    reputation: 76,
    tier: 'Mid',
    stadiumName: 'Rajko Mitić Stadium',
    stadiumCapacity: 53000,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 74, attack: 75, midfield: 74, defense: 73, gk: 73 }
  },
  {
    id: 'euro_panathinaikos',
    name: 'Panathinaikos',
    shortName: 'PAO',
    country: 'ギリシャ',
    comp: 'uecl',
    reputation: 76,
    tier: 'Mid',
    stadiumName: 'OAKA Stadium',
    stadiumCapacity: 69618,
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 74, attack: 75, midfield: 74, defense: 73, gk: 74 }
  },
  {
    id: 'euro_copenhagen',
    name: 'FC Copenhagen',
    shortName: 'FCK',
    country: 'デンマーク',
    comp: 'uecl',
    reputation: 77,
    tier: 'Upper',
    stadiumName: 'Parken Stadium',
    stadiumCapacity: 38065,
    primaryColor: '#FFFFFF',
    secondaryColor: '#1D4ED8',
    ratings: { overall: 75, attack: 75, midfield: 75, defense: 74, gk: 74 }
  },
  {
    id: 'euro_midtjylland',
    name: 'FC Midtjylland',
    shortName: 'FCM',
    country: 'デンマーク',
    comp: 'uecl',
    reputation: 75,
    tier: 'Mid',
    stadiumName: 'MCH Arena',
    stadiumCapacity: 11809,
    primaryColor: '#171717',
    secondaryColor: '#DC2626',
    ratings: { overall: 73, attack: 74, midfield: 73, defense: 72, gk: 72 }
  },
  {
    id: 'euro_hajduk_split',
    name: 'HNK Hajduk Split',
    shortName: 'HAJ',
    country: 'クロアチア',
    comp: 'uecl',
    reputation: 73,
    tier: 'Mid',
    stadiumName: 'Stadion Poljud',
    stadiumCapacity: 33987,
    primaryColor: '#FFFFFF',
    secondaryColor: '#1D4ED8',
    ratings: { overall: 72, attack: 73, midfield: 72, defense: 71, gk: 71 }
  },
  {
    id: 'euro_lugano',
    name: 'FC Lugano',
    shortName: 'LUG',
    country: 'スイス',
    comp: 'uecl',
    reputation: 72,
    tier: 'Mid',
    stadiumName: 'Stadio di Cornaredo',
    stadiumCapacity: 6330,
    primaryColor: '#171717',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 72, attack: 72, midfield: 72, defense: 71, gk: 71 }
  },
  {
    id: 'euro_nordsjaelland',
    name: 'FC Nordsjælland',
    shortName: 'FCN',
    country: 'デンマーク',
    comp: 'uecl',
    reputation: 72,
    tier: 'Mid',
    stadiumName: 'Right to Dream Park',
    stadiumCapacity: 10300,
    primaryColor: '#DC2626',
    secondaryColor: '#FACC15',
    ratings: { overall: 71, attack: 73, midfield: 72, defense: 70, gk: 70 }
  },
  {
    id: 'euro_agf_aarhus',
    name: 'AGF Aarhus',
    shortName: 'AGF',
    country: 'デンマーク',
    comp: 'uecl',
    reputation: 71,
    tier: 'Mid',
    stadiumName: 'Ceres Park',
    stadiumCapacity: 19433,
    primaryColor: '#FFFFFF',
    secondaryColor: '#1E3A8A',
    ratings: { overall: 71, attack: 71, midfield: 71, defense: 70, gk: 70 }
  },
  {
    id: 'euro_brann',
    name: 'SK Brann',
    shortName: 'BRA',
    country: 'ノルウェー',
    comp: 'uecl',
    reputation: 71,
    tier: 'Mid',
    stadiumName: 'Brann Stadion',
    stadiumCapacity: 16750,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 71, attack: 72, midfield: 71, defense: 70, gk: 70 }
  },
  {
    id: 'euro_hearts',
    name: 'Heart of Midlothian',
    shortName: 'HEA',
    country: 'スコットランド',
    comp: 'uecl',
    reputation: 72,
    tier: 'Mid',
    stadiumName: 'Tynecastle Park',
    stadiumCapacity: 19852,
    primaryColor: '#7F1D1D',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 71, attack: 71, midfield: 71, defense: 71, gk: 71 }
  },
  {
    id: 'euro_pafos',
    name: 'Pafos FC',
    shortName: 'PAF',
    country: 'キプロス',
    comp: 'uecl',
    reputation: 70,
    tier: 'Lower',
    stadiumName: 'Stelios Kyriakides',
    stadiumCapacity: 9394,
    primaryColor: '#0284C7',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 70 }
  },
  {
    id: 'euro_universitatea_craiova',
    name: 'Universitatea Craiova',
    shortName: 'CRA',
    country: 'ルーマニア',
    comp: 'uecl',
    reputation: 70,
    tier: 'Lower',
    stadiumName: 'Ion Oblemenco',
    stadiumCapacity: 30983,
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 71, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_jablonec',
    name: 'FK Jablonec',
    shortName: 'JAB',
    country: 'チェコ',
    comp: 'uecl',
    reputation: 69,
    tier: 'Lower',
    stadiumName: 'Stadion Střelnice',
    stadiumCapacity: 6108,
    primaryColor: '#16A34A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 69, attack: 69, midfield: 69, defense: 69, gk: 69 }
  },
  {
    id: 'euro_cska_sofia',
    name: 'CSKA Sofia',
    shortName: 'CSK',
    country: 'ブルガリア',
    comp: 'uecl',
    reputation: 70,
    tier: 'Lower',
    stadiumName: 'Balgarska Armia',
    stadiumCapacity: 22995,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 70, attack: 70, midfield: 70, defense: 69, gk: 69 }
  },
  {
    id: 'euro_mjallby',
    name: 'Mjällby AIF',
    shortName: 'MJA',
    country: 'スウェーデン',
    comp: 'uecl',
    reputation: 69,
    tier: 'Lower',
    stadiumName: 'Strandvallen',
    stadiumCapacity: 6000,
    primaryColor: '#FACC15',
    secondaryColor: '#171717',
    ratings: { overall: 69, attack: 70, midfield: 69, defense: 69, gk: 68 }
  },
  {
    id: 'euro_thun',
    name: 'FC Thun',
    shortName: 'THU',
    country: 'スイス',
    comp: 'uecl',
    reputation: 69,
    tier: 'Lower',
    stadiumName: 'Stockhorn Arena',
    stadiumCapacity: 10014,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 69, attack: 70, midfield: 69, defense: 68, gk: 69 }
  },
  {
    id: 'euro_kairat_almaty',
    name: 'FC Kairat Almaty',
    shortName: 'KAI',
    country: 'カザフスタン',
    comp: 'uecl',
    reputation: 68,
    tier: 'Lower',
    stadiumName: 'Almaty Central Stadium',
    stadiumCapacity: 23804,
    primaryColor: '#FACC15',
    secondaryColor: '#171717',
    ratings: { overall: 68, attack: 69, midfield: 68, defense: 68, gk: 68 }
  },
  {
    id: 'euro_borac_banja_luka',
    name: 'FK Borac Banja Luka',
    shortName: 'BOR',
    country: 'ボスニア・ヘルツェゴビナ',
    comp: 'uecl',
    reputation: 67,
    tier: 'Lower',
    stadiumName: 'Banja Luka City Stadium',
    stadiumCapacity: 10030,
    primaryColor: '#DC2626',
    secondaryColor: '#1D4ED8',
    ratings: { overall: 68, attack: 68, midfield: 68, defense: 67, gk: 67 }
  },
  {
    id: 'euro_riga_fc',
    name: 'Riga FC',
    shortName: 'RIG',
    country: 'ラトビア',
    comp: 'uecl',
    reputation: 66,
    tier: 'Lower',
    stadiumName: 'Skonto Stadium',
    stadiumCapacity: 8087,
    primaryColor: '#1E3A8A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 67, attack: 68, midfield: 67, defense: 66, gk: 67 }
  },
  {
    id: 'euro_kups',
    name: 'KuPS Kuopio',
    shortName: 'KUP',
    country: 'フィンランド',
    comp: 'uecl',
    reputation: 67,
    tier: 'Lower',
    stadiumName: 'Väre Areena',
    stadiumCapacity: 5000,
    primaryColor: '#FACC15',
    secondaryColor: '#171717',
    ratings: { overall: 67, attack: 68, midfield: 67, defense: 66, gk: 67 }
  },
  {
    id: 'euro_egnatia',
    name: 'KF Egnatia',
    shortName: 'EGN',
    country: 'アルバニア',
    comp: 'uecl',
    reputation: 63,
    tier: 'Lower',
    stadiumName: 'Egnatia Arena',
    stadiumCapacity: 4000,
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 65, attack: 66, midfield: 65, defense: 64, gk: 64 }
  },
  {
    id: 'euro_kauno_zalgiris',
    name: 'FK Kauno Žalgiris',
    shortName: 'KAU',
    country: 'リトアニア',
    comp: 'uecl',
    reputation: 63,
    tier: 'Lower',
    stadiumName: 'Darius and Girėnas',
    stadiumCapacity: 15026,
    primaryColor: '#16A34A',
    secondaryColor: '#FFFFFF',
    ratings: { overall: 65, attack: 65, midfield: 65, defense: 64, gk: 64 }
  },
  {
    id: 'euro_iberia_tbilisi',
    name: 'FC Iberia 1999 Tbilisi',
    shortName: 'IBE',
    country: 'ジョージア',
    comp: 'uecl',
    reputation: 64,
    tier: 'Lower',
    stadiumName: 'Mikheil Meskhi Stadium',
    stadiumCapacity: 27223,
    primaryColor: '#DC2626',
    secondaryColor: '#171717',
    ratings: { overall: 65, attack: 66, midfield: 65, defense: 64, gk: 65 }
  },
  {
    id: 'euro_inter_escaldes',
    name: "Inter Club d'Escaldes",
    shortName: 'INT',
    country: 'アンドラ',
    comp: 'uecl',
    reputation: 61,
    tier: 'Lower',
    stadiumName: 'Estadi Comunal',
    stadiumCapacity: 1300,
    primaryColor: '#1D4ED8',
    secondaryColor: '#171717',
    ratings: { overall: 63, attack: 63, midfield: 63, defense: 62, gk: 63 }
  },
  {
    id: 'euro_lincoln_red_imps',
    name: 'Lincoln Red Imps',
    shortName: 'LRI',
    country: 'ジブラルタル',
    comp: 'uecl',
    reputation: 62,
    tier: 'Lower',
    stadiumName: 'Victoria Stadium',
    stadiumCapacity: 5000,
    primaryColor: '#DC2626',
    secondaryColor: '#171717',
    ratings: { overall: 63, attack: 64, midfield: 63, defense: 62, gk: 63 }
  }
];

export const GROUP_B_TOURNAMENT_CLUBS: Club[] = GROUP_B_SEEDS.map(seed => ({
  id: seed.id,
  name: seed.name,
  shortName: seed.shortName,
  league: 'uefa-tournament' as unknown as LeagueKey,
  division: 1,
  country: seed.country,
  tier: seed.tier,
  reputation: seed.reputation,
  transferBudget: 0,
  wageBudget: 0,
  currentWageSpend: 0,
  target: '欧州大会圏内',
  fanExpectation: '現実的（堅実な戦い）',
  stadiumName: seed.stadiumName,
  stadiumCapacity: seed.stadiumCapacity,
  primaryColor: seed.primaryColor,
  secondaryColor: seed.secondaryColor,
  currentFormation: '4-3-3',
  playerIds: [],
  isTournamentOnly: true,
  europeanFixedComp: seed.comp,
  tournamentRatings: seed.ratings
}));

export const UCL_2026_GROUP_B_IDS = GROUP_B_TOURNAMENT_CLUBS
  .filter(c => c.europeanFixedComp === 'ucl')
  .map(c => c.id);

export const UEL_2026_GROUP_B_IDS = GROUP_B_TOURNAMENT_CLUBS
  .filter(c => c.europeanFixedComp === 'uel')
  .map(c => c.id);

export const UECL_2026_GROUP_B_IDS = GROUP_B_TOURNAMENT_CLUBS
  .filter(c => c.europeanFixedComp === 'uecl')
  .map(c => c.id);

/**
 * Returns the exact 36 participant Club IDs for UCL, UEL, or UECL.
 * Combines Group A (dynamic domestic DB qualifiers in Season 2+, or official 2026/27 Season 1 Group A)
 * with Group B (51 fixed Tournament-Only UEFA clubs), guaranteeing 36 clubs per competition and 0 overlaps.
 */
export function resolveEuropeanParticipantIds(
  clubs: Record<string, Club>,
  europeanQualifications?: {
    uclClubIds?: string[];
    uelClubIds?: string[];
    ueclClubIds?: string[];
  }
): {
  uclClubIds: string[];
  uelClubIds: string[];
  ueclClubIds: string[];
} {
  const used = new Set<string>();
  const addUnique = (target: string[], id: string, maxLen: number) => {
    if (target.length >= maxLen) return;
    if (!id || used.has(id) || !clubs[id]) return;
    used.add(id);
    target.push(id);
  };

  const uclClubIds: string[] = [];
  const uelClubIds: string[] = [];
  const ueclClubIds: string[] = [];

  // 1. Add Group A (prefer Season 2+ qualified clubs if present, backfill with Season 1 official Group A, then top domestic clubs)
  const groupACandidatesUcl = europeanQualifications?.uclClubIds?.length
    ? [...europeanQualifications.uclClubIds, ...UCL_2026_GROUP_A_IDS]
    : [...UCL_2026_GROUP_A_IDS];
  const groupACandidatesUel = europeanQualifications?.uelClubIds?.length
    ? [...europeanQualifications.uelClubIds, ...UEL_2026_GROUP_A_IDS]
    : [...UEL_2026_GROUP_A_IDS];
  const groupACandidatesUecl = europeanQualifications?.ueclClubIds?.length
    ? [...europeanQualifications.ueclClubIds, ...UECL_2026_GROUP_A_IDS]
    : [...UECL_2026_GROUP_A_IDS];

  const domesticPool = Object.values(clubs)
    .filter(c =>
      c.id !== 'free_agent' &&
      !c.isTournamentOnly &&
      ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1', 'super-lig', 'primeira-liga', 'eredivisie', 'pro-league'].includes(c.league)
    )
    .sort((a, b) => (b.reputation || 50) - (a.reputation || 50));

  for (const id of groupACandidatesUcl) {
    if (!clubs[id]?.isTournamentOnly) {
      addUnique(uclClubIds, id, EUROPEAN_GROUP_A_SLOT_COUNTS.ucl);
    }
  }
  for (const c of domesticPool) {
    if (uclClubIds.length >= EUROPEAN_GROUP_A_SLOT_COUNTS.ucl) break;
    addUnique(uclClubIds, c.id, EUROPEAN_GROUP_A_SLOT_COUNTS.ucl);
  }

  for (const id of groupACandidatesUel) {
    if (!clubs[id]?.isTournamentOnly) {
      addUnique(uelClubIds, id, EUROPEAN_GROUP_A_SLOT_COUNTS.uel);
    }
  }
  for (const c of domesticPool) {
    if (uelClubIds.length >= EUROPEAN_GROUP_A_SLOT_COUNTS.uel) break;
    addUnique(uelClubIds, c.id, EUROPEAN_GROUP_A_SLOT_COUNTS.uel);
  }

  for (const id of groupACandidatesUecl) {
    if (!clubs[id]?.isTournamentOnly) {
      addUnique(ueclClubIds, id, EUROPEAN_GROUP_A_SLOT_COUNTS.uecl);
    }
  }
  for (const c of domesticPool) {
    if (ueclClubIds.length >= EUROPEAN_GROUP_A_SLOT_COUNTS.uecl) break;
    addUnique(ueclClubIds, c.id, EUROPEAN_GROUP_A_SLOT_COUNTS.uecl);
  }

  // 2. Append Group B Tournament-Only clubs into their exact UEFA competition (36 total per tournament)
  for (const id of UCL_2026_GROUP_B_IDS) {
    addUnique(uclClubIds, id, 36);
  }
  for (const id of UEL_2026_GROUP_B_IDS) {
    addUnique(uelClubIds, id, 36);
  }
  for (const id of UECL_2026_GROUP_B_IDS) {
    addUnique(ueclClubIds, id, 36);
  }

  return { uclClubIds, uelClubIds, ueclClubIds };
}
