import { Player, Position, Club, TeamTactics, PlayStyle } from '../types/game';
import { ALL_CLUBS, ALL_116_CLUBS, ENABLE_J_LEAGUE } from './clubsData';
import { CURATED_REAL_SQUADS } from './squadsCatalog';
import { ADDITIONAL_CLUB_SEEDS } from './allClubsSquads';
import { EUROPEAN_MAJOR_CLUBS_2026_SEEDS } from './europeanMajorClubsRosters';
import { makeRealPlayer } from './realPlayersDatabase';
import { checkPlayerDataIntegrity } from '../engine/dataValidator';
import { updateTacticsFormation } from '../engine/tacticsEngine';
import { generateFullJLeaguePlayers, J2_20_CLUBS } from './jLeagueData';
import { ALL_EUROPEAN_2ND_DIVISION_CLUBS } from './europeanSecondDivisionClubs';
import { MUST_CHECK_AND_OVERSEAS_SEEDS } from './europeanSecondDivisionPlayers';
import { FREE_AGENT_SUPERSTARS, FREE_AGENT_CLUB } from './freeAgentsData';

// Standard 25 squad positions template (3 GKs, 4 CBs, 2 LBs, 2 RBs, 2 CDMs, 2 CMs, 2 CAMs, 1 LM, 1 RM, 1 LW, 1 RW, 3 STs, 1 CF)
const SQUAD_POSITIONS_TEMPLATE: Position[] = [
  'GK', 'GK', 'GK',
  'CB', 'CB', 'CB', 'CB',
  'LB', 'LB', 'RB', 'RB',
  'CDM', 'CDM', 'CM', 'CM', 'CAM',
  'LM', 'RM', 'LW', 'RW',
  'ST', 'ST', 'CF', 'ST', 'CAM'
];

// Age brackets strictly matching User Specification:
// 16-19: 若手有望株, 20-23: 若手・成長期, 24-28: 全盛期, 29-32: ベテラン化開始, 33-36: 経験豊富なベテラン, 37+: 現役ベテラン
const SPEC_AGE_DISTRIBUTION = [
  17, 18, 19, // 若手有望株
  20, 21, 22, 23, // 若手・成長期
  24, 25, 26, 27, 28, // 全盛期
  29, 30, 31, 32, // ベテラン化開始
  33, 34, 35, 36, // 経験豊富なベテラン
  37, 38 // 現役ベテラン
];

