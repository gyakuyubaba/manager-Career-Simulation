import { RosterSeed } from './allClubsSquads';

/**
 * Priority Authentic Seeds for:
 * 1. Must-check European players: Désiré Doué, Viktor Gyökeres, Antoine Semenyo, João Pedro, Rayan Cherki, Kaishu Sano, Zion Suzuki
 * 2. Authentic Japanese stars playing in Europe
 * 3. Key authentic stars across EFL Championship, Segunda, 2. Bundesliga, Serie B, and Ligue 2
 */
export const MUST_CHECK_AND_OVERSEAS_SEEDS: Record<string, RosterSeed[]> = {
  // --- PSG (Désiré Doué) ---
  psg: [
    { name: 'Désiré Doué', position: 'LW', age: 21, nationality: 'フランス', ovr: 82, shirtNumber: 14, playstyle: 'チャンスメイカー' },
    { name: 'Bradley Barcola', position: 'LW', age: 23, nationality: 'フランス', ovr: 83, shirtNumber: 29, playstyle: 'スピードスター' },
    { name: 'João Neves', position: 'CM', age: 21, nationality: 'ポルトガル', ovr: 83, shirtNumber: 87, playstyle: 'ボックストゥボックス' },
    { name: 'Willian Pacho', position: 'CB', age: 24, nationality: 'エクアドル', ovr: 82, shirtNumber: 51, playstyle: 'ボール運べるCB' }
  ],

  // --- Mainz 05 (Kaishu Sano) ---
  mainz: [
    { name: '佐野 海舟 (Kaishu Sano)', position: 'CDM', age: 25, nationality: '日本', ovr: 77, shirtNumber: 14, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Jonathan Burkardt', position: 'ST', age: 25, nationality: 'ドイツ', ovr: 79, shirtNumber: 29 },
    { name: 'Nadiem Amiri', position: 'CM', age: 29, nationality: 'ドイツ', ovr: 78, shirtNumber: 18 },
    { name: 'Robin Zentner', position: 'GK', age: 31, nationality: 'ドイツ', ovr: 77, shirtNumber: 27 },
    { name: 'Silvan Widmer', position: 'RB', age: 33, nationality: 'スイス', ovr: 76, shirtNumber: 30 }
  ],

  // --- Parma (Zion Suzuki) ---
  parma: [
    { name: '鈴木 彩艶 (Zion Suzuki)', position: 'GK', age: 23, nationality: '日本', ovr: 78, shirtNumber: 31, playstyle: 'ビルドアップ型GK', preferredFoot: '右' },
    { name: 'Dennis Man', position: 'RW', age: 27, nationality: 'ルーマニア', ovr: 78, shirtNumber: 98 },
    { name: 'Valentin Mihăilă', position: 'LW', age: 26, nationality: 'ルーマニア', ovr: 76, shirtNumber: 28 },
    { name: 'Ange-Yoan Bonny', position: 'ST', age: 22, nationality: 'フランス', ovr: 76, shirtNumber: 13 },
    { name: 'Adrián Bernabé', position: 'CM', age: 25, nationality: 'スペイン', ovr: 77, shirtNumber: 10 }
  ],

  // --- Bournemouth (Antoine Semenyo) ---
  bournemouth: [
    { name: 'Antoine Semenyo', position: 'RW', age: 26, nationality: 'ガーナ', ovr: 81, shirtNumber: 24, playstyle: 'チャンスメイカー' },
    { name: 'Evanilson', position: 'ST', age: 26, nationality: 'ブラジル', ovr: 80, shirtNumber: 9 },
    { name: 'Justin Kluivert', position: 'CAM', age: 27, nationality: 'オランダ', ovr: 79, shirtNumber: 19 },
    { name: 'Marcus Tavernier', position: 'LW', age: 27, nationality: 'イングランド', ovr: 79, shirtNumber: 16 }
  ],

  // --- Brighton (João Pedro & Kaoru Mitoma) ---
  brighton: [
    { name: '三笘 薫 (Kaoru Mitoma)', position: 'LW', age: 29, nationality: '日本', ovr: 82, shirtNumber: 22, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'João Pedro', position: 'ST', age: 24, nationality: 'ブラジル', ovr: 81, shirtNumber: 9, playstyle: 'ラインブレイカー' },
    { name: 'Georginio Rutter', position: 'CF', age: 24, nationality: 'フランス', ovr: 80, shirtNumber: 14 },
    { name: 'Yankuba Minteh', position: 'RW', age: 22, nationality: 'ガンビア', ovr: 79, shirtNumber: 17 },
    { name: 'Carlos Baleba', position: 'CDM', age: 22, nationality: 'カメルーン', ovr: 79, shirtNumber: 20 },
    { name: 'Lewis Dunk', position: 'CB', age: 34, nationality: 'イングランド', ovr: 81, shirtNumber: 5 }
  ],

  // --- Crystal Palace (Daichi Kamada, Eberechi Eze, Mateta) ---
  crystal_palace: [
    { name: '鎌田 大地 (Daichi Kamada)', position: 'CAM', age: 29, nationality: '日本', ovr: 81, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Eberechi Eze', position: 'CAM', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 10, playstyle: 'チャンスメイカー' },
    { name: 'Jean-Philippe Mateta', position: 'ST', age: 29, nationality: 'フランス', ovr: 81, shirtNumber: 14, playstyle: 'ターゲットマン' },
    { name: 'Marc Guéhi', position: 'CB', age: 26, nationality: 'イングランド', ovr: 83, shirtNumber: 6, playstyle: 'ボール運べるCB' },
    { name: 'Adam Wharton', position: 'CDM', age: 22, nationality: 'イングランド', ovr: 81, shirtNumber: 20, playstyle: 'アンカー' },
    { name: 'Dean Henderson', position: 'GK', age: 29, nationality: 'イングランド', ovr: 80, shirtNumber: 1, playstyle: 'ショットストッパー' },
    { name: 'Daniel Muñoz', position: 'RB', age: 30, nationality: 'コロンビア', ovr: 80, shirtNumber: 12, playstyle: '攻撃的SB' },
    { name: 'Maxence Lacroix', position: 'CB', age: 26, nationality: 'フランス', ovr: 79, shirtNumber: 5, playstyle: 'ボール運べるCB' },
    { name: 'Ismaïla Sarr', position: 'RW', age: 28, nationality: 'セネガル', ovr: 79, shirtNumber: 7, playstyle: 'スピードスター' },
    { name: 'Eddie Nketiah', position: 'ST', age: 27, nationality: 'イングランド', ovr: 78, shirtNumber: 9, playstyle: 'ゴールゲッター' },
    { name: 'Tyrick Mitchell', position: 'LB', age: 26, nationality: 'イングランド', ovr: 79, shirtNumber: 3, playstyle: '守備的SB' }
  ],

  // --- Lyon (Rayan Cherki) ---
  lyon: [
    { name: 'Rayan Cherki', position: 'CAM', age: 22, nationality: 'フランス', ovr: 81, shirtNumber: 18, playstyle: 'チャンスメイカー' },
    { name: 'Alexandre Lacazette', position: 'ST', age: 35, nationality: 'フランス', ovr: 82, shirtNumber: 10 },
    { name: 'Georges Mikautadze', position: 'ST', age: 25, nationality: 'ジョージア', ovr: 80, shirtNumber: 69 },
    { name: 'Maxence Caqueret', position: 'CM', age: 26, nationality: 'フランス', ovr: 80, shirtNumber: 6 },
    { name: 'Lucas Perri', position: 'GK', age: 28, nationality: 'ブラジル', ovr: 79, shirtNumber: 23 }
  ],

  // --- Arsenal (Tomiyasu & Gyökeres presence in world elite) ---
  arsenal: [
    { name: '冨安 健洋 (Takehiro Tomiyasu)', position: 'RB', age: 27, nationality: '日本', ovr: 81, shirtNumber: 18, playstyle: '守備的SB', preferredFoot: '両足' },
    { name: 'Viktor Gyökeres', position: 'ST', age: 28, nationality: 'スウェーデン', ovr: 87, shirtNumber: 9, playstyle: 'ラインブレイカー' }
  ],

  // --- Liverpool (Wataru Endo) ---
  liverpool: [
    { name: '遠藤 航 (Wataru Endo)', position: 'CDM', age: 33, nationality: '日本', ovr: 80, shirtNumber: 3, playstyle: 'アンカー', preferredFoot: '右' }
  ],

  // --- Real Sociedad (Takefusa Kubo) ---
  real_sociedad: [
    { name: '久保 建英 (Takefusa Kubo)', position: 'RW', age: 25, nationality: '日本', ovr: 83, shirtNumber: 14, playstyle: 'チャンスメイカー', preferredFoot: '左' }
  ],

  // --- Monaco (Takumi Minamino) ---
  monaco: [
    { name: '南野 拓実 (Takumi Minamino)', position: 'CAM', age: 31, nationality: '日本', ovr: 80, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  // --- Freiburg (Ritsu Doan) ---
  freiburg: [
    { name: '堂安 律 (Ritsu Doan)', position: 'RW', age: 28, nationality: '日本', ovr: 80, shirtNumber: 42, playstyle: 'チャンスメイカー', preferredFoot: '左' }
  ],

  // --- Reims (Junya Ito & Keito Nakamura) ---
  reims: [
    { name: '伊東 純也 (Junya Ito)', position: 'RW', age: 33, nationality: '日本', ovr: 79, shirtNumber: 7, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: '中村 敬斗 (Keito Nakamura)', position: 'LW', age: 26, nationality: '日本', ovr: 79, shirtNumber: 17, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  // --- Southampton (Yukinari Sugawara) ---
  southampton: [
    { name: '菅原 由勢 (Yukinari Sugawara)', position: 'RB', age: 26, nationality: '日本', ovr: 78, shirtNumber: 16, playstyle: '攻撃的SB', preferredFoot: '右' }
  ],

  // --- Borussia Mönchengladbach (Ko Itakura) ---
  b_monchengladbach: [
    { name: '板倉 滉 (Ko Itakura)', position: 'CB', age: 29, nationality: '日本', ovr: 79, shirtNumber: 3, playstyle: 'ボール運べるCB', preferredFoot: '右' }
  ],

  // --- Key EFL Championship Stars ---
  leeds_united: [
    { name: 'Wilfried Gnonto', position: 'RW', age: 22, nationality: 'イタリア', ovr: 78, shirtNumber: 29 },
    { name: 'Daniel James', position: 'LW', age: 28, nationality: 'ウェールズ', ovr: 77, shirtNumber: 7 },
    { name: 'Pascal Struijk', position: 'CB', age: 27, nationality: 'オランダ', ovr: 78, shirtNumber: 5 },
    { name: 'Ethan Ampadu', position: 'CDM', age: 25, nationality: 'ウェールズ', ovr: 77, shirtNumber: 4 },
    { name: 'Illan Meslier', position: 'GK', age: 26, nationality: 'フランス', ovr: 78, shirtNumber: 1 },
    { name: 'Joël Piroe', position: 'ST', age: 27, nationality: 'オランダ', ovr: 77, shirtNumber: 10 },
    { name: '田中 碧 (Ao Tanaka)', position: 'CM', age: 27, nationality: '日本', ovr: 77, shirtNumber: 22, playstyle: 'ボックストゥボックス' }
  ],

  burnley: [
    { name: 'Josh Brownhill', position: 'CM', age: 30, nationality: 'イングランド', ovr: 78, shirtNumber: 8 },
    { name: 'Luca Koleosho', position: 'RW', age: 21, nationality: 'イタリア', ovr: 76, shirtNumber: 30 },
    { name: 'James Trafford', position: 'GK', age: 23, nationality: 'イングランド', ovr: 77, shirtNumber: 1 },
    { name: 'Maxime Estève', position: 'CB', age: 24, nationality: 'フランス', ovr: 77, shirtNumber: 5 },
    { name: 'Lyle Foster', position: 'ST', age: 25, nationality: '南アフリカ', ovr: 76, shirtNumber: 17 }
  ],

  sheffield_united: [
    { name: 'Gustavo Hamer', position: 'CM', age: 29, nationality: 'オランダ', ovr: 79, shirtNumber: 8 },
    { name: 'Vinícius Souza', position: 'CDM', age: 27, nationality: 'ブラジル', ovr: 77, shirtNumber: 21 },
    { name: 'Anel Ahmedhodžić', position: 'CB', age: 27, nationality: 'ボスニア', ovr: 77, shirtNumber: 15 },
    { name: 'Kieffer Moore', position: 'ST', age: 33, nationality: 'ウェールズ', ovr: 75, shirtNumber: 9 },
    { name: 'Michael Cooper', position: 'GK', age: 26, nationality: 'イングランド', ovr: 76, shirtNumber: 1 }
  ],

  sunderland: [
    { name: 'Jobe Bellingham', position: 'CM', age: 20, nationality: 'イングランド', ovr: 77, shirtNumber: 7, playstyle: 'チャンスメイカー' },
    { name: 'Chris Rigg', position: 'CAM', age: 19, nationality: 'イングランド', ovr: 75, shirtNumber: 11 },
    { name: 'Anthony Patterson', position: 'GK', age: 26, nationality: 'イングランド', ovr: 77, shirtNumber: 1 },
    { name: 'Trai Hume', position: 'RB', age: 24, nationality: '北アイルランド', ovr: 75, shirtNumber: 32 },
    { name: 'Romaine Mundle', position: 'LW', age: 23, nationality: 'イングランド', ovr: 74, shirtNumber: 14 }
  ],

  // --- Key 2. Bundesliga Stars ---
  koln: [
    { name: 'Jonas Urbig', position: 'GK', age: 23, nationality: 'ドイツ', ovr: 76, shirtNumber: 40 },
    { name: 'Timo Hübers', position: 'CB', age: 30, nationality: 'ドイツ', ovr: 77, shirtNumber: 4 },
    { name: 'Eric Martel', position: 'CDM', age: 24, nationality: 'ドイツ', ovr: 76, shirtNumber: 6 },
    { name: 'Linton Maina', position: 'LW', age: 27, nationality: 'ドイツ', ovr: 76, shirtNumber: 37 },
    { name: 'Tim Lemperle', position: 'ST', age: 24, nationality: 'ドイツ', ovr: 75, shirtNumber: 19 },
    { name: 'Damion Downs', position: 'ST', age: 22, nationality: 'アメリカ', ovr: 73, shirtNumber: 21 }
  ],

  hamburg_sv: [
    { name: 'Robert Glatzel', position: 'ST', age: 32, nationality: 'ドイツ', ovr: 78, shirtNumber: 9 },
    { name: 'Ludovit Reis', position: 'CM', age: 26, nationality: 'オランダ', ovr: 77, shirtNumber: 14 },
    { name: 'Daniel Heuer Fernandes', position: 'GK', age: 33, nationality: 'ポルトガル', ovr: 76, shirtNumber: 1 },
    { name: 'Sebastian Schonlau', position: 'CB', age: 32, nationality: 'ドイツ', ovr: 75, shirtNumber: 4 },
    { name: 'Jean-Luc Dompé', position: 'LW', age: 31, nationality: 'フランス', ovr: 75, shirtNumber: 27 }
  ],

  schalke_04: [
    { name: 'Kenan Karaman', position: 'ST', age: 32, nationality: 'トルコ', ovr: 76, shirtNumber: 19 },
    { name: 'Moussa Sylla', position: 'ST', age: 26, nationality: 'マリ', ovr: 76, shirtNumber: 9 },
    { name: 'Paul Seguin', position: 'CM', age: 31, nationality: 'ドイツ', ovr: 75, shirtNumber: 7 },
    { name: 'Marcin Kamiński', position: 'CB', age: 34, nationality: 'ポーランド', ovr: 73, shirtNumber: 35 },
    { name: 'Justin Heekeren', position: 'GK', age: 25, nationality: 'ドイツ', ovr: 72, shirtNumber: 1 }
  ],

  // --- Key Serie B Stars ---
  sassuolo: [
    { name: 'Domenico Berardi', position: 'RW', age: 32, nationality: 'イタリア', ovr: 83, shirtNumber: 10, playstyle: 'チャンスメイカー' },
    { name: 'Armand Laurienté', position: 'LW', age: 27, nationality: 'フランス', ovr: 78, shirtNumber: 45 },
    { name: 'Kristian Thorstvedt', position: 'CAM', age: 27, nationality: 'ノルウェー', ovr: 76, shirtNumber: 42 },
    { name: 'Daniel Boloca', position: 'CM', age: 27, nationality: 'ルーマニア', ovr: 75, shirtNumber: 24 },
    { name: 'Giacomo Satalino', position: 'GK', age: 27, nationality: 'イタリア', ovr: 73, shirtNumber: 1 }
  ],

  palermo: [
    { name: 'Matteo Brunori', position: 'ST', age: 31, nationality: 'イタリア', ovr: 77, shirtNumber: 9 },
    { name: 'Jacopo Segre', position: 'CM', age: 29, nationality: 'イタリア', ovr: 75, shirtNumber: 8 },
    { name: 'Kristoffer Lund', position: 'LB', age: 24, nationality: 'アメリカ', ovr: 74, shirtNumber: 3 },
    { name: 'Sebastiano Desplanches', position: 'GK', age: 23, nationality: 'イタリア', ovr: 74, shirtNumber: 1 }
  ],

  sampdoria: [
    { name: 'Massimo Coda', position: 'ST', age: 37, nationality: 'イタリア', ovr: 76, shirtNumber: 9 },
    { name: 'Gennaro Tutino', position: 'ST', age: 30, nationality: 'イタリア', ovr: 76, shirtNumber: 10 },
    { name: 'Pajtim Kasami', position: 'CM', age: 34, nationality: 'スイス', ovr: 74, shirtNumber: 14 },
    { name: 'Simone Romagnoli', position: 'CB', age: 36, nationality: 'イタリア', ovr: 73, shirtNumber: 5 }
  ],

  // --- Key Ligue 2 Stars ---
  lorient: [
    { name: 'Eli Junior Kroupi', position: 'ST', age: 20, nationality: 'フランス', ovr: 77, shirtNumber: 22, playstyle: 'シャドーストライカー' },
    { name: 'Laurent Abergel', position: 'CDM', age: 33, nationality: 'フランス', ovr: 76, shirtNumber: 6 },
    { name: 'Yvon Mvogo', position: 'GK', age: 32, nationality: 'スイス', ovr: 78, shirtNumber: 38 },
    { name: 'Montassar Talbi', position: 'CB', age: 28, nationality: 'チュニジア', ovr: 76, shirtNumber: 3 }
  ],

  metz: [
    { name: 'Gauthier Hein', position: 'CAM', age: 29, nationality: 'フランス', ovr: 77, shirtNumber: 7 },
    { name: 'Matthieu Udol', position: 'LB', age: 30, nationality: 'フランス', ovr: 76, shirtNumber: 3 },
    { name: 'Alexandre Oukidja', position: 'GK', age: 37, nationality: 'アルジェリア', ovr: 75, shirtNumber: 16 },
    { name: 'Sadibou Sané', position: 'CB', age: 22, nationality: 'セネガル', ovr: 74, shirtNumber: 5 }
  ],

  paris_fc: [
    { name: 'Ilan Kebbal', position: 'RW', age: 28, nationality: 'アルジェリア', ovr: 77, shirtNumber: 10 },
    { name: 'Jean-Philippe Krasso', position: 'ST', age: 28, nationality: 'コートジボワール', ovr: 76, shirtNumber: 11 },
    { name: 'Maxime Lopez', position: 'CM', age: 28, nationality: 'フランス', ovr: 77, shirtNumber: 21 },
    { name: 'Obed Nkambadio', position: 'GK', age: 23, nationality: 'フランス', ovr: 75, shirtNumber: 1 }
  ]
};
