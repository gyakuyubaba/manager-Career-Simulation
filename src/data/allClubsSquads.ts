import { Position, PlayStyle } from '../types/game';

export interface RosterSeed {
  name: string;
  position: Position;
  age: number;
  nationality: string;
  ovr: number;
  shirtNumber: number;
  playstyle?: PlayStyle;
  preferredFoot?: '右' | '左' | '両足';
}

/**
 * Authentic 2026/27 Season Official Rosters for European Major League Clubs
 * (Non-overlapping with CURATED_REAL_SQUADS in squadsCatalog.ts)
 */
export const ADDITIONAL_CLUB_SEEDS: Record<string, RosterSeed[]> = {
  // ==========================================
  // PREMIER LEAGUE (2026/27 Season Official)
  // ==========================================
  aston_villa: [
    { name: 'Emiliano Martínez', position: 'GK', age: 34, nationality: 'アルゼンチン', ovr: 87, shirtNumber: 23 },
    { name: 'Ezri Konsa', position: 'CB', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 4 },
    { name: 'Pau Torres', position: 'CB', age: 29, nationality: 'スペイン', ovr: 84, shirtNumber: 14 },
    { name: 'Matty Cash', position: 'RB', age: 29, nationality: 'ポーランド', ovr: 80, shirtNumber: 2 },
    { name: 'Lucas Digne', position: 'LB', age: 33, nationality: 'フランス', ovr: 80, shirtNumber: 12 },
    { name: 'Amadou Onana', position: 'CDM', age: 25, nationality: 'ベルギー', ovr: 82, shirtNumber: 24 },
    { name: 'Youri Tielemans', position: 'CM', age: 29, nationality: 'ベルギー', ovr: 83, shirtNumber: 8 },
    { name: 'John McGinn', position: 'CM', age: 31, nationality: 'スコットランド', ovr: 82, shirtNumber: 7 },
    { name: 'Leon Bailey', position: 'RW', age: 29, nationality: 'ジャマイカ', ovr: 82, shirtNumber: 31 },
    { name: 'Ollie Watkins', position: 'ST', age: 30, nationality: 'イングランド', ovr: 85, shirtNumber: 11 },
    { name: 'Morgan Rogers', position: 'LW', age: 24, nationality: 'イングランド', ovr: 81, shirtNumber: 27 },
    { name: 'Jhon Durán', position: 'ST', age: 22, nationality: 'コロンビア', ovr: 81, shirtNumber: 9 },
    { name: 'Ian Maatsen', position: 'LB', age: 24, nationality: 'オランダ', ovr: 80, shirtNumber: 22 },
    { name: 'Boubacar Kamara', position: 'CDM', age: 26, nationality: 'フランス', ovr: 81, shirtNumber: 44 },
    { name: 'Diego Carlos', position: 'CB', age: 33, nationality: 'ブラジル', ovr: 79, shirtNumber: 3 },
    { name: 'Ross Barkley', position: 'CM', age: 32, nationality: 'イングランド', ovr: 78, shirtNumber: 6 }
  ],

  tottenham: [
    { name: 'Guglielmo Vicario', position: 'GK', age: 29, nationality: 'イタリア', ovr: 84, shirtNumber: 1 },
    { name: 'Cristian Romero', position: 'CB', age: 28, nationality: 'アルゼンチン', ovr: 85, shirtNumber: 17 },
    { name: 'Micky van de Ven', position: 'CB', age: 25, nationality: 'オランダ', ovr: 84, shirtNumber: 37 },
    { name: 'Pedro Porro', position: 'RB', age: 26, nationality: 'スペイン', ovr: 83, shirtNumber: 23 },
    { name: 'Destiny Udogie', position: 'LB', age: 23, nationality: 'イタリア', ovr: 83, shirtNumber: 13 },
    { name: 'Yves Bissouma', position: 'CDM', age: 29, nationality: 'マリ', ovr: 81, shirtNumber: 8 },
    { name: 'Pape Matar Sarr', position: 'CM', age: 23, nationality: 'セネガル', ovr: 81, shirtNumber: 29 },
    { name: 'James Maddison', position: 'CAM', age: 29, nationality: 'イングランド', ovr: 85, shirtNumber: 10 },
    { name: 'Dejan Kulusevski', position: 'RW', age: 26, nationality: 'スウェーデン', ovr: 84, shirtNumber: 21 },
    { name: 'Dominic Solanke', position: 'ST', age: 28, nationality: 'イングランド', ovr: 82, shirtNumber: 19 },
    { name: '孫 興民 (Son Heung-min)', position: 'LW', age: 34, nationality: '韓国', ovr: 86, shirtNumber: 7 },
    { name: 'Brennan Johnson', position: 'RW', age: 25, nationality: 'ウェールズ', ovr: 81, shirtNumber: 22 },
    { name: 'Richarlison', position: 'ST', age: 29, nationality: 'ブラジル', ovr: 81, shirtNumber: 9 },
    { name: 'Rodrigo Bentancur', position: 'CM', age: 29, nationality: 'ウルグアイ', ovr: 82, shirtNumber: 30 },
    { name: 'Radu Drăgușin', position: 'CB', age: 24, nationality: 'ルーマニア', ovr: 79, shirtNumber: 6 },
    { name: 'Archie Gray', position: 'RB', age: 20, nationality: 'イングランド', ovr: 77, shirtNumber: 14 }
  ],

  man_united: [
    { name: 'André Onana', position: 'GK', age: 30, nationality: 'カメルーン', ovr: 83, shirtNumber: 24 },
    { name: 'Matthijs de Ligt', position: 'CB', age: 27, nationality: 'オランダ', ovr: 85, shirtNumber: 4 },
    { name: 'Lisandro Martínez', position: 'CB', age: 28, nationality: 'アルゼンチン', ovr: 84, shirtNumber: 6 },
    { name: 'Diogo Dalot', position: 'RB', age: 27, nationality: 'ポルトガル', ovr: 82, shirtNumber: 20 },
    { name: 'Luke Shaw', position: 'LB', age: 31, nationality: 'イングランド', ovr: 81, shirtNumber: 23 },
    { name: 'Kobbie Mainoo', position: 'CM', age: 21, nationality: 'イングランド', ovr: 83, shirtNumber: 37 },
    { name: 'Manuel Ugarte', position: 'CDM', age: 25, nationality: 'ウルグアイ', ovr: 82, shirtNumber: 25 },
    { name: 'Bruno Fernandes', position: 'CAM', age: 32, nationality: 'ポルトガル', ovr: 87, shirtNumber: 8 },
    { name: 'Alejandro Garnacho', position: 'RW', age: 22, nationality: 'アルゼンチン', ovr: 83, shirtNumber: 17 },
    { name: 'Rasmus Højlund', position: 'ST', age: 23, nationality: 'デンマーク', ovr: 81, shirtNumber: 9 },
    { name: 'Marcus Rashford', position: 'LW', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 10 },
    { name: 'Joshua Zirkzee', position: 'ST', age: 25, nationality: 'オランダ', ovr: 80, shirtNumber: 11 },
    { name: 'Amad Diallo', position: 'RW', age: 24, nationality: 'コートジボワール', ovr: 80, shirtNumber: 16 },
    { name: 'Casemiro', position: 'CDM', age: 34, nationality: 'ブラジル', ovr: 82, shirtNumber: 18 },
    { name: 'Noussair Mazraoui', position: 'RB', age: 28, nationality: 'モロッコ', ovr: 81, shirtNumber: 3 },
    { name: 'Harry Maguire', position: 'CB', age: 33, nationality: 'イングランド', ovr: 80, shirtNumber: 5 },
    { name: 'Leny Yoro', position: 'CB', age: 19, nationality: 'フランス', ovr: 80, shirtNumber: 15 }
  ],

  newcastle: [
    { name: 'Nick Pope', position: 'GK', age: 34, nationality: 'イングランド', ovr: 83, shirtNumber: 22 },
    { name: 'Kieran Trippier', position: 'RB', age: 35, nationality: 'イングランド', ovr: 82, shirtNumber: 2 },
    { name: 'Fabian Schär', position: 'CB', age: 34, nationality: 'スイス', ovr: 82, shirtNumber: 5 },
    { name: 'Sven Botman', position: 'CB', age: 26, nationality: 'オランダ', ovr: 83, shirtNumber: 4 },
    { name: 'Lewis Hall', position: 'LB', age: 21, nationality: 'イングランド', ovr: 78, shirtNumber: 20 },
    { name: 'Bruno Guimarães', position: 'CM', age: 28, nationality: 'ブラジル', ovr: 86, shirtNumber: 39 },
    { name: 'Sandro Tonali', position: 'CDM', age: 26, nationality: 'イタリア', ovr: 84, shirtNumber: 8 },
    { name: 'Joelinton', position: 'CM', age: 30, nationality: 'ブラジル', ovr: 82, shirtNumber: 7 },
    { name: 'Anthony Gordon', position: 'LW', age: 25, nationality: 'イングランド', ovr: 84, shirtNumber: 10 },
    { name: 'Alexander Isak', position: 'ST', age: 26, nationality: 'スウェーデン', ovr: 86, shirtNumber: 14 },
    { name: 'Harvey Barnes', position: 'RW', age: 28, nationality: 'イングランド', ovr: 81, shirtNumber: 11 },
    { name: 'Tino Livramento', position: 'RB', age: 23, nationality: 'イングランド', ovr: 80, shirtNumber: 21 },
    { name: 'Dan Burn', position: 'CB', age: 34, nationality: 'イングランド', ovr: 79, shirtNumber: 33 },
    { name: 'Callum Wilson', position: 'ST', age: 34, nationality: 'イングランド', ovr: 80, shirtNumber: 9 }
  ],

  west_ham: [
    { name: 'Alphonse Areola', position: 'GK', age: 33, nationality: 'フランス', ovr: 82, shirtNumber: 23 },
    { name: 'Aaron Wan-Bissaka', position: 'RB', age: 28, nationality: 'イングランド', ovr: 81, shirtNumber: 29 },
    { name: 'Max Kilman', position: 'CB', age: 29, nationality: 'イングランド', ovr: 81, shirtNumber: 26 },
    { name: 'Jean-Clair Todibo', position: 'CB', age: 26, nationality: 'フランス', ovr: 82, shirtNumber: 25 },
    { name: 'Emerson', position: 'LB', age: 32, nationality: 'イタリア', ovr: 79, shirtNumber: 33 },
    { name: 'Edson Álvarez', position: 'CDM', age: 28, nationality: 'メキシコ', ovr: 81, shirtNumber: 19 },
    { name: 'Tomáš Souček', position: 'CM', age: 31, nationality: 'チェコ', ovr: 80, shirtNumber: 28 },
    { name: 'Lucas Paquetá', position: 'CAM', age: 29, nationality: 'ブラジル', ovr: 84, shirtNumber: 10 },
    { name: 'Mohammed Kudus', position: 'RW', age: 26, nationality: 'ガーナ', ovr: 84, shirtNumber: 14 },
    { name: 'Jarrod Bowen', position: 'RW', age: 29, nationality: 'イングランド', ovr: 84, shirtNumber: 20 },
    { name: 'Niclas Füllkrug', position: 'ST', age: 33, nationality: 'ドイツ', ovr: 81, shirtNumber: 11 },
    { name: 'Crysencio Summerville', position: 'LW', age: 24, nationality: 'オランダ', ovr: 79, shirtNumber: 7 }
  ],

  everton: [
    { name: 'Jordan Pickford', position: 'GK', age: 32, nationality: 'イングランド', ovr: 83, shirtNumber: 1 },
    { name: 'James Tarkowski', position: 'CB', age: 33, nationality: 'イングランド', ovr: 80, shirtNumber: 6 },
    { name: 'Jarrad Branthwaite', position: 'CB', age: 24, nationality: 'イングランド', ovr: 82, shirtNumber: 32 },
    { name: 'Vitaliy Mykolenko', position: 'LB', age: 27, nationality: 'ウクライナ', ovr: 78, shirtNumber: 19 },
    { name: 'Séamus Coleman', position: 'RB', age: 37, nationality: 'アイルランド', ovr: 76, shirtNumber: 23 },
    { name: 'Idrissa Gueye', position: 'CDM', age: 36, nationality: 'セネガル', ovr: 79, shirtNumber: 27 },
    { name: 'Abdoulaye Doucouré', position: 'CM', age: 33, nationality: 'マリ', ovr: 79, shirtNumber: 16 },
    { name: 'Dwight McNeil', position: 'CAM', age: 26, nationality: 'イングランド', ovr: 79, shirtNumber: 7 },
    { name: 'Jack Harrison', position: 'RW', age: 29, nationality: 'イングランド', ovr: 78, shirtNumber: 11 },
    { name: 'Iliman Ndiaye', position: 'LW', age: 26, nationality: 'セネガル', ovr: 78, shirtNumber: 10 },
    { name: 'Dominic Calvert-Lewin', position: 'ST', age: 29, nationality: 'イングランド', ovr: 79, shirtNumber: 9 }
  ],

  // ==========================================
  // LALIGA (2026/27 Season Official)
  // ==========================================
  atletico_madrid: [
    { name: 'Jan Oblak', position: 'GK', age: 33, nationality: 'スロベニア', ovr: 88, shirtNumber: 13 },
    { name: 'Nahuel Molina', position: 'RB', age: 28, nationality: 'アルゼンチン', ovr: 81, shirtNumber: 16 },
    { name: 'Robin Le Normand', position: 'CB', age: 29, nationality: 'スペイン', ovr: 84, shirtNumber: 24 },
    { name: 'José María Giménez', position: 'CB', age: 31, nationality: 'ウルグアイ', ovr: 83, shirtNumber: 2 },
    { name: 'Reinildo', position: 'LB', age: 32, nationality: 'モザンビーク', ovr: 80, shirtNumber: 23 },
    { name: 'Koke', position: 'CM', age: 34, nationality: 'スペイン', ovr: 83, shirtNumber: 6 },
    { name: 'Rodrigo De Paul', position: 'CM', age: 32, nationality: 'アルゼンチン', ovr: 84, shirtNumber: 5 },
    { name: 'Conor Gallagher', position: 'CM', age: 26, nationality: 'イングランド', ovr: 82, shirtNumber: 4 },
    { name: 'Marcos Llorente', position: 'RM', age: 31, nationality: 'スペイン', ovr: 83, shirtNumber: 14 },
    { name: 'Antoine Griezmann', position: 'CF', age: 35, nationality: 'フランス', ovr: 88, shirtNumber: 7 },
    { name: 'Julián Alvarez', position: 'ST', age: 26, nationality: 'アルゼンチン', ovr: 86, shirtNumber: 19 },
    { name: 'Alexander Sørloth', position: 'ST', age: 30, nationality: 'ノルウェー', ovr: 82, shirtNumber: 9 },
    { name: 'Samuel Lino', position: 'LM', age: 26, nationality: 'ブラジル', ovr: 81, shirtNumber: 12 }
  ],

  athletic_club: [
    { name: 'Unai Simón', position: 'GK', age: 29, nationality: 'スペイン', ovr: 84, shirtNumber: 1 },
    { name: 'Óscar de Marcos', position: 'RB', age: 37, nationality: 'スペイン', ovr: 79, shirtNumber: 18 },
    { name: 'Dani Vivian', position: 'CB', age: 27, nationality: 'スペイン', ovr: 83, shirtNumber: 3 },
    { name: 'Aitor Paredes', position: 'CB', age: 26, nationality: 'スペイン', ovr: 80, shirtNumber: 4 },
    { name: 'Yuri Berchiche', position: 'LB', age: 36, nationality: 'スペイン', ovr: 79, shirtNumber: 17 },
    { name: 'Beñat Prados', position: 'CDM', age: 25, nationality: 'スペイン', ovr: 79, shirtNumber: 24 },
    { name: 'Mikel Vesga', position: 'CM', age: 33, nationality: 'スペイン', ovr: 78, shirtNumber: 6 },
    { name: 'Oihan Sancet', position: 'CAM', age: 26, nationality: 'スペイン', ovr: 83, shirtNumber: 8 },
    { name: 'Iñaki Williams', position: 'RW', age: 32, nationality: 'ガーナ', ovr: 82, shirtNumber: 9 },
    { name: 'Nico Williams', position: 'LW', age: 24, nationality: 'スペイン', ovr: 86, shirtNumber: 10 },
    { name: 'Gorka Guruzeta', position: 'ST', age: 29, nationality: 'スペイン', ovr: 80, shirtNumber: 12 }
  ],

  // ==========================================
  // BUNDESLIGA (2026/27 Season Official)
  // ==========================================
  dortmund: [
    { name: 'Gregor Kobel', position: 'GK', age: 28, nationality: 'スイス', ovr: 86, shirtNumber: 1 },
    { name: 'Yan Couto', position: 'RB', age: 24, nationality: 'ブラジル', ovr: 80, shirtNumber: 2 },
    { name: 'Waldemar Anton', position: 'CB', age: 30, nationality: 'ドイツ', ovr: 82, shirtNumber: 3 },
    { name: 'Nico Schlotterbeck', position: 'CB', age: 26, nationality: 'ドイツ', ovr: 85, shirtNumber: 4 },
    { name: 'Ramy Bensebaini', position: 'LB', age: 31, nationality: 'アルジェリア', ovr: 79, shirtNumber: 5 },
    { name: 'Emre Can', position: 'CDM', age: 32, nationality: 'ドイツ', ovr: 81, shirtNumber: 23 },
    { name: 'Pascal Groß', position: 'CM', age: 35, nationality: 'ドイツ', ovr: 82, shirtNumber: 13 },
    { name: 'Julian Brandt', position: 'CAM', age: 30, nationality: 'ドイツ', ovr: 85, shirtNumber: 10 },
    { name: 'Marcel Sabitzer', position: 'CM', age: 32, nationality: 'オーストリア', ovr: 83, shirtNumber: 20 },
    { name: 'Karim Adeyemi', position: 'RW', age: 24, nationality: 'ドイツ', ovr: 81, shirtNumber: 27 },
    { name: 'Serhou Guirassy', position: 'ST', age: 30, nationality: 'ギニア', ovr: 85, shirtNumber: 9 },
    { name: 'Jamie Gittens', position: 'LW', age: 22, nationality: 'イングランド', ovr: 80, shirtNumber: 43 },
    { name: 'Maximilian Beier', position: 'ST', age: 23, nationality: 'ドイツ', ovr: 80, shirtNumber: 14 },
    { name: 'Felix Nmecha', position: 'CM', age: 25, nationality: 'ドイツ', ovr: 79, shirtNumber: 8 }
  ],

  rb_leipzig: [
    { name: 'Péter Gulácsi', position: 'GK', age: 36, nationality: 'ハンガリー', ovr: 82, shirtNumber: 1 },
    { name: 'Lutsharel Geertruida', position: 'RB', age: 26, nationality: 'オランダ', ovr: 82, shirtNumber: 3 },
    { name: 'Willi Orbán', position: 'CB', age: 33, nationality: 'ハンガリー', ovr: 83, shirtNumber: 4 },
    { name: 'Castello Lukeba', position: 'CB', age: 23, nationality: 'フランス', ovr: 82, shirtNumber: 23 },
    { name: 'David Raum', position: 'LB', age: 28, nationality: 'ドイツ', ovr: 82, shirtNumber: 22 },
    { name: 'Amadou Haidara', position: 'CDM', age: 28, nationality: 'マリ', ovr: 80, shirtNumber: 8 },
    { name: 'Arthur Vermeeren', position: 'CM', age: 21, nationality: 'ベルギー', ovr: 78, shirtNumber: 18 },
    { name: 'Xavi Simons', position: 'CAM', age: 23, nationality: 'オランダ', ovr: 86, shirtNumber: 10 },
    { name: 'Antonio Nusa', position: 'LW', age: 21, nationality: 'ノルウェー', ovr: 79, shirtNumber: 7 },
    { name: 'Loïs Openda', position: 'ST', age: 26, nationality: 'ベルギー', ovr: 85, shirtNumber: 11 },
    { name: 'Benjamin Šeško', position: 'ST', age: 23, nationality: 'スロベニア', ovr: 84, shirtNumber: 30 },
    { name: 'Christoph Baumgartner', position: 'CAM', age: 27, nationality: 'オーストリア', ovr: 81, shirtNumber: 14 }
  ],

  // ==========================================
  // SERIE A (2026/27 Season Official)
  // ==========================================
  milan: [
    { name: 'Mike Maignan', position: 'GK', age: 31, nationality: 'フランス', ovr: 87, shirtNumber: 16 },
    { name: 'Emerson Royal', position: 'RB', age: 27, nationality: 'ブラジル', ovr: 79, shirtNumber: 22 },
    { name: 'Fikayo Tomori', position: 'CB', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 23 },
    { name: 'Strahinja Pavlović', position: 'CB', age: 25, nationality: 'セルビア', ovr: 81, shirtNumber: 31 },
    { name: 'Theo Hernández', position: 'LB', age: 28, nationality: 'フランス', ovr: 87, shirtNumber: 19 },
    { name: 'Youssouf Fofana', position: 'CDM', age: 27, nationality: 'フランス', ovr: 82, shirtNumber: 29 },
    { name: 'Tijjani Reijnders', position: 'CM', age: 28, nationality: 'オランダ', ovr: 84, shirtNumber: 14 },
    { name: 'Ruben Loftus-Cheek', position: 'CAM', age: 30, nationality: 'イングランド', ovr: 81, shirtNumber: 8 },
    { name: 'Christian Pulisic', position: 'RW', age: 27, nationality: 'アメリカ', ovr: 84, shirtNumber: 11 },
    { name: 'Rafael Leão', position: 'LW', age: 27, nationality: 'ポルトガル', ovr: 87, shirtNumber: 10 },
    { name: 'Álvaro Morata', position: 'ST', age: 33, nationality: 'スペイン', ovr: 83, shirtNumber: 7 },
    { name: 'Tammy Abraham', position: 'ST', age: 28, nationality: 'イングランド', ovr: 79, shirtNumber: 90 },
    { name: 'Samuel Chukwueze', position: 'RW', age: 27, nationality: 'ナイジェリア', ovr: 80, shirtNumber: 21 }
  ],

  juventus: [
    { name: 'Michele Di Gregorio', position: 'GK', age: 29, nationality: 'イタリア', ovr: 83, shirtNumber: 29 },
    { name: 'Nicolò Savona', position: 'RB', age: 23, nationality: 'イタリア', ovr: 78, shirtNumber: 37 },
    { name: 'Bremer', position: 'CB', age: 29, nationality: 'ブラジル', ovr: 86, shirtNumber: 3 },
    { name: 'Federico Gatti', position: 'CB', age: 28, nationality: 'イタリア', ovr: 81, shirtNumber: 4 },
    { name: 'Andrea Cambiaso', position: 'LB', age: 26, nationality: 'イタリア', ovr: 83, shirtNumber: 27 },
    { name: 'Manuel Locatelli', position: 'CDM', age: 28, nationality: 'イタリア', ovr: 82, shirtNumber: 5 },
    { name: 'Khéphren Thuram', position: 'CM', age: 25, nationality: 'フランス', ovr: 81, shirtNumber: 19 },
    { name: 'Teun Koopmeiners', position: 'CAM', age: 28, nationality: 'オランダ', ovr: 85, shirtNumber: 8 },
    { name: 'Nicolás González', position: 'RW', age: 28, nationality: 'アルゼンチン', ovr: 82, shirtNumber: 11 },
    { name: 'Kenan Yıldız', position: 'LW', age: 21, nationality: 'トルコ', ovr: 81, shirtNumber: 10 },
    { name: 'Dušan Vlahović', position: 'ST', age: 26, nationality: 'セルビア', ovr: 85, shirtNumber: 9 },
    { name: 'Francisco Conceição', position: 'RW', age: 23, nationality: 'ポルトガル', ovr: 80, shirtNumber: 7 },
    { name: 'Douglas Luiz', position: 'CM', age: 28, nationality: 'ブラジル', ovr: 83, shirtNumber: 26 },
    { name: 'Weston McKennie', position: 'CM', age: 28, nationality: 'アメリカ', ovr: 80, shirtNumber: 16 }
  ],

  napoli: [
    { name: 'Alex Meret', position: 'GK', age: 29, nationality: 'イタリア', ovr: 82, shirtNumber: 1 },
    { name: 'Giovanni Di Lorenzo', position: 'RB', age: 33, nationality: 'イタリア', ovr: 83, shirtNumber: 22 },
    { name: 'Alessandro Buongiorno', position: 'CB', age: 27, nationality: 'イタリア', ovr: 84, shirtNumber: 4 },
    { name: 'Amir Rrahmani', position: 'CB', age: 32, nationality: 'コソボ', ovr: 81, shirtNumber: 13 },
    { name: 'Mathías Olivera', position: 'LB', age: 28, nationality: 'ウルグアイ', ovr: 80, shirtNumber: 17 },
    { name: 'Stanislav Lobotka', position: 'CDM', age: 31, nationality: 'スロバキア', ovr: 83, shirtNumber: 68 },
    { name: 'André-Frank Zambo Anguissa', position: 'CM', age: 30, nationality: 'カメルーン', ovr: 82, shirtNumber: 99 },
    { name: 'Scott McTominay', position: 'CM', age: 29, nationality: 'スコットランド', ovr: 83, shirtNumber: 8 },
    { name: 'Matteo Politano', position: 'RW', age: 33, nationality: 'イタリア', ovr: 81, shirtNumber: 21 },
    { name: 'Khvicha Kvaratskhelia', position: 'LW', age: 25, nationality: 'ジョージア', ovr: 87, shirtNumber: 77 },
    { name: 'Romelu Lukaku', position: 'ST', age: 33, nationality: 'ベルギー', ovr: 84, shirtNumber: 11 },
    { name: 'David Neres', position: 'RW', age: 29, nationality: 'ブラジル', ovr: 81, shirtNumber: 7 },
    { name: 'Giacomo Raspadori', position: 'CF', age: 26, nationality: 'イタリア', ovr: 80, shirtNumber: 81 }
  ],

  parma: [
    { name: '鈴木 彩艶', position: 'GK', age: 23, nationality: '日本', ovr: 78, shirtNumber: 31, playstyle: 'ビルドアップ型GK', preferredFoot: '右' },
    { name: 'Enrico Delprato', position: 'CB', age: 26, nationality: 'イタリア', ovr: 75, shirtNumber: 15, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Alessandro Circati', position: 'CB', age: 22, nationality: 'オーストラリア', ovr: 74, shirtNumber: 39, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Emanuele Valeri', position: 'LB', age: 27, nationality: 'イタリア', ovr: 74, shirtNumber: 14, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Woyo Coulibaly', position: 'RB', age: 26, nationality: 'フランス', ovr: 73, shirtNumber: 26, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Adrián Bernabé', position: 'CM', age: 24, nationality: 'スペイン', ovr: 77, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Simon Sohm', position: 'CM', age: 25, nationality: 'スイス', ovr: 75, shirtNumber: 19, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Nahuel Estévez', position: 'CDM', age: 30, nationality: 'アルゼンチン', ovr: 74, shirtNumber: 8, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Dennis Man', position: 'RW', age: 27, nationality: 'ルーマニア', ovr: 77, shirtNumber: 98, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Valentin Mihăilă', position: 'LW', age: 26, nationality: 'ルーマニア', ovr: 75, shirtNumber: 28, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Ange-Yoan Bonny', position: 'ST', age: 22, nationality: 'フランス', ovr: 76, shirtNumber: 13, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Hernani', position: 'CM', age: 31, nationality: 'ブラジル', ovr: 74, shirtNumber: 27, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Matteo Cancellieri', position: 'RW', age: 24, nationality: 'イタリア', ovr: 74, shirtNumber: 22, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Leandro Chichizola', position: 'GK', age: 35, nationality: 'アルゼンチン', ovr: 72, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' }
  ],

  // ==========================================
  // LIGUE 1 (2026/27 Season Official)
  // ==========================================
  monaco: [
    { name: 'Philipp Köhn', position: 'GK', age: 28, nationality: 'スイス', ovr: 79, shirtNumber: 16 },
    { name: 'Vanderson', position: 'RB', age: 25, nationality: 'ブラジル', ovr: 81, shirtNumber: 2 },
    { name: 'Thilo Kehrer', position: 'CB', age: 29, nationality: 'ドイツ', ovr: 81, shirtNumber: 5 },
    { name: 'Wilfried Singo', position: 'CB', age: 25, nationality: 'コートジボワール', ovr: 81, shirtNumber: 17 },
    { name: 'Caio Henrique', position: 'LB', age: 29, nationality: 'ブラジル', ovr: 81, shirtNumber: 12 },
    { name: 'Denis Zakaria', position: 'CDM', age: 29, nationality: 'スイス', ovr: 83, shirtNumber: 6 },
    { name: 'Lamine Camara', position: 'CM', age: 22, nationality: 'セネガル', ovr: 79, shirtNumber: 15 },
    { name: 'Maghnes Akliouche', position: 'CAM', age: 24, nationality: 'フランス', ovr: 81, shirtNumber: 11 },
    { name: 'Eliesse Ben Seghir', position: 'LW', age: 21, nationality: 'モロッコ', ovr: 80, shirtNumber: 7 },
    { name: 'Aleksandr Golovin', position: 'CAM', age: 30, nationality: 'ロシア', ovr: 83, shirtNumber: 10 },
    { name: 'Breel Embolo', position: 'ST', age: 29, nationality: 'スイス', ovr: 81, shirtNumber: 36 },
    { name: 'Folarin Balogun', position: 'ST', age: 25, nationality: 'アメリカ', ovr: 80, shirtNumber: 9 },
    { name: '南野 拓実 (Takumi Minamino)', position: 'CAM', age: 31, nationality: '日本', ovr: 81, shirtNumber: 18 }
  ],

  marseille: [
    { name: 'Gerónimo Rulli', position: 'GK', age: 34, nationality: 'アルゼンチン', ovr: 81, shirtNumber: 1 },
    { name: 'Michael Murillo', position: 'RB', age: 30, nationality: 'パナマ', ovr: 78, shirtNumber: 62 },
    { name: 'Leonardo Balerdi', position: 'CB', age: 27, nationality: 'アルゼンチン', ovr: 82, shirtNumber: 5 },
    { name: 'Derek Cornelius', position: 'CB', age: 28, nationality: 'カナダ', ovr: 77, shirtNumber: 13 },
    { name: 'Quentin Merlin', position: 'LB', age: 24, nationality: 'フランス', ovr: 78, shirtNumber: 3 },
    { name: 'Pierre-Emile Højbjerg', position: 'CDM', age: 31, nationality: 'デンマーク', ovr: 83, shirtNumber: 23 },
    { name: 'Adrien Rabiot', position: 'CM', age: 31, nationality: 'フランス', ovr: 84, shirtNumber: 25 },
    { name: 'Valentin Rongier', position: 'CM', age: 31, nationality: 'フランス', ovr: 80, shirtNumber: 21 },
    { name: 'Mason Greenwood', position: 'RW', age: 24, nationality: 'イングランド', ovr: 84, shirtNumber: 10 },
    { name: 'Luis Henrique', position: 'LW', age: 24, nationality: 'ブラジル', ovr: 79, shirtNumber: 44 },
    { name: 'Elye Wahi', position: 'ST', age: 23, nationality: 'フランス', ovr: 81, shirtNumber: 9 },
    { name: 'Amine Harit', position: 'CAM', age: 29, nationality: 'モロッコ', ovr: 79, shirtNumber: 11 },
    { name: 'Neal Maupay', position: 'ST', age: 30, nationality: 'フランス', ovr: 78, shirtNumber: 8 }
  ]
};