// Authentic European First Names & Surnames for Non-Colliding Depth Squad Players
const DEPTH_NAMES_BY_COUNTRY: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  'イングランド': {
    firstNames: [
      'George', 'Liam', 'Harry', 'Jack', 'Callum', 'Oliver', 'Noah', 'Leo', 'Arthur', 'Oscar',
      'Freddie', 'Alfie', 'Finley', 'Archie', 'Charlie', 'Harvey', 'Mason', 'Ethan', 'Jacob', 'Logan',
      'Lucas', 'Harrison', 'Daniel', 'Theo', 'Isaac', 'Edward', 'James', 'Joshua', 'Henry', 'Max',
      'Samuel', 'William', 'Benjamin', 'Sebastian', 'Joseph', 'Alexander', 'Teddy', 'Elijah', 'Reuben', 'Jaxon'
    ],
    lastNames: [
      'Pemberton', 'Ellington', 'Holliday', 'Barkworth', 'Cranston', 'Blackwood', 'Whitmore', 'Fairclough', 'Thorold', 'Ainsworth',
      'Brabazon', 'Nethercott', 'Colquhoun', 'Stanhope', 'Harpur', 'Goxhill', 'Kettlewell', 'Bradshaw', 'Finchley', 'Ashbourne',
      'Baxendale', 'Chetwynd', 'Davenport', 'Ellerby', 'Grosvenor', 'Hawkesbury', 'Kenilworth', 'Langford', 'Montague', 'Norwood',
      'Oakhaven', 'Radcliffe', 'Stanbury', 'Thornbury', 'Wakefield', 'Yardley', 'Somerset', 'Ravenscroft', 'Kingswood', 'Beaumont'
    ]
  },
  'スペイン': {
    firstNames: [
      'Hugo', 'Mateo', 'Lucas', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Manuel', 'Álvaro', 'Adrián',
      'David', 'Mario', 'Diego', 'Marcos', 'Javier', 'Nicolás', 'Sergio', 'Carlos', 'Gonzalo', 'Iker',
      'Rubén', 'Iván', 'Raúl', 'Jorge', 'Héctor', 'Guillermo', 'Jaime', 'Víctor', 'Samuel', 'Ignacio',
      'Unai', 'Aitor', 'Mikel', 'Julen', 'Ander', 'Gorka', 'Asier', 'Borja', 'César', 'Pelayo'
    ],
    lastNames: [
      'Carballeira', 'Villacastín', 'Monasterio', 'Zubeldia', 'Basterretxea', 'Aranguren', 'Bustamante', 'Campomanes', 'Fontcuberta', 'Urrutikoetxea',
      'Garmendia', 'Madariaga', 'Santisteban', 'Barrenetxea', 'Villanueva', 'Peñaflor', 'Alcántara', 'Benavides', 'Cienfuegos', 'Delgado',
      'Echeverría', 'Fernández', 'Garrido', 'Hidalgo', 'Izaguirre', 'Jiménez', 'Larrañaga', 'Mendizábal', 'Navarrete', 'Ochandiano',
      'Piedrahíta', 'Quintanilla', 'Rebolledo', 'Samaniego', 'Torregrosa', 'Valdepeñas', 'Yravedra', 'Zamudio', 'Barriocanal', 'Corcuera'
    ]
  },
  'ドイツ': {
    firstNames: [
      'Lukas', 'Finn', 'Jonas', 'Paul', 'Niklas', 'Tim', 'Jan', 'Leon', 'Felix', 'Maximilian',
      'Julian', 'Moritz', 'Elias', 'Hannes', 'Tobias', 'Simon', 'Fabian', 'Florian', 'Alexander', 'Marcel',
      'David', 'Philipp', 'Daniel', 'Marvin', 'Sebastian', 'Robin', 'Christian', 'Kevin', 'Patrick', 'Dominik',
      'Lennard', 'Hendrik', 'Mats', 'Torben', 'Malte', 'Sven', 'Jannik', 'Bastian', 'Nico', 'Benedikt'
    ],
    lastNames: [
      'Holzbrinck', 'Breitenstein', 'Westermann', 'Lindemann', 'Kaufbeuren', 'Schneidewind', 'Rosenkranz', 'Bärenfänger', 'Tannhäuser', 'Winterfeld',
      'Diefenbach', 'Stauffenberg', 'Klingenberg', 'Sonnenschein', 'Eichelmann', 'Falkenstein', 'Greifenstein', 'Himmelfarb', 'Jaegerndorff', 'Kirchberger',
      'Lichtenstein', 'Meisenheimer', 'Nordenschild', 'Otterstetter', 'Pfefferkorn', 'Quartier', 'Reichenbacher', 'Schwarzenberg', 'Trautmann', 'Ullenspiegel',
      'Vogelgesang', 'Wachenrodt', 'Zeitschel', 'Bernburger', 'Dobermann', 'Eisenach', 'Friedrichshof', 'Gleichenberg', 'Hohenstaufen', 'Kappelmeyer'
    ]
  },
  'イタリア': {
    firstNames: [
      'Lorenzo', 'Mattia', 'Tommaso', 'Gabriele', 'Edoardo', 'Federico', 'Riccardo', 'Davide', 'Samuele', 'Simone',
      'Michele', 'Pietro', 'Filippo', 'Andrea', 'Marco', 'Matteo', 'Luca', 'Francesco', 'Alessandro', 'Giovanni',
      'Alessio', 'Nicolò', 'Christian', 'Daniele', 'Jacopo', 'Manuel', 'Diego', 'Giacomo', 'Alberto', 'Elia',
      'Valerio', 'Fabio', 'Massimo', 'Stefano', 'Paolo', 'Giorgio', 'Claudio', 'Gianluca', 'Vincenzo', 'Salvatore'
    ],
    lastNames: [
      'Tagliaferri', 'Castelvecchio', 'Montesquieu', 'Barcellona', 'Campanella', 'Bentivoglio', 'Pietralunga', 'Valvassori', 'Bongiovanni', 'Scaramuccia',
      'Passalacqua', 'Mazzagatti', 'Quattrocchi', 'Abbondanzieri', 'Belcastro', 'Colluccini', 'Deangelis', 'Falcettelli', 'Gagliardelli', 'Innocentini',
      'Lombardozzi', 'Marcovaldi', 'Notaristefano', 'Ottaviani', 'Palombella', 'Quiriconi', 'Riccitelli', 'Sperandio', 'Tarantola', 'Uccellatori',
      'Venturini', 'Zaccagnini', 'Boncompagni', 'Casagrande', 'Dellarovere', 'Fattoruso', 'Guerrieri', 'Lanfranchi', 'Mastrorilli', 'Petrocchi'
    ]
  },
  'フランス': {
    firstNames: [
      'Gabriel', 'Raphaël', 'Jules', 'Arthur', 'Louis', 'Maël', 'Lucas', 'Adam', 'Hugo', 'Sacha',
      'Gaspard', 'Mathis', 'Nathan', 'Clément', 'Théo', 'Maxime', 'Alexandre', 'Antoine', 'Paul', 'Thomas',
      'Romain', 'Nicolas', 'Julien', 'Quentin', 'Valentin', 'Adrien', 'Guillaume', 'Florian', 'Bastien', 'Benjamin',
      'Dorian', 'Corentin', 'Dylan', 'Gaëtan', 'Loïc', 'Mathieu', 'Rémi', 'Tristan', 'Victor', 'Yanis'
    ],
    lastNames: [
      'Chanteloube', 'Villedieu', 'Rochechouart', 'Montauban', 'Beauchamp', 'Fontenelle', 'Castelbajac', 'Dambreuse', 'Chateaubriand', 'Lescure',
      'Grandchamp', 'Puydebat', 'Hautefort', 'Bellerive', 'Argenteuil', 'Boisrond', 'Courtemanche', 'Delaunay', 'Estrébelle', 'Fauconberg',
      'Gaucheron', 'Hardivillier', 'Isambert', 'Jolicoeur', 'Keroualle', 'Larmagnac', 'Montmorillon', 'Neuville', 'Orbec', 'Portefaix',
      'Quimperlé', 'Rochedieu', 'Sainte-Beuve', 'Tremblay', 'Ussé', 'Valmousquet', 'Wicquefort', 'Aubervilliers', 'Bréval', 'Corbineau'
    ]
  },
  '日本': {
    firstNames: [
      '翔太', '大輝', '拓海', '悠人', '陸', '駿', '颯太', '蓮', '優斗', '陽斗',
      '大樹', '和樹', '健太', '裕樹', '直人', '航平', '亮', '慎平', '翼', '海斗',
      '陽向', '蒼', '樹', '朝陽', '圭佑', '諒', '大輔', '勇人', '拓哉', '健人',
      '康平', '達也', '将太', '雄大', '剛', '大雅', '巧', '翔', '陸斗', '遥斗'
    ],
    lastNames: [
      '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
      '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
      '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川',
      '前田', '岡田', '長谷川', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本'
    ]
  }
};

export function buildCompletePlayersRegistry(): Record<string, Player> {
  const registry: Record<string, Player> = {};
  const registeredPlayerIds = new Set<string>();
  const registeredNormalizedNames = new Set<string>();

  // Helper to add player with strict uniqueness guarantee
  const addPlayerIfUnique = (p: Player): boolean => {
    if (!p || !p.id || !p.name) return false;

    // Strict Diogo Jota filter
    if (p.name.toLowerCase().includes('diogo jota') || p.id.includes('jota')) {
      return false;
    }

    let finalName = p.name;
    const norm = finalName.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '') || finalName.trim().toLowerCase();
    if (norm && registeredNormalizedNames.has(norm)) {
      if (p.id.startsWith('p_')) {
        finalName = `${p.name} Jr.`;
      } else {
        return false;
      }
    }

    let finalId = p.id;
    if (registeredPlayerIds.has(finalId)) {
      finalId = `${p.id}_${Math.floor(Math.random() * 10000)}`;
    }

    const cleanPlayer: Player = {
      ...p,
      id: finalId,
      name: finalName,
      currentClubId: p.clubId,
      squadStatus: p.squadStatus || 'OUT_OF_SQUAD',
      injuryStatus: p.injuryStatus || (p.injury?.isInjured ? 'INJURED' : 'FIT'),
      injury: p.injury || { isInjured: false },
      suspension: p.suspension || { isSuspended: false, matchesRemaining: 0 }
    };

    registry[finalId] = cleanPlayer;
    registeredPlayerIds.add(finalId);
    if (norm) {
      registeredNormalizedNames.add(norm);
    }
    return true;
  };

  // 1. Register Curated authentic squads first (highest priority)
  Object.values(CURATED_REAL_SQUADS).forEach(squad => {
    squad.forEach(p => {
      addPlayerIfUnique(p);
    });
  });

  // 2. Register additional authentic club seeds
  Object.entries(ADDITIONAL_CLUB_SEEDS).forEach(([clubId, seeds]) => {
    seeds.forEach((seed, idx) => {
      const pId = seed.name === '鈴木 彩艶' 
        ? 'parma_zion_suzuki' 
        : `${clubId}_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
      const tierMultiplier = seed.ovr >= 85 ? 65000000 : seed.ovr >= 80 ? 30000000 : seed.ovr >= 75 ? 12000000 : 2500000;
      const wageMultiplier = seed.ovr >= 85 ? 200000 : seed.ovr >= 80 ? 100000 : seed.ovr >= 75 ? 40000 : 12000;

      const player = makeRealPlayer(
        pId,
        seed.name,
        clubId,
        seed.position,
        seed.age,
        seed.nationality,
        seed.ovr,
        seed.ovr + (seed.age <= 22 ? 6 : seed.age <= 26 ? 3 : 0),
        tierMultiplier,
        wageMultiplier,
        seed.shirtNumber,
        seed.preferredFoot || '右',
        seed.playstyle || (seed.position === 'GK' ? 'ショットストッパー' : 'チャンスメイカー')
      );

      // Requirement 4: Zion Suzuki exceptional GK passing, kicking precision & build-up from back
      if (seed.name === '鈴木 彩艶') {
        player.name = '鈴木 彩艶 (Zion Suzuki)';
        player.passing = 76; // Footwork, build-up, short/long pass ability significantly high for a GK
        player.gk = 79;
        player.physical = 83;
        player.pace = 68;
        player.potential = 86;
        player.exactOvr = 78.0;
        player.playstyle = 'ビルドアップ型GK';
      }

      addPlayerIfUnique(player);
    });
  });

  // 2a-2. Register additional authentic European 1st-division major club seeds (Fulham, Wolves, Brentford, Forest, Leicester, Ipswich, Southampton, Betis, Villarreal, Valencia, Sevilla, Girona, Stuttgart, Frankfurt, Atalanta, Roma, Lazio, Fiorentina, Bologna, Lille, Nice, Lens, Rennes, etc.)
  Object.entries(EUROPEAN_MAJOR_CLUBS_2026_SEEDS).forEach(([clubId, seeds]) => {
    seeds.forEach((seed, idx) => {
      const pId = `${clubId}_eur26_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
      const tierMultiplier = seed.ovr >= 85 ? 65000000 : seed.ovr >= 80 ? 30000000 : seed.ovr >= 75 ? 12000000 : 2500000;
      const wageMultiplier = seed.ovr >= 85 ? 200000 : seed.ovr >= 80 ? 100000 : seed.ovr >= 75 ? 40000 : 12000;

      const player = makeRealPlayer(
        pId,
        seed.name,
        clubId,
        seed.position,
        seed.age,
        seed.nationality,
        seed.ovr,
        seed.ovr + (seed.age <= 22 ? 6 : seed.age <= 26 ? 3 : 0),
        tierMultiplier,
        wageMultiplier,
        seed.shirtNumber,
        seed.preferredFoot || '右',
        seed.playstyle || (seed.position === 'GK' ? 'ショットストッパー' : 'チャンスメイカー')
      );

      addPlayerIfUnique(player);
    });
  });

  // 2b. Register must-check stars and European 2nd division authentic seeds
  Object.entries(MUST_CHECK_AND_OVERSEAS_SEEDS).forEach(([clubId, seeds]) => {
    seeds.forEach((seed, idx) => {
      const pId = seed.name.includes('佐野')
        ? 'mainz_kaishu_sano'
        : seed.name.includes('鈴木 彩艶')
        ? 'parma_zion_suzuki'
        : seed.name.includes('Doué')
        ? 'psg_desire_doue'
        : seed.name.includes('Gyökeres')
        ? 'arsenal_viktor_gyokeres'
        : seed.name.includes('Semenyo')
        ? 'bournemouth_antoine_semenyo'
        : seed.name.includes('Pedro')
        ? 'brighton_joao_pedro'
        : seed.name.includes('Cherki')
        ? 'lyon_rayan_cherki'
        : seed.name.includes('三笘')
        ? 'brighton_kaoru_mitoma'
        : seed.name.includes('久保')
        ? 'sociedad_takefusa_kubo'
        : seed.name.includes('遠藤')
        ? 'liverpool_wataru_endo'
        : seed.name.includes('冨安')
        ? 'arsenal_takehiro_tomiyasu'
        : seed.name.includes('南野')
        ? 'monaco_takumi_minamino'
        : seed.name.includes('堂安')
        ? 'freiburg_ritsu_doan'
        : seed.name.includes('伊東')
        ? 'reims_junya_ito'
        : seed.name.includes('中村')
        ? 'reims_keito_nakamura'
        : seed.name.includes('菅原')
        ? 'southampton_yukinari_sugawara'
        : seed.name.includes('板倉')
        ? 'gladbach_ko_itakura'
        : seed.name.includes('鎌田')
        ? 'crystal_palace_daichi_kamada'
        : seed.name.includes('田中 碧')
        ? 'leeds_ao_tanaka'
        : `${clubId}_seed_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;

      const tierMultiplier = seed.ovr >= 85 ? 65000000 : seed.ovr >= 80 ? 30000000 : seed.ovr >= 75 ? 12000000 : 3500000;
      const wageMultiplier = seed.ovr >= 85 ? 200000 : seed.ovr >= 80 ? 100000 : seed.ovr >= 75 ? 40000 : 15000;

      const player = makeRealPlayer(
        pId,
        seed.name,
        clubId,
        seed.position,
        seed.age,
        seed.nationality,
        seed.ovr,
        seed.ovr + (seed.age <= 22 ? 6 : seed.age <= 26 ? 3 : 0),
        tierMultiplier,
        wageMultiplier,
        seed.shirtNumber,
        seed.preferredFoot || '右',
        seed.playstyle || (seed.position === 'GK' ? 'ショットストッパー' : 'チャンスメイカー')
      );

      // Specific fine-tuning for Zion Suzuki
      if (seed.name.includes('鈴木 彩艶')) {
        player.name = '鈴木 彩艶 (Zion Suzuki)';
        player.passing = 76;
        player.gk = 79;
        player.physical = 83;
        player.pace = 68;
        player.potential = 86;
        player.exactOvr = 78.0;
        player.playstyle = 'ビルドアップ型GK';
      }

      addPlayerIfUnique(player);
    });
  });

  // 2c. Register authentic European backup goalkeepers to ensure top European clubs have at least 2-3 real GKs
  const REAL_EUROPEAN_BACKUP_GKS: {
    clubId: string;
    name: string;
    age: number;
    nationality: string;
    ovr: number;
    playstyle: PlayStyle;
  }[] = [
    // Premier League
    { clubId: 'arsenal', name: 'Neto', age: 35, nationality: 'ブラジル', ovr: 78, playstyle: 'ショットストッパー' },
    { clubId: 'arsenal', name: 'Tommy Setford', age: 18, nationality: 'イングランド', ovr: 66, playstyle: 'ビルドアップ型GK' },
    { clubId: 'man_city', name: 'Stefan Ortega', age: 31, nationality: 'ドイツ', ovr: 79, playstyle: 'ビルドアップ型GK' },
    { clubId: 'man_city', name: 'Scott Carson', age: 38, nationality: 'イングランド', ovr: 65, playstyle: 'ショットストッパー' },
    { clubId: 'liverpool', name: 'Caoimhín Kelleher', age: 25, nationality: 'アイルランド', ovr: 79, playstyle: 'ビルドアップ型GK' },
    { clubId: 'liverpool', name: 'Vítězslav Jaroš', age: 23, nationality: 'チェコ', ovr: 70, playstyle: 'ショットストッパー' },
    { clubId: 'aston_villa', name: 'Robin Olsen', age: 34, nationality: 'スウェーデン', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'aston_villa', name: 'Joe Gauci', age: 24, nationality: 'オーストラリア', ovr: 69, playstyle: 'ビルドアップ型GK' },
    { clubId: 'tottenham', name: 'Fraser Forster', age: 36, nationality: 'イングランド', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'tottenham', name: 'Brandon Austin', age: 25, nationality: 'イングランド', ovr: 66, playstyle: 'ビルドアップ型GK' },
    { clubId: 'chelsea', name: 'Filip Jørgensen', age: 22, nationality: 'デンマーク', ovr: 75, playstyle: 'ビルドアップ型GK' },
    { clubId: 'chelsea', name: 'Marcus Bettinelli', age: 32, nationality: 'イングランド', ovr: 69, playstyle: 'ショットストッパー' },
    { clubId: 'newcastle', name: 'Martin Dúbravka', age: 35, nationality: 'スロバキア', ovr: 78, playstyle: 'ショットストッパー' },
    { clubId: 'newcastle', name: 'Odysseas Vlachodimos', age: 30, nationality: 'ギリシャ', ovr: 76, playstyle: 'ショットストッパー' },
    { clubId: 'man_united', name: 'Altay Bayındır', age: 26, nationality: 'トルコ', ovr: 76, playstyle: 'ショットストッパー' },
    { clubId: 'man_united', name: 'Tom Heaton', age: 38, nationality: 'イングランド', ovr: 70, playstyle: 'ショットストッパー' },
    { clubId: 'west_ham', name: 'Łukasz Fabiański', age: 39, nationality: 'ポーランド', ovr: 76, playstyle: 'ショットストッパー' },
    { clubId: 'west_ham', name: 'Wes Foderingham', age: 33, nationality: 'イングランド', ovr: 71, playstyle: 'ショットストッパー' },
    { clubId: 'brighton', name: 'Jason Steele', age: 33, nationality: 'イングランド', ovr: 74, playstyle: 'ビルドアップ型GK' },
    { clubId: 'brighton', name: 'Carl Rushworth', age: 23, nationality: 'イングランド', ovr: 70, playstyle: 'ビルドアップ型GK' },
    { clubId: 'bournemouth', name: 'Mark Travers', age: 25, nationality: 'アイルランド', ovr: 73, playstyle: 'ショットストッパー' },
    { clubId: 'everton', name: 'João Virgínia', age: 24, nationality: 'ポルトガル', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'fulham', name: 'Steven Benda', age: 25, nationality: 'ドイツ', ovr: 71, playstyle: 'ショットストッパー' },
    { clubId: 'brentford', name: 'Hákon Valdimarsson', age: 22, nationality: 'アイスランド', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'crystal_palace', name: 'Matt Turner', age: 30, nationality: 'アメリカ', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'wolves', name: 'Dan Bentley', age: 31, nationality: 'イングランド', ovr: 73, playstyle: 'ショットストッパー' },
    { clubId: 'leicester', name: 'Danny Ward', age: 31, nationality: 'ウェールズ', ovr: 73, playstyle: 'ショットストッパー' },
    { clubId: 'nottingham_forest', name: 'Carlos Miguel', age: 25, nationality: 'ブラジル', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'southampton', name: 'Alex McCarthy', age: 34, nationality: 'イングランド', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'ipswich', name: 'Christian Walton', age: 28, nationality: 'イングランド', ovr: 71, playstyle: 'ショットストッパー' },
    // La Liga
    { clubId: 'real_madrid', name: 'Andriy Lunin', age: 25, nationality: 'ウクライナ', ovr: 82, playstyle: 'ビルドアップ型GK' },
    { clubId: 'real_madrid', name: 'Fran González', age: 19, nationality: 'スペイン', ovr: 67, playstyle: 'ショットストッパー' },
    { clubId: 'barcelona', name: 'Wojciech Szczęsny', age: 34, nationality: 'ポーランド', ovr: 80, playstyle: 'ショットストッパー' },
    { clubId: 'barcelona', name: 'Iñaki Peña', age: 25, nationality: 'スペイン', ovr: 76, playstyle: 'ビルドアップ型GK' },
    { clubId: 'atletico_madrid', name: 'Juan Musso', age: 30, nationality: 'アルゼンチン', ovr: 79, playstyle: 'ショットストッパー' },
    { clubId: 'athletic_club', name: 'Julen Agirrezabala', age: 23, nationality: 'スペイン', ovr: 77, playstyle: 'ビルドアップ型GK' },
    { clubId: 'real_sociedad', name: 'Unai Marrero', age: 22, nationality: 'スペイン', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'betis', name: 'Adrián', age: 37, nationality: 'スペイン', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'villarreal', name: 'Luiz Júnior', age: 23, nationality: 'ブラジル', ovr: 76, playstyle: 'ショットストッパー' },
    { clubId: 'valencia', name: 'Giorgi Mamardashvili', age: 24, nationality: 'ジョージア', ovr: 84, playstyle: 'ショットストッパー' },
    { clubId: 'valencia', name: 'Stole Dimitrievski', age: 30, nationality: '北マケドニア', ovr: 78, playstyle: 'ショットストッパー' },
    { clubId: 'sevilla', name: 'Álvaro Fernández', age: 26, nationality: 'スペイン', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'girona', name: 'Pau López', age: 29, nationality: 'スペイン', ovr: 77, playstyle: 'ショットストッパー' },
    // Bundesliga
    { clubId: 'bayern', name: 'Sven Ulreich', age: 35, nationality: 'ドイツ', ovr: 74, playstyle: 'ショットストッパー' },
    { clubId: 'bayern', name: 'Daniel Peretz', age: 24, nationality: 'イスラエル', ovr: 71, playstyle: 'ビルドアップ型GK' },
    { clubId: 'leverkusen', name: 'Matěj Kovář', age: 24, nationality: 'チェコ', ovr: 76, playstyle: 'ビルドアップ型GK' },
    { clubId: 'leverkusen', name: 'Niklas Lomb', age: 30, nationality: 'ドイツ', ovr: 68, playstyle: 'ショットストッパー' },
    { clubId: 'dortmund', name: 'Alexander Meyer', age: 33, nationality: 'ドイツ', ovr: 75, playstyle: 'ショットストッパー' },
    { clubId: 'dortmund', name: 'Marcel Lotka', age: 23, nationality: 'ポーランド', ovr: 68, playstyle: 'ビルドアップ型GK' },
    { clubId: 'rb_leipzig', name: 'Maarten Vandevoordt', age: 22, nationality: 'ベルギー', ovr: 76, playstyle: 'ビルドアップ型GK' },
    { clubId: 'frankfurt', name: 'Kaua Santos', age: 21, nationality: 'ブラジル', ovr: 73, playstyle: 'ショットストッパー' },
    { clubId: 'stuttgart', name: 'Fabian Bredlow', age: 29, nationality: 'ドイツ', ovr: 72, playstyle: 'ショットストッパー' },
    // Serie A
    { clubId: 'inter', name: 'Josep Martínez', age: 26, nationality: 'スペイン', ovr: 78, playstyle: 'ビルドアップ型GK' },
    { clubId: 'inter', name: 'Raffaele Di Gennaro', age: 30, nationality: 'イタリア', ovr: 68, playstyle: 'ショットストッパー' },
    { clubId: 'milan', name: 'Marco Sportiello', age: 32, nationality: 'イタリア', ovr: 75, playstyle: 'ショットストッパー' },
    { clubId: 'milan', name: 'Lorenzo Torriani', age: 19, nationality: 'イタリア', ovr: 67, playstyle: 'ショットストッパー' },
    { clubId: 'juventus', name: 'Mattia Perin', age: 31, nationality: 'イタリア', ovr: 79, playstyle: 'ショットストッパー' },
    { clubId: 'juventus', name: 'Carlo Pinsoglio', age: 34, nationality: 'イタリア', ovr: 71, playstyle: 'ショットストッパー' },
    { clubId: 'napoli', name: 'Elia Caprile', age: 23, nationality: 'イタリア', ovr: 75, playstyle: 'ショットストッパー' },
    { clubId: 'napoli', name: 'Nikita Contini', age: 28, nationality: 'イタリア', ovr: 68, playstyle: 'ショットストッパー' },
    { clubId: 'atalanta', name: 'Rui Patrício', age: 36, nationality: 'ポルトガル', ovr: 76, playstyle: 'ショットストッパー' },
    { clubId: 'roma', name: 'Mathew Ryan', age: 32, nationality: 'オーストラリア', ovr: 75, playstyle: 'ショットストッパー' },
    { clubId: 'lazio', name: 'Christos Mandas', age: 22, nationality: 'ギリシャ', ovr: 75, playstyle: 'ショットストッパー' },
    // Ligue 1
    { clubId: 'psg', name: 'Matvey Safonov', age: 25, nationality: 'ロシア', ovr: 79, playstyle: 'ショットストッパー' },
    { clubId: 'psg', name: 'Arnau Tenas', age: 23, nationality: 'スペイン', ovr: 74, playstyle: 'ビルドアップ型GK' },
    { clubId: 'monaco', name: 'Philipp Köhn', age: 26, nationality: 'スイス', ovr: 75, playstyle: 'ショットストッパー' },
    { clubId: 'marseille', name: 'Jeffrey de Lange', age: 26, nationality: 'オランダ', ovr: 73, playstyle: 'ショットストッパー' },
    { clubId: 'lyon', name: 'Rémy Descamps', age: 28, nationality: 'フランス', ovr: 72, playstyle: 'ショットストッパー' },
    { clubId: 'lille', name: 'Vito Mannone', age: 36, nationality: 'イタリア', ovr: 71, playstyle: 'ショットストッパー' }
  ];

  REAL_EUROPEAN_BACKUP_GKS.forEach((g, idx) => {
    const pId = `${g.clubId}_gk_backup_${idx + 1}_${g.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
    const tierMultiplier = g.ovr >= 80 ? 25000000 : g.ovr >= 75 ? 10000000 : 3500000;
    const wageMultiplier = g.ovr >= 80 ? 90000 : g.ovr >= 75 ? 35000 : 15000;
    const player = makeRealPlayer(
      pId,
      g.name,
      g.clubId,
      'GK',
      g.age,
      g.nationality,
      g.ovr,
      Math.max(g.ovr, g.age <= 22 ? g.ovr + 5 : g.ovr + 1),
      tierMultiplier,
      wageMultiplier,
      idx % 2 === 0 ? 12 : 13,
      '右',
      g.playstyle
    );
    addPlayerIfUnique(player);
  });

  // 3. First load all authentic J-League players (J1 and J2 authentic rosters)
  let baseRegistry = registry;
  if (ENABLE_J_LEAGUE) {
    baseRegistry = generateFullJLeaguePlayers(baseRegistry);
  }

  // 3b. Register Free Agent Superstars (Messi, Ronaldo, Neymar, James Rodriguez, Carvajal, Sergio Ramos)
  FREE_AGENT_SUPERSTARS.forEach(fa => {
    addPlayerIfUnique(fa);
  });

  // 4. Ensure all clubs (all 96 European clubs + all 20 J1 clubs + all 20 J2 clubs + 102 European 2nd division clubs) have at least 25 players across positions
  // AND CRITICAL REQUIREMENT: 全チーム最低2人以上（スタメン・ベンチ・ベンチ外用の3人体制推奨）のGKを必ず確保
  const allClubsToEnsure: Club[] = [
    ...ALL_CLUBS,
    ...(ENABLE_J_LEAGUE ? J2_20_CLUBS : []),
    ...ALL_EUROPEAN_2ND_DIVISION_CLUBS
  ];

  // Deduplicate clubs by id
  const uniqueClubsMap = new Map<string, Club>();
  allClubsToEnsure.forEach(c => uniqueClubsMap.set(c.id, c));
  const uniqueClubs = Array.from(uniqueClubsMap.values());

  // Track globally used player names to guarantee 100% collision-free uniqueness
  const usedGlobalNames = new Set<string>();
  Object.values(baseRegistry).forEach(p => {
    const norm = p.name.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '') || p.name.trim().toLowerCase();
    if (norm) usedGlobalNames.add(norm);
  });

  const MIDDLE_INITIALS = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'J.', 'K.', 'L.', 'M.', 'N.', 'P.', 'R.', 'S.', 'T.', 'V.', 'W.'];

  uniqueClubs.forEach((club, clubIdx) => {
    let existing = Object.values(baseRegistry).filter(p => p.clubId === club.id);
    const isJapan = club.country === '日本';
    const depthData = DEPTH_NAMES_BY_COUNTRY[club.country] || DEPTH_NAMES_BY_COUNTRY['イングランド'];
    const tierBaseOvr = isJapan
      ? (club.league === 'j1-league' ? 73 : 69)
      : (club.tier === 'Elite' ? 80 : club.tier === 'Upper' ? 76 : club.tier === 'Mid' ? 72 : 68);

    // =========================================================================
    // STEP A: Ensure every club has AT LEAST 2 to 3 GKs (スタメン・ベンチ・ベンチ外)
    // =========================================================================
    const existingGks = existing.filter(p => p.position === 'GK');
    const neededGks = Math.max(0, 3 - existingGks.length); // Strict minimum 3 GKs for Starter, Bench, Reserve

    for (let gIdx = 0; gIdx < neededGks; gIdx++) {
      const gkOrder = existingGks.length + gIdx + 1; // 1st, 2nd, or 3rd GK
      const pId = `p_${club.id}_gk_${gkOrder}_${Date.now()}_${gIdx}`;
      
      // Determine realistic age and OVR for backup/reserve GK
      let age = gkOrder === 2 ? (23 + ((clubIdx + gIdx) % 8)) : (19 + ((clubIdx + gIdx) % 4));
      let ovr = gkOrder === 1
        ? Math.max(68, tierBaseOvr)
        : gkOrder === 2
          ? Math.max(65, tierBaseOvr - 3 - (gIdx % 2)) // Bench GK: good backup
          : Math.max(60, tierBaseOvr - 8 - (gIdx % 3)); // 3rd GK: young prospect or veteran
      
      const potential = age <= 22 ? Math.min(90, ovr + 7) : ovr;

      // Unique name generation
      let uniqueFullName = '';
      for (let attempt = 0; attempt < 50; attempt++) {
        const fIdx = (clubIdx * 7 + gIdx * 11 + attempt * 3) % depthData.firstNames.length;
        const lIdx = (clubIdx * 13 + gIdx * 17 + attempt * 5) % depthData.lastNames.length;
        const fName = depthData.firstNames[fIdx];
        const lName = depthData.lastNames[lIdx];
        const mid = MIDDLE_INITIALS[(clubIdx + gIdx + attempt) % MIDDLE_INITIALS.length];
        const candidate = isJapan 
          ? (attempt === 0 ? `${lName} ${fName}` : `${lName} ${fName}${attempt > 1 ? attempt : ''}`)
          : (attempt === 0 ? `${fName} ${lName}` : `${fName} ${mid} ${lName}`);
        const norm = candidate.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '');
        if (!usedGlobalNames.has(norm)) {
          uniqueFullName = candidate;
          usedGlobalNames.add(norm);
          break;
        }
      }
      if (!uniqueFullName) {
        uniqueFullName = isJapan ? `GK 守備${club.shortName || clubIdx}${gkOrder}` : `${club.shortName || 'Club'} Keeper ${gkOrder}`;
      }

      const gkPlayer = makeRealPlayer(
        pId,
        uniqueFullName,
        club.id,
        'GK',
        age,
        club.country,
        ovr,
        potential,
        isJapan
          ? (club.league === 'j1-league' ? 700000 : 400000)
          : (club.tier === 'Elite' ? 12000000 : club.tier === 'Upper' ? 6000000 : 2000000),
        isJapan
          ? (club.league === 'j1-league' ? 12000 : 8000)
          : (club.tier === 'Elite' ? 45000 : club.tier === 'Upper' ? 24000 : 10000),
        gkOrder === 1 ? 1 : gkOrder === 2 ? 12 : 23,
        '右',
        gkOrder === 2 ? 'ショットストッパー' : '守備的GK'
      );

      // Fine-tune GK stats
      gkPlayer.gk = ovr;
      gkPlayer.defending = Math.max(30, Math.floor(ovr * 0.45));
      gkPlayer.physical = Math.max(50, ovr - 6);
      gkPlayer.passing = Math.max(50, ovr - 10);
      gkPlayer.pace = Math.max(45, ovr - 15);

      baseRegistry[gkPlayer.id] = gkPlayer;
    }

    // Refresh existing players list for this club after adding GKs
    existing = Object.values(baseRegistry).filter(p => p.clubId === club.id);
    const neededOutfield = Math.max(0, 25 - existing.length);

    // =========================================================================
    // STEP B: Ensure outfield depth so total squad size is at least 25
    // =========================================================================
    const OUTFIELD_TEMPLATE: Position[] = [
      'CB', 'CB', 'CB', 'CB',
      'LB', 'LB', 'RB', 'RB',
      'CDM', 'CDM', 'CM', 'CM', 'CAM',
      'LM', 'RM', 'LW', 'RW',
      'ST', 'ST', 'CF', 'ST', 'CAM'
    ];

    for (let i = 0; i < neededOutfield; i++) {
      const pos = OUTFIELD_TEMPLATE[i % OUTFIELD_TEMPLATE.length];
      const pId = `p_${club.id}_depth_${existing.length + i + 1}`;

      // Distribute age across the 6 specified brackets
      const age = SPEC_AGE_DISTRIBUTION[(clubIdx * 4 + i) % SPEC_AGE_DISTRIBUTION.length];
      
      let ovrModifier = (i % 3) - 1;
      if (age <= 19) ovrModifier -= 4;
      else if (age <= 22) ovrModifier -= 1;
      else if (age >= 34) ovrModifier -= 1;

      const ovr = Math.max(62, Math.min(84, tierBaseOvr + ovrModifier));
      const potential = age <= 19 
        ? Math.min(94, ovr + 8 + (i % 6))
        : age <= 23 
          ? Math.min(91, ovr + 4 + (i % 4))
          : age <= 28 
            ? Math.max(ovr, ovr + (i % 2))
            : ovr;

      // Unique name generation
      let uniqueFullName = '';
      for (let attempt = 0; attempt < 50; attempt++) {
        const fIdx = (clubIdx * 5 + i * 2 + attempt * 3) % depthData.firstNames.length;
        const lIdx = (clubIdx * 7 + i * 3 + attempt * 5) % depthData.lastNames.length;
        const fName = depthData.firstNames[fIdx];
        const lName = depthData.lastNames[lIdx];
        const mid = MIDDLE_INITIALS[(clubIdx * 2 + i + attempt) % MIDDLE_INITIALS.length];
        const candidate = isJapan 
          ? (attempt === 0 ? `${lName} ${fName}` : `${lName} ${fName}${attempt > 1 ? attempt : ''}`)
          : (attempt === 0 ? `${fName} ${lName}` : `${fName} ${mid} ${lName}`);
        const norm = candidate.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '');
        if (!usedGlobalNames.has(norm)) {
          uniqueFullName = candidate;
          usedGlobalNames.add(norm);
          break;
        }
      }
      if (!uniqueFullName) {
        uniqueFullName = isJapan ? `${club.shortName || '選手'}${i + 1}` : `${club.shortName || 'Player'} ${i + 1}`;
      }

      const player = makeRealPlayer(
        pId,
        uniqueFullName,
        club.id,
        pos,
        age,
        club.country,
        ovr,
        potential,
        isJapan
          ? (club.league === 'j1-league' ? 800000 : 450000)
          : (club.tier === 'Elite' ? 16000000 : club.tier === 'Upper' ? 8000000 : 2500000),
        isJapan
          ? (club.league === 'j1-league' ? 14000 : 9000)
          : (club.tier === 'Elite' ? 55000 : club.tier === 'Upper' ? 30000 : 12000),
        26 + ((i * 3) % 65),
        i % 3 === 0 ? '左' : '右',
        pos === 'CB' ? 'ボール運べるCB' : 'チャンスメイカー'
      );

      if (!baseRegistry[player.id]) {
        baseRegistry[player.id] = player;
      }
    }
  });

  return baseRegistry;
}

export function populateClubsWithDefaultSquads(
  clubs: Record<string, Club>, 
  playersRegistry: Record<string, Player>
): { clubs: Record<string, Club>; players: Record<string, Player> } {
  // First run automated data integrity check
  const { players: cleanPlayers, clubs: cleanClubs } = checkPlayerDataIntegrity(playersRegistry, clubs);

  // Sync club.playerIds strictly from cleanPlayers
  Object.values(cleanClubs).forEach(club => {
    club.playerIds = [];
  });

  Object.values(cleanPlayers).forEach(p => {
    if (cleanClubs[p.clubId]) {
      if (!cleanClubs[p.clubId].playerIds.includes(p.id)) {
        cleanClubs[p.clubId].playerIds.push(p.id);
      }
    }
  });

  // CRITICAL REQUIREMENT: Ensure every club across all 12 leagues strictly has at least 25 players and at least 2 GKs
  Object.values(cleanClubs).forEach((club, clubIdx) => {
    if (club.id === 'free_agent') return;
    let clubPlayers = club.playerIds.map(id => cleanPlayers[id]).filter(Boolean);
    const existingGks = clubPlayers.filter(p => p.position === 'GK');
    const neededGks = Math.max(0, 2 - existingGks.length);
    const isJapan = club.country === '日本';
    const depthData = DEPTH_NAMES_BY_COUNTRY[club.country] || DEPTH_NAMES_BY_COUNTRY['イングランド'];
    const tierBaseOvr = isJapan
      ? (club.league === 'j1-league' ? 73 : 69)
      : (club.tier === 'Elite' ? 80 : club.tier === 'Upper' ? 76 : club.tier === 'Mid' ? 72 : 68);

    for (let g = 0; g < neededGks; g++) {
      const gkOrder = existingGks.length + g + 1;
      const pId = `p_${club.id}_gk_supp_${club.playerIds.length + 1}`;
      const fIdx = (clubIdx * 7 + g * 3) % depthData.firstNames.length;
      const lIdx = (clubIdx * 11 + g * 5) % depthData.lastNames.length;
      const name = isJapan ? `${depthData.lastNames[lIdx]} ${depthData.firstNames[fIdx]}` : `${depthData.firstNames[fIdx]} ${depthData.lastNames[lIdx]}`;
      const gkPlayer = makeRealPlayer(
        pId,
        name,
        club.id,
        'GK',
        20 + (g % 4),
        club.country,
        tierBaseOvr - 2,
        tierBaseOvr + 4,
        isJapan ? 600000 : 3000000,
        isJapan ? 10000 : 15000,
        gkOrder === 1 ? 1 : gkOrder === 2 ? 12 : 23,
        '右',
        'ショットストッパー'
      );
      gkPlayer.gk = tierBaseOvr - 2;
      gkPlayer.defending = Math.floor(gkPlayer.gk * 0.45);
      cleanPlayers[pId] = gkPlayer;
      club.playerIds.push(pId);
    }

    // Refresh clubPlayers and fill outfield if < 25
    clubPlayers = club.playerIds.map(id => cleanPlayers[id]).filter(Boolean);
    const neededOutfield = Math.max(0, 25 - clubPlayers.length);
    const OUTFIELD_POS: Position[] = ['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
    for (let i = 0; i < neededOutfield; i++) {
      const pId = `p_${club.id}_supp_${club.playerIds.length + 1}`;
      const pos = OUTFIELD_POS[i % OUTFIELD_POS.length];
      const fIdx = (clubIdx * 9 + i * 4) % depthData.firstNames.length;
      const lIdx = (clubIdx * 13 + i * 6) % depthData.lastNames.length;
      const name = isJapan ? `${depthData.lastNames[lIdx]} ${depthData.firstNames[fIdx]}` : `${depthData.firstNames[fIdx]} ${depthData.lastNames[lIdx]}`;
      const outfieldPlayer = makeRealPlayer(
        pId,
        name,
        club.id,
        pos,
        18 + (i % 6),
        club.country,
        tierBaseOvr - (i % 3),
        tierBaseOvr + 5,
        isJapan ? 650000 : 4000000,
        isJapan ? 11000 : 20000,
        28 + (i % 60),
        i % 3 === 0 ? '左' : '右',
        'チャンスメイカー'
      );
      cleanPlayers[pId] = outfieldPlayer;
      club.playerIds.push(pId);
    }
  });

  // Update squad status defaults for each club
  // CRITICAL: Ensure 1 GK in STARTING, 1 GK on BENCH, and reserve GKs in OUT_OF_SQUAD (スタメン・ベンチ・ベンチ外)
  Object.values(cleanClubs).forEach(club => {
    if (club.id === 'free_agent') return;
    const clubPlayers = club.playerIds.map(id => cleanPlayers[id]).filter(Boolean);
    const clubGks = clubPlayers.filter(p => p.position === 'GK').sort((a, b) => b.ovr - a.ovr);
    const clubOutfield = clubPlayers.filter(p => p.position !== 'GK').sort((a, b) => b.ovr - a.ovr);

    // 1st GK is STARTING (スタメン)
    if (clubGks[0]) clubGks[0].squadStatus = 'STARTING';
    // 2nd GK is BENCH (ベンチ)
    if (clubGks[1]) clubGks[1].squadStatus = 'BENCH';
    // 3rd+ GKs are OUT_OF_SQUAD (ベンチ外・リザーブ)
    for (let i = 2; i < clubGks.length; i++) {
      clubGks[i].squadStatus = 'OUT_OF_SQUAD';
    }

    // Top 10 outfield are STARTING
    clubOutfield.forEach((p, idx) => {
      if (idx < 10) {
        p.squadStatus = 'STARTING';
      } else if (idx < 18) {
        // Up to 8 outfield players on bench (giving 1 GK + 8 outfield = 9 bench players)
        p.squadStatus = 'BENCH';
      } else {
        p.squadStatus = 'OUT_OF_SQUAD';
      }
    });

    // Populate full default tactics with strict GK in slot 0, bench GK, and reserves
    club.tactics = getDefaultTacticsForClub(club, cleanPlayers);
  });

  return { clubs: cleanClubs, players: cleanPlayers };
}

export function getDefaultTacticsForClub(club: Club, players: Record<string, Player>): TeamTactics {
  const clubPlayers = club.playerIds.map(id => players[id]).filter(Boolean);
  
  // Sort players by OVR descending
  const sorted = [...clubPlayers].sort((a, b) => b.ovr - a.ovr);
  
  // CRITICAL REQUIREMENT: Complete separation of GK and Outfield players
  // GKs must NEVER be assigned to outfield positions (CB, LB, RB, etc.)
  const gks = sorted.filter(p => p.position === 'GK');
  const outfield = sorted.filter(p => p.position !== 'GK');

  // Starter GK: highest OVR GK
  const starterGk = gks[0] || sorted[0];
  // Bench GK: 2nd highest OVR GK (guaranteed backup GK on bench)
  const benchGk = gks.find(p => p.id !== starterGk?.id);
  // Reserve GKs: 3rd+ GK (reserves / out of squad)
  const reserveGks = gks.filter(p => p.id !== starterGk?.id && p.id !== benchGk?.id);

  // Position slots for outfield ONLY
  const defs = outfield.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position));
  const mids = outfield.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
  const fwds = outfield.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position));

  // Pick starters with preferred positions (STRICTLY FROM OUTFIELD!)
  const rb = defs.find(p => p.position === 'RB' || p.position === 'RWB') || defs[0] || outfield[0];
  const cb1 = defs.find(p => p.position === 'CB' && p.id !== rb?.id) || defs.find(p => p.id !== rb?.id) || outfield.find(p => p.id !== rb?.id);
  const cb2 = defs.find(p => p.position === 'CB' && p.id !== rb?.id && p.id !== cb1?.id) || defs.find(p => p.id !== rb?.id && p.id !== cb1?.id) || outfield.find(p => p.id !== rb?.id && p.id !== cb1?.id);
  const lb = defs.find(p => (p.position === 'LB' || p.position === 'LWB') && p.id !== rb?.id && p.id !== cb1?.id && p.id !== cb2?.id) || defs.find(p => p.id !== rb?.id && p.id !== cb1?.id && p.id !== cb2?.id) || outfield.find(p => p.id !== rb?.id && p.id !== cb1?.id && p.id !== cb2?.id);

  const cdm = mids.find(p => p.position === 'CDM') || mids[0] || outfield[4];
  const cm1 = mids.find(p => (p.position === 'CM' || p.position === 'CAM') && p.id !== cdm?.id) || mids.find(p => p.id !== cdm?.id) || outfield[5];
  const cm2 = mids.find(p => p.id !== cdm?.id && p.id !== cm1?.id) || mids.find(p => p.id !== cdm?.id && p.id !== cm1?.id) || outfield[6];

  const rw = fwds.find(p => p.position === 'RW' || p.position === 'RM') || fwds[0] || outfield[7];
  const st = fwds.find(p => (p.position === 'ST' || p.position === 'CF') && p.id !== rw?.id) || fwds.find(p => p.id !== rw?.id) || outfield[8];
  const lw = fwds.find(p => (p.position === 'LW' || p.position === 'LM') && p.id !== rw?.id && p.id !== st?.id) || fwds.find(p => p.id !== rw?.id && p.id !== st?.id) || outfield[9];

  const starterCandidates = [
    { p: starterGk, pos: 'GK' as Position, x: 50, y: 92 },
    { p: rb, pos: 'RB' as Position, x: 85, y: 72 },
    { p: cb1, pos: 'CB' as Position, x: 63, y: 75 },
    { p: cb2, pos: 'CB' as Position, x: 37, y: 75 },
    { p: lb, pos: 'LB' as Position, x: 15, y: 72 },
    { p: cdm, pos: 'CDM' as Position, x: 50, y: 55 },
    { p: cm1, pos: 'CM' as Position, x: 70, y: 45 },
    { p: cm2, pos: 'CM' as Position, x: 30, y: 45 },
    { p: rw, pos: 'RW' as Position, x: 82, y: 25 },
    { p: st, pos: 'ST' as Position, x: 50, y: 20 },
    { p: lw, pos: 'LW' as Position, x: 18, y: 25 },
  ];

  const pickedIds = new Set<string>();
  const starters = starterCandidates.map((slot, idx) => {
    let chosen = slot.p;
    if (idx === 0) {
      // Slot 0 is strictly GK
      chosen = starterGk || gks[0];
    } else {
      // Outfield slots (1..10) MUST NEVER BE GK
      if (!chosen || pickedIds.has(chosen.id) || chosen.position === 'GK') {
        chosen = outfield.find(p => !pickedIds.has(p.id)) || outfield[0];
      }
    }
    if (chosen) pickedIds.add(chosen.id);
    return {
      playerId: chosen?.id || '',
      position: slot.pos,
      pitchX: slot.x,
      pitchY: slot.y
    };
  });

  // Bench: Always put benchGk on bench first, then remaining outfield up to 9
  const remainingOutfield = outfield.filter(p => !pickedIds.has(p.id));
  const benchIds: string[] = [];
  if (benchGk && !pickedIds.has(benchGk.id)) {
    benchIds.push(benchGk.id);
  }
  for (const op of remainingOutfield) {
    if (benchIds.length >= 9) break;
    benchIds.push(op.id);
  }

  // Reserves: Reserve GKs (bench out) + rest of outfield
  const benchSet = new Set(benchIds);
  const reserveIds: string[] = [];
  reserveGks.forEach(rg => {
    if (!pickedIds.has(rg.id) && !benchSet.has(rg.id)) {
      reserveIds.push(rg.id);
    }
  });
  remainingOutfield.forEach(op => {
    if (!benchSet.has(op.id)) {
      reserveIds.push(op.id);
    }
  });

  const baseTactics: TeamTactics = {
    formation: '4-3-3',
    lineup: {
      starters,
      bench: benchIds,
      reserves: reserveIds
    },
    instructions: {
      attackingStyle: 'ポゼッション・パス',
      defensiveStyle: 'ハイプレス',
      pressIntensity: '標準的',
      defensiveLine: 'ハイライン',
      tempo: '高速テンポ',
      counterUrgency: 'ボール奪取時即カウンター'
    },
    roles: {
      captainId: starters[2]?.playerId || starters[0]?.playerId,
      penaltyTakerId: starters[9]?.playerId || starters[8]?.playerId,
      freeKickTakerId: starters[6]?.playerId,
      cornerTakerId: starters[8]?.playerId
    }
  };

  if (club.currentFormation && club.currentFormation !== '4-3-3') {
    return updateTacticsFormation(baseTactics, club.currentFormation, players);
  }

  return baseTactics;
}
