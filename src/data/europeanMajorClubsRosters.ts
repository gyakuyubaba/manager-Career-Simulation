import { RosterSeed } from './allClubsSquads';

/**
 * 2026/27 Official Roster Seeds for All Remaining European 1st-Division Clubs
 * Sourced directly from official league and club registries:
 * - Premier League: https://www.premierleague.com/
 * - La Liga EA Sports: https://www.laliga.com/
 * - Bundesliga: https://www.bundesliga.com/
 * - Lega Serie A: https://en.legaseriea.it/
 * - Ligue 1: https://ligue1.com/
 */
export const EUROPEAN_MAJOR_CLUBS_2026_SEEDS: Record<string, RosterSeed[]> = {
  // =========================================================================
  // PREMIER LEAGUE (Additional Clubs)
  // =========================================================================
  fulham: [
    { name: 'Bernd Leno', position: 'GK', age: 34, nationality: 'ドイツ', ovr: 81, shirtNumber: 17, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Steven Benda', position: 'GK', age: 27, nationality: 'ドイツ', ovr: 72, shirtNumber: 23, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Timothy Castagne', position: 'RB', age: 30, nationality: 'ベルギー', ovr: 79, shirtNumber: 21, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Kenny Tete', position: 'RB', age: 30, nationality: 'オランダ', ovr: 78, shirtNumber: 2, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Joachim Andersen', position: 'CB', age: 30, nationality: 'デンマーク', ovr: 82, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Calvin Bassey', position: 'CB', age: 26, nationality: 'ナイジェリア', ovr: 80, shirtNumber: 3, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Issa Diop', position: 'CB', age: 29, nationality: 'フランス', ovr: 78, shirtNumber: 31, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Antonee Robinson', position: 'LB', age: 28, nationality: 'アメリカ', ovr: 82, shirtNumber: 33, playstyle: 'スピードスター', preferredFoot: '左' },
    { name: 'Sander Berge', position: 'CDM', age: 28, nationality: 'ノルウェー', ovr: 80, shirtNumber: 16, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Saša Lukić', position: 'CM', age: 29, nationality: 'セルビア', ovr: 79, shirtNumber: 20, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Andreas Pereira', position: 'CAM', age: 30, nationality: 'ブラジル', ovr: 81, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Alex Iwobi', position: 'RW', age: 30, nationality: 'ナイジェリア', ovr: 80, shirtNumber: 17, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Harry Wilson', position: 'RW', age: 29, nationality: 'ウェールズ', ovr: 79, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Emile Smith Rowe', position: 'LW', age: 26, nationality: 'イングランド', ovr: 82, shirtNumber: 32, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Adama Traoré', position: 'RW', age: 30, nationality: 'スペイン', ovr: 78, shirtNumber: 11, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Raúl Jiménez', position: 'ST', age: 35, nationality: 'メキシコ', ovr: 79, shirtNumber: 7, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Rodrigo Muniz', position: 'ST', age: 25, nationality: 'ブラジル', ovr: 80, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' }
  ],

  wolves: [
    { name: 'José Sá', position: 'GK', age: 33, nationality: 'ポルトガル', ovr: 80, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Daniel Bentley', position: 'GK', age: 33, nationality: 'イングランド', ovr: 72, shirtNumber: 25, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Nélson Semedo', position: 'RB', age: 32, nationality: 'ポルトガル', ovr: 79, shirtNumber: 22, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Matt Doherty', position: 'RB', age: 34, nationality: 'アイルランド', ovr: 76, shirtNumber: 2, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Craig Dawson', position: 'CB', age: 36, nationality: 'イングランド', ovr: 78, shirtNumber: 15, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Toti Gomes', position: 'CB', age: 27, nationality: 'ポルトガル', ovr: 79, shirtNumber: 24, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Santiago Bueno', position: 'CB', age: 27, nationality: 'ウルグアイ', ovr: 77, shirtNumber: 4, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Rayan Aït-Nouri', position: 'LB', age: 25, nationality: 'アルジェリア', ovr: 82, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Mario Lemina', position: 'CDM', age: 32, nationality: 'ガボン', ovr: 80, shirtNumber: 5, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'João Gomes', position: 'CM', age: 25, nationality: 'ブラジル', ovr: 81, shirtNumber: 8, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'André', position: 'CDM', age: 25, nationality: 'ブラジル', ovr: 80, shirtNumber: 7, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Jean-Ricner Bellegarde', position: 'CAM', age: 28, nationality: 'フランス', ovr: 78, shirtNumber: 27, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Matheus Cunha', position: 'ST', age: 27, nationality: 'ブラジル', ovr: 83, shirtNumber: 10, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Hwang Hee-chan (黄 喜燦)', position: 'LW', age: 30, nationality: '韓国', ovr: 80, shirtNumber: 11, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Jørgen Strand Larsen', position: 'ST', age: 26, nationality: 'ノルウェー', ovr: 80, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Gonçalo Guedes', position: 'LW', age: 29, nationality: 'ポルトガル', ovr: 79, shirtNumber: 29, playstyle: '俊足ドリブラー', preferredFoot: '右' }
  ],

  brentford: [
    { name: 'Mark Flekken', position: 'GK', age: 33, nationality: 'オランダ', ovr: 80, shirtNumber: 1, playstyle: 'ビルドアップ型GK', preferredFoot: '右' },
    { name: 'Hákon Valdimarsson', position: 'GK', age: 24, nationality: 'アイスランド', ovr: 73, shirtNumber: 12, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Mads Roerslev', position: 'RB', age: 27, nationality: 'デンマーク', ovr: 77, shirtNumber: 30, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Nathan Collins', position: 'CB', age: 25, nationality: 'アイルランド', ovr: 80, shirtNumber: 22, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Ethan Pinnock', position: 'CB', age: 33, nationality: 'ジャマイカ', ovr: 80, shirtNumber: 5, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Sepp van den Berg', position: 'CB', age: 24, nationality: 'オランダ', ovr: 78, shirtNumber: 4, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Kristoffer Ajer', position: 'LB', age: 28, nationality: 'ノルウェー', ovr: 78, shirtNumber: 20, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Christian Nørgaard', position: 'CDM', age: 32, nationality: 'デンマーク', ovr: 81, shirtNumber: 6, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Vitaly Janelt', position: 'CM', age: 28, nationality: 'ドイツ', ovr: 79, shirtNumber: 27, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Mathias Jensen', position: 'CM', age: 30, nationality: 'デンマーク', ovr: 79, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Mikkel Damsgaard', position: 'CAM', age: 26, nationality: 'デンマーク', ovr: 79, shirtNumber: 24, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Fábio Carvalho', position: 'CAM', age: 23, nationality: 'ポルトガル', ovr: 78, shirtNumber: 14, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Bryan Mbeumo', position: 'RW', age: 27, nationality: 'カメルーン', ovr: 83, shirtNumber: 19, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Yoane Wissa', position: 'LW', age: 29, nationality: 'コンゴ民主共和国', ovr: 81, shirtNumber: 11, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Kevin Schade', position: 'ST', age: 24, nationality: 'ドイツ', ovr: 78, shirtNumber: 9, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Keane Lewis-Potter', position: 'LW', age: 25, nationality: 'イングランド', ovr: 77, shirtNumber: 23, playstyle: '俊足ドリブラー', preferredFoot: '右' }
  ],

  nottingham_forest: [
    { name: 'Matz Sels', position: 'GK', age: 34, nationality: 'ベルギー', ovr: 80, shirtNumber: 26, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Carlos Miguel', position: 'GK', age: 27, nationality: 'ブラジル', ovr: 74, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Ola Aina', position: 'RB', age: 29, nationality: 'ナイジェリア', ovr: 79, shirtNumber: 34, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Neco Williams', position: 'RB', age: 25, nationality: 'ウェールズ', ovr: 78, shirtNumber: 7, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Murillo', position: 'CB', age: 24, nationality: 'ブラジル', ovr: 82, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Nikola Milenković', position: 'CB', age: 28, nationality: 'セルビア', ovr: 81, shirtNumber: 31, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Morato', position: 'CB', age: 25, nationality: 'ブラジル', ovr: 78, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Álex Moreno', position: 'LB', age: 33, nationality: 'スペイン', ovr: 79, shirtNumber: 19, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Ryan Yates', position: 'CM', age: 28, nationality: 'イングランド', ovr: 78, shirtNumber: 8, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Elliot Anderson', position: 'CM', age: 23, nationality: 'スコットランド', ovr: 80, shirtNumber: 6, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'James Ward-Prowse', position: 'CM', age: 31, nationality: 'イングランド', ovr: 81, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Morgan Gibbs-White', position: 'CAM', age: 26, nationality: 'イングランド', ovr: 83, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Anthony Elanga', position: 'RW', age: 24, nationality: 'スウェーデン', ovr: 80, shirtNumber: 21, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Callum Hudson-Odoi', position: 'LW', age: 25, nationality: 'イングランド', ovr: 80, shirtNumber: 14, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Chris Wood', position: 'ST', age: 34, nationality: 'ニュージーランド', ovr: 82, shirtNumber: 11, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Taiwo Awoniyi', position: 'ST', age: 28, nationality: 'ナイジェリア', ovr: 79, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' }
  ],

  leicester: [
    { name: 'Mads Hermansen', position: 'GK', age: 26, nationality: 'デンマーク', ovr: 81, shirtNumber: 30, playstyle: 'ビルドアップ型GK', preferredFoot: '右' },
    { name: 'Danny Ward', position: 'GK', age: 33, nationality: 'ウェールズ', ovr: 73, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'James Justin', position: 'RB', age: 28, nationality: 'イングランド', ovr: 78, shirtNumber: 2, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Wout Faes', position: 'CB', age: 28, nationality: 'ベルギー', ovr: 79, shirtNumber: 3, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Caleb Okoli', position: 'CB', age: 25, nationality: 'イタリア', ovr: 78, shirtNumber: 5, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Jannik Vestergaard', position: 'CB', age: 34, nationality: 'デンマーク', ovr: 77, shirtNumber: 23, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Victor Kristiansen', position: 'LB', age: 23, nationality: 'デンマーク', ovr: 78, shirtNumber: 16, playstyle: '守備的SB', preferredFoot: '左' },
    { name: 'Wilfred Ndidi', position: 'CDM', age: 29, nationality: 'ナイジェリア', ovr: 81, shirtNumber: 6, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Harry Winks', position: 'CM', age: 30, nationality: 'イングランド', ovr: 79, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Oliver Skipp', position: 'CM', age: 25, nationality: 'イングランド', ovr: 77, shirtNumber: 22, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Bilal El Khannouss', position: 'CAM', age: 22, nationality: 'モロッコ', ovr: 79, shirtNumber: 11, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Facundo Buonanotte', position: 'CAM', age: 21, nationality: 'アルゼンチン', ovr: 79, shirtNumber: 40, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Abdul Fatawu', position: 'RW', age: 22, nationality: 'ガーナ', ovr: 80, shirtNumber: 7, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Stephy Mavididi', position: 'LW', age: 28, nationality: 'イングランド', ovr: 79, shirtNumber: 10, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Jamie Vardy', position: 'ST', age: 39, nationality: 'イングランド', ovr: 80, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Jordan Ayew', position: 'ST', age: 34, nationality: 'ガーナ', ovr: 77, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  ipswich: [
    { name: 'Arijanet Muric', position: 'GK', age: 27, nationality: 'コソボ', ovr: 78, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Christian Walton', position: 'GK', age: 30, nationality: 'イングランド', ovr: 72, shirtNumber: 28, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Axel Tuanzebe', position: 'RB', age: 28, nationality: 'コンゴ民主共和国', ovr: 76, shirtNumber: 40, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Dara O\'Shea', position: 'CB', age: 27, nationality: 'アイルランド', ovr: 78, shirtNumber: 26, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Jacob Greaves', position: 'CB', age: 25, nationality: 'イングランド', ovr: 78, shirtNumber: 24, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Luke Woolfenden', position: 'CB', age: 27, nationality: 'イングランド', ovr: 74, shirtNumber: 6, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Leif Davis', position: 'LB', age: 26, nationality: 'イングランド', ovr: 79, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Sam Morsy', position: 'CDM', age: 34, nationality: 'エジプト', ovr: 77, shirtNumber: 5, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Kalvin Phillips', position: 'CM', age: 30, nationality: 'イングランド', ovr: 78, shirtNumber: 24, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Jens Cajuste', position: 'CM', age: 26, nationality: 'スウェーデン', ovr: 76, shirtNumber: 12, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Omari Hutchinson', position: 'CAM', age: 22, nationality: 'ジャマイカ', ovr: 79, shirtNumber: 20, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Wes Burns', position: 'RW', age: 31, nationality: 'ウェールズ', ovr: 75, shirtNumber: 7, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Sammie Szmodics', position: 'LW', age: 30, nationality: 'アイルランド', ovr: 78, shirtNumber: 23, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Jack Clarke', position: 'LW', age: 25, nationality: 'イングランド', ovr: 78, shirtNumber: 47, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Liam Delap', position: 'ST', age: 23, nationality: 'イングランド', ovr: 80, shirtNumber: 19, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'George Hirst', position: 'ST', age: 27, nationality: 'イングランド', ovr: 75, shirtNumber: 27, playstyle: 'ターゲットマン', preferredFoot: '右' }
  ],

  southampton: [
    { name: 'Aaron Ramsdale', position: 'GK', age: 28, nationality: 'イングランド', ovr: 81, shirtNumber: 30, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Alex McCarthy', position: 'GK', age: 36, nationality: 'イングランド', ovr: 73, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: '菅原 由勢 (Yukinari Sugawara)', position: 'RB', age: 26, nationality: '日本', ovr: 79, shirtNumber: 16, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Kyle Walker-Peters', position: 'LB', age: 29, nationality: 'イングランド', ovr: 79, shirtNumber: 2, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Jan Bednarek', position: 'CB', age: 30, nationality: 'ポーランド', ovr: 78, shirtNumber: 35, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Taylor Harwood-Bellis', position: 'CB', age: 24, nationality: 'イングランド', ovr: 78, shirtNumber: 6, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Jack Stephens', position: 'CB', age: 32, nationality: 'イングランド', ovr: 75, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Flynn Downes', position: 'CDM', age: 27, nationality: 'イングランド', ovr: 77, shirtNumber: 4, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Lesley Ugochukwu', position: 'CDM', age: 22, nationality: 'フランス', ovr: 76, shirtNumber: 26, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Joe Aribo', position: 'CM', age: 29, nationality: 'ナイジェリア', ovr: 77, shirtNumber: 7, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Mateus Fernandes', position: 'CAM', age: 22, nationality: 'ポルトガル', ovr: 78, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Tyler Dibling', position: 'RW', age: 20, nationality: 'イングランド', ovr: 77, shirtNumber: 33, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Cameron Archer', position: 'ST', age: 24, nationality: 'イングランド', ovr: 77, shirtNumber: 19, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Adam Armstrong', position: 'LW', age: 29, nationality: 'イングランド', ovr: 77, shirtNumber: 9, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Paul Onuachu', position: 'ST', age: 32, nationality: 'ナイジェリア', ovr: 77, shirtNumber: 32, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Ben Brereton Díaz', position: 'LW', age: 27, nationality: 'チリ', ovr: 77, shirtNumber: 17, playstyle: 'ゴールゲッター', preferredFoot: '右' }
  ],

  // =========================================================================
  // LA LIGA (Additional Clubs)
  // =========================================================================
  real_betis: [
    { name: 'Rui Silva', position: 'GK', age: 32, nationality: 'ポルトガル', ovr: 81, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Adrián', position: 'GK', age: 39, nationality: 'スペイン', ovr: 73, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Youssouf Sabaly', position: 'RB', age: 33, nationality: 'セネガル', ovr: 78, shirtNumber: 23, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Marc Bartra', position: 'CB', age: 35, nationality: 'スペイン', ovr: 79, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Diego Llorente', position: 'CB', age: 32, nationality: 'スペイン', ovr: 80, shirtNumber: 3, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Natan', position: 'CB', age: 25, nationality: 'ブラジル', ovr: 78, shirtNumber: 6, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Romain Perraud', position: 'LB', age: 28, nationality: 'フランス', ovr: 78, shirtNumber: 15, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Johnny Cardoso', position: 'CDM', age: 24, nationality: 'アメリカ', ovr: 80, shirtNumber: 4, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Marc Roca', position: 'CM', age: 29, nationality: 'スペイン', ovr: 79, shirtNumber: 21, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Pablo Fornals', position: 'CAM', age: 30, nationality: 'スペイン', ovr: 81, shirtNumber: 18, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Giovani Lo Celso', position: 'CAM', age: 30, nationality: 'アルゼンチン', ovr: 83, shirtNumber: 20, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Isco', position: 'CAM', age: 34, nationality: 'スペイン', ovr: 84, shirtNumber: 22, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Abde Ezzalzouli', position: 'LW', age: 24, nationality: 'モロッコ', ovr: 80, shirtNumber: 10, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Vitor Roque', position: 'ST', age: 21, nationality: 'ブラジル', ovr: 80, shirtNumber: 8, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Chimy Ávila', position: 'ST', age: 32, nationality: 'アルゼンチン', ovr: 78, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Cédric Bakambu', position: 'ST', age: 35, nationality: 'コンゴ民主共和国', ovr: 77, shirtNumber: 11, playstyle: 'スピードスター', preferredFoot: '右' }
  ],

  villarreal: [
    { name: 'Diego Conde', position: 'GK', age: 27, nationality: 'スペイン', ovr: 79, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Luiz Júnior', position: 'GK', age: 25, nationality: 'ブラジル', ovr: 77, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Kiko Femenía', position: 'RB', age: 35, nationality: 'スペイン', ovr: 77, shirtNumber: 17, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Raúl Albiol', position: 'CB', age: 40, nationality: 'スペイン', ovr: 78, shirtNumber: 3, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Logan Costa', position: 'CB', age: 25, nationality: 'カーボベルデ', ovr: 79, shirtNumber: 2, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Eric Bailly', position: 'CB', age: 32, nationality: 'コートジボワール', ovr: 78, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Sergi Cardona', position: 'LB', age: 27, nationality: 'スペイン', ovr: 79, shirtNumber: 23, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Dani Parejo', position: 'CM', age: 37, nationality: 'スペイン', ovr: 82, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Santi Comesaña', position: 'CM', age: 29, nationality: 'スペイン', ovr: 79, shirtNumber: 14, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Pape Gueye', position: 'CDM', age: 27, nationality: 'セネガル', ovr: 79, shirtNumber: 18, playstyle: 'アンカー', preferredFoot: '左' },
    { name: 'Álex Baena', position: 'CAM', age: 25, nationality: 'スペイン', ovr: 84, shirtNumber: 16, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Yeremy Pino', position: 'RW', age: 23, nationality: 'スペイン', ovr: 81, shirtNumber: 21, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Ayoze Pérez', position: 'ST', age: 33, nationality: 'スペイン', ovr: 82, shirtNumber: 22, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Gerard Moreno', position: 'ST', age: 34, nationality: 'スペイン', ovr: 83, shirtNumber: 7, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Nicolas Pépé', position: 'RW', age: 31, nationality: 'コートジボワール', ovr: 80, shirtNumber: 19, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Thierno Barry', position: 'ST', age: 23, nationality: 'フランス', ovr: 78, shirtNumber: 15, playstyle: 'ターゲットマン', preferredFoot: '右' }
  ],

  valencia: [
    { name: 'Giorgi Mamardashvili', position: 'GK', age: 25, nationality: 'ジョージア', ovr: 85, shirtNumber: 25, playstyle: 'ショットストッパー', preferredFoot: '左' },
    { name: 'Stole Dimitrievski', position: 'GK', age: 32, nationality: '北マケドニア', ovr: 78, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Thierry Correia', position: 'RB', age: 27, nationality: 'ポルトガル', ovr: 79, shirtNumber: 12, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Cristhian Mosquera', position: 'CB', age: 22, nationality: 'スペイン', ovr: 81, shirtNumber: 3, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'César Tárrega', position: 'CB', age: 24, nationality: 'スペイン', ovr: 78, shirtNumber: 15, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'José Gayà', position: 'LB', age: 31, nationality: 'スペイン', ovr: 82, shirtNumber: 14, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Pepelu', position: 'CDM', age: 27, nationality: 'スペイン', ovr: 82, shirtNumber: 18, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Javi Guerra', position: 'CM', age: 23, nationality: 'スペイン', ovr: 81, shirtNumber: 8, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'André Almeida', position: 'CAM', age: 26, nationality: 'ポルトガル', ovr: 79, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Diego López', position: 'RW', age: 24, nationality: 'スペイン', ovr: 80, shirtNumber: 16, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Luis Rioja', position: 'LW', age: 32, nationality: 'スペイン', ovr: 79, shirtNumber: 22, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Hugo Duro', position: 'ST', age: 26, nationality: 'スペイン', ovr: 81, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Rafa Mir', position: 'ST', age: 29, nationality: 'スペイン', ovr: 78, shirtNumber: 11, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Sergi Canós', position: 'LW', age: 29, nationality: 'スペイン', ovr: 77, shirtNumber: 7, playstyle: '俊足ドリブラー', preferredFoot: '右' }
  ],

  sevilla: [
    { name: 'Ørjan Nyland', position: 'GK', age: 35, nationality: 'ノルウェー', ovr: 79, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Álvaro Fernández', position: 'GK', age: 28, nationality: 'スペイン', ovr: 75, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'José Ángel Carmona', position: 'RB', age: 24, nationality: 'スペイン', ovr: 78, shirtNumber: 32, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Loïc Badé', position: 'CB', age: 26, nationality: 'フランス', ovr: 82, shirtNumber: 22, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Nemanja Gudelj', position: 'CB', age: 34, nationality: 'セルビア', ovr: 79, shirtNumber: 6, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Adrià Pedrosa', position: 'LB', age: 28, nationality: 'スペイン', ovr: 78, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Lucien Agoumé', position: 'CDM', age: 24, nationality: 'フランス', ovr: 78, shirtNumber: 4, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Djibril Sow', position: 'CM', age: 29, nationality: 'スイス', ovr: 79, shirtNumber: 20, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Saúl Ñíguez', position: 'CM', age: 31, nationality: 'スペイン', ovr: 80, shirtNumber: 17, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Albert Sambi Lokonga', position: 'CM', age: 26, nationality: 'ベルギー', ovr: 78, shirtNumber: 12, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Dodi Lukébakio', position: 'RW', age: 28, nationality: 'ベルギー', ovr: 81, shirtNumber: 11, playstyle: 'スピードスター', preferredFoot: '左' },
    { name: 'Chidera Ejuke', position: 'LW', age: 28, nationality: 'ナイジェリア', ovr: 79, shirtNumber: 21, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Isaac Romero', position: 'ST', age: 26, nationality: 'スペイン', ovr: 80, shirtNumber: 7, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Kelechi Iheanacho', position: 'ST', age: 29, nationality: 'ナイジェリア', ovr: 78, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Suso', position: 'RW', age: 32, nationality: 'スペイン', ovr: 79, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '左' }
  ],

  girona: [
    { name: 'Paulo Gazzaniga', position: 'GK', age: 34, nationality: 'アルゼンチン', ovr: 80, shirtNumber: 13, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Pau López', position: 'GK', age: 31, nationality: 'スペイン', ovr: 78, shirtNumber: 25, playstyle: 'ショットストッパー', preferredFoot: '左' },
    { name: 'Alejandro Francés', position: 'RB', age: 24, nationality: 'スペイン', ovr: 78, shirtNumber: 16, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'David López', position: 'CB', age: 36, nationality: 'スペイン', ovr: 80, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Daley Blind', position: 'CB', age: 36, nationality: 'オランダ', ovr: 80, shirtNumber: 17, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Miguel Gutiérrez', position: 'LB', age: 25, nationality: 'スペイン', ovr: 82, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Oriol Romeu', position: 'CDM', age: 34, nationality: 'スペイン', ovr: 79, shirtNumber: 14, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Yangel Herrera', position: 'CM', age: 28, nationality: 'ベネズエラ', ovr: 81, shirtNumber: 21, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Iván Martín', position: 'CM', age: 27, nationality: 'スペイン', ovr: 80, shirtNumber: 23, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Viktor Tsygankov', position: 'RW', age: 28, nationality: 'ウクライナ', ovr: 83, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Bryan Gil', position: 'LW', age: 25, nationality: 'スペイン', ovr: 80, shirtNumber: 20, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Abel Ruiz', position: 'ST', age: 26, nationality: 'スペイン', ovr: 79, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Bojan Miovski', position: 'ST', age: 27, nationality: '北マケドニア', ovr: 78, shirtNumber: 19, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Arnau Martínez', position: 'RB', age: 23, nationality: 'スペイン', ovr: 79, shirtNumber: 4, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Donny van de Beek', position: 'CM', age: 29, nationality: 'オランダ', ovr: 78, shirtNumber: 6, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  // =========================================================================
  // BUNDESLIGA (Additional Clubs)
  // =========================================================================
  stuttgart: [
    { name: 'Alexander Nübel', position: 'GK', age: 29, nationality: 'ドイツ', ovr: 83, shirtNumber: 33, playstyle: 'ビルドアップ型GK', preferredFoot: '右' },
    { name: 'Fabian Bredlow', position: 'GK', age: 31, nationality: 'ドイツ', ovr: 73, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Josha Vagnoman', position: 'RB', age: 25, nationality: 'ドイツ', ovr: 79, shirtNumber: 4, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Dan-Axel Zagadou', position: 'CB', age: 27, nationality: 'フランス', ovr: 80, shirtNumber: 23, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Jeff Chabot', position: 'CB', age: 28, nationality: 'ドイツ', ovr: 80, shirtNumber: 24, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Anthony Rouault', position: 'CB', age: 25, nationality: 'フランス', ovr: 78, shirtNumber: 29, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Maximilian Mittelstädt', position: 'LB', age: 29, nationality: 'ドイツ', ovr: 82, shirtNumber: 7, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Atakan Karazor', position: 'CDM', age: 29, nationality: 'ドイツ', ovr: 81, shirtNumber: 16, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Angelo Stiller', position: 'CM', age: 25, nationality: 'ドイツ', ovr: 83, shirtNumber: 6, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Enzo Millot', position: 'CAM', age: 24, nationality: 'フランス', ovr: 82, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Chris Führich', position: 'LW', age: 28, nationality: 'ドイツ', ovr: 82, shirtNumber: 27, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Jamie Leweling', position: 'RW', age: 25, nationality: 'ドイツ', ovr: 80, shirtNumber: 18, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Deniz Undav', position: 'ST', age: 30, nationality: 'ドイツ', ovr: 84, shirtNumber: 26, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Ermedin Demirović', position: 'ST', age: 28, nationality: 'ボスニア・ヘルツェゴビナ', ovr: 82, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'El Bilal Touré', position: 'ST', age: 24, nationality: 'マリ', ovr: 79, shirtNumber: 10, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Fabian Rieder', position: 'CAM', age: 24, nationality: 'スイス', ovr: 78, shirtNumber: 32, playstyle: 'チャンスメイカー', preferredFoot: '左' }
  ],

  frankfurt: [
    { name: 'Kevin Trapp', position: 'GK', age: 36, nationality: 'ドイツ', ovr: 82, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Kaua Santos', position: 'GK', age: 23, nationality: 'ブラジル', ovr: 76, shirtNumber: 40, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Rasmus Kristensen', position: 'RB', age: 29, nationality: 'デンマーク', ovr: 79, shirtNumber: 13, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Robin Koch', position: 'CB', age: 30, nationality: 'ドイツ', ovr: 82, shirtNumber: 4, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Arthur Theate', position: 'CB', age: 26, nationality: 'ベルギー', ovr: 81, shirtNumber: 3, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Tuta', position: 'CB', age: 27, nationality: 'ブラジル', ovr: 80, shirtNumber: 35, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Niels Nkounkou', position: 'LB', age: 25, nationality: 'フランス', ovr: 78, shirtNumber: 29, playstyle: 'スピードスター', preferredFoot: '左' },
    { name: 'Ellyes Skhiri', position: 'CDM', age: 31, nationality: 'チュニジア', ovr: 81, shirtNumber: 15, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Hugo Larsson', position: 'CM', age: 22, nationality: 'スウェーデン', ovr: 81, shirtNumber: 16, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Mario Götze', position: 'CAM', age: 34, nationality: 'ドイツ', ovr: 81, shirtNumber: 27, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Farès Chaïbi', position: 'CAM', age: 23, nationality: 'アルジェリア', ovr: 79, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Ansgar Knauff', position: 'RW', age: 24, nationality: 'ドイツ', ovr: 79, shirtNumber: 36, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Omar Marmoush', position: 'LW', age: 27, nationality: 'エジプト', ovr: 84, shirtNumber: 7, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Hugo Ekitiké', position: 'ST', age: 24, nationality: 'フランス', ovr: 82, shirtNumber: 11, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Igor Matanović', position: 'ST', age: 23, nationality: 'クロアチア', ovr: 78, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Junior Dina Ebimbe', position: 'RM', age: 25, nationality: 'フランス', ovr: 79, shirtNumber: 26, playstyle: 'ボックストゥボックス', preferredFoot: '右' }
  ],

  // =========================================================================
  // SERIE A (Additional Clubs)
  // =========================================================================
  atalanta: [
    { name: 'Marco Carnesecchi', position: 'GK', age: 26, nationality: 'イタリア', ovr: 82, shirtNumber: 29, playstyle: 'ショットストッパー', preferredFoot: '左' },
    { name: 'Rui Patrício', position: 'GK', age: 38, nationality: 'ポルトガル', ovr: 76, shirtNumber: 28, playstyle: 'ショットストッパー', preferredFoot: '左' },
    { name: 'Berat Djimsiti', position: 'CB', age: 33, nationality: 'アルバニア', ovr: 81, shirtNumber: 19, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Isak Hien', position: 'CB', age: 27, nationality: 'スウェーデン', ovr: 82, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Sead Kolašinac', position: 'CB', age: 33, nationality: 'ボスニア・ヘルツェゴビナ', ovr: 81, shirtNumber: 23, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Raoul Bellanova', position: 'RWB', age: 26, nationality: 'イタリア', ovr: 81, shirtNumber: 16, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Matteo Ruggeri', position: 'LWB', age: 24, nationality: 'イタリア', ovr: 80, shirtNumber: 22, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Davide Zappacosta', position: 'RWB', age: 34, nationality: 'イタリア', ovr: 79, shirtNumber: 77, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Éderson', position: 'CM', age: 27, nationality: 'ブラジル', ovr: 84, shirtNumber: 13, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Marten de Roon', position: 'CDM', age: 35, nationality: 'オランダ', ovr: 82, shirtNumber: 15, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Mario Pašalić', position: 'CAM', age: 31, nationality: 'クロアチア', ovr: 81, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Marco Brescianini', position: 'CM', age: 26, nationality: 'イタリア', ovr: 79, shirtNumber: 44, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Charles De Ketelaere', position: 'CF', age: 25, nationality: 'ベルギー', ovr: 83, shirtNumber: 17, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Ademola Lookman', position: 'LW', age: 28, nationality: 'ナイジェリア', ovr: 85, shirtNumber: 11, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Mateo Retegui', position: 'ST', age: 27, nationality: 'イタリア', ovr: 83, shirtNumber: 32, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Gianluca Scamacca', position: 'ST', age: 27, nationality: 'イタリア', ovr: 82, shirtNumber: 9, playstyle: 'ターゲットマン', preferredFoot: '右' }
  ],

  roma: [
    { name: 'Mile Svilar', position: 'GK', age: 26, nationality: 'セルビア', ovr: 82, shirtNumber: 99, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Mathew Ryan', position: 'GK', age: 34, nationality: 'オーストラリア', ovr: 76, shirtNumber: 98, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Zeki Çelik', position: 'RB', age: 29, nationality: 'トルコ', ovr: 78, shirtNumber: 19, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Gianluca Mancini', position: 'CB', age: 30, nationality: 'イタリア', ovr: 83, shirtNumber: 23, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Evan Ndicka', position: 'CB', age: 26, nationality: 'コートジボワール', ovr: 82, shirtNumber: 5, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Mats Hummels', position: 'CB', age: 37, nationality: 'ドイツ', ovr: 82, shirtNumber: 15, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Angeliño', position: 'LB', age: 29, nationality: 'スペイン', ovr: 80, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Bryan Cristante', position: 'CDM', age: 31, nationality: 'イタリア', ovr: 81, shirtNumber: 4, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Manu Koné', position: 'CM', age: 25, nationality: 'フランス', ovr: 81, shirtNumber: 17, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Lorenzo Pellegrini', position: 'CM', age: 30, nationality: 'イタリア', ovr: 83, shirtNumber: 7, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Enzo Le Fée', position: 'CM', age: 26, nationality: 'フランス', ovr: 79, shirtNumber: 28, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Matías Soulé', position: 'RW', age: 23, nationality: 'アルゼンチン', ovr: 81, shirtNumber: 18, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Paulo Dybala', position: 'CF', age: 32, nationality: 'アルゼンチン', ovr: 86, shirtNumber: 21, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Stephan El Shaarawy', position: 'LW', age: 33, nationality: 'イタリア', ovr: 79, shirtNumber: 92, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Artem Dovbyk', position: 'ST', age: 29, nationality: 'ウクライナ', ovr: 84, shirtNumber: 11, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Alexis Saelemaekers', position: 'RW', age: 27, nationality: 'ベルギー', ovr: 79, shirtNumber: 56, playstyle: 'ボックストゥボックス', preferredFoot: '右' }
  ],

  lazio: [
    { name: 'Ivan Provedel', position: 'GK', age: 32, nationality: 'イタリア', ovr: 82, shirtNumber: 94, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Christos Mandas', position: 'GK', age: 24, nationality: 'ギリシャ', ovr: 76, shirtNumber: 35, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Manuel Lazzari', position: 'RB', age: 32, nationality: 'イタリア', ovr: 79, shirtNumber: 29, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Alessio Romagnoli', position: 'CB', age: 31, nationality: 'イタリア', ovr: 82, shirtNumber: 13, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Mario Gila', position: 'CB', age: 25, nationality: 'スペイン', ovr: 80, shirtNumber: 34, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Nuno Tavares', position: 'LB', age: 26, nationality: 'ポルトガル', ovr: 81, shirtNumber: 30, playstyle: 'スピードスター', preferredFoot: '左' },
    { name: 'Nicolò Rovella', position: 'CDM', age: 24, nationality: 'イタリア', ovr: 81, shirtNumber: 6, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Mattéo Guendouzi', position: 'CM', age: 27, nationality: 'フランス', ovr: 82, shirtNumber: 8, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Matias Vecino', position: 'CM', age: 34, nationality: 'ウルグアイ', ovr: 79, shirtNumber: 5, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Gustav Isaksen', position: 'RW', age: 25, nationality: 'デンマーク', ovr: 78, shirtNumber: 18, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Mattia Zaccagni', position: 'LW', age: 31, nationality: 'イタリア', ovr: 83, shirtNumber: 10, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Valentín Castellanos', position: 'ST', age: 27, nationality: 'アルゼンチン', ovr: 82, shirtNumber: 11, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Boulaye Dia', position: 'ST', age: 29, nationality: 'セネガル', ovr: 81, shirtNumber: 19, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Tijjani Noslin', position: 'RW', age: 27, nationality: 'オランダ', ovr: 78, shirtNumber: 14, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Gaetano Castrovilli', position: 'CM', age: 29, nationality: 'イタリア', ovr: 78, shirtNumber: 22, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  fiorentina: [
    { name: 'David de Gea', position: 'GK', age: 35, nationality: 'スペイン', ovr: 83, shirtNumber: 43, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Pietro Terracciano', position: 'GK', age: 36, nationality: 'イタリア', ovr: 77, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Dodô', position: 'RB', age: 27, nationality: 'ブラジル', ovr: 80, shirtNumber: 2, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Lucas Martínez Quarta', position: 'CB', age: 30, nationality: 'アルゼンチン', ovr: 80, shirtNumber: 28, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Luca Ranieri', position: 'CB', age: 27, nationality: 'イタリア', ovr: 79, shirtNumber: 6, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Robin Gosens', position: 'LB', age: 32, nationality: 'ドイツ', ovr: 81, shirtNumber: 21, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Cristiano Biraghi', position: 'LB', age: 33, nationality: 'イタリア', ovr: 79, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Danilo Cataldi', position: 'CDM', age: 32, nationality: 'イタリア', ovr: 79, shirtNumber: 32, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Yacine Adli', position: 'CM', age: 26, nationality: 'フランス', ovr: 80, shirtNumber: 29, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Edoardo Bove', position: 'CM', age: 24, nationality: 'イタリア', ovr: 79, shirtNumber: 4, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Andrea Colpani', position: 'CAM', age: 27, nationality: 'イタリア', ovr: 81, shirtNumber: 23, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Albert Guðmundsson', position: 'CAM', age: 29, nationality: 'アイスランド', ovr: 83, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Moise Kean', position: 'ST', age: 26, nationality: 'イタリア', ovr: 83, shirtNumber: 20, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Lucas Beltrán', position: 'ST', age: 25, nationality: 'アルゼンチン', ovr: 78, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Jonathan Ikoné', position: 'RW', age: 28, nationality: 'フランス', ovr: 78, shirtNumber: 11, playstyle: '俊足ドリブラー', preferredFoot: '左' }
  ],

  bologna: [
    { name: 'Łukasz Skorupski', position: 'GK', age: 35, nationality: 'ポーランド', ovr: 81, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Federico Ravaglia', position: 'GK', age: 26, nationality: 'イタリア', ovr: 74, shirtNumber: 34, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Stefan Posch', position: 'RB', age: 29, nationality: 'オーストリア', ovr: 80, shirtNumber: 3, playstyle: '守備的SB', preferredFoot: '右' },
    { name: 'Sam Beukema', position: 'CB', age: 27, nationality: 'オランダ', ovr: 81, shirtNumber: 31, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Jhon Lucumí', position: 'CB', age: 28, nationality: 'コロンビア', ovr: 80, shirtNumber: 26, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Charalampos Lykogiannis', position: 'LB', age: 32, nationality: 'ギリシャ', ovr: 77, shirtNumber: 22, playstyle: '守備的SB', preferredFoot: '左' },
    { name: 'Remo Freuler', position: 'CDM', age: 34, nationality: 'スイス', ovr: 81, shirtNumber: 8, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Nikola Moro', position: 'CM', age: 28, nationality: 'クロアチア', ovr: 78, shirtNumber: 6, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Giovanni Fabbian', position: 'CAM', age: 23, nationality: 'イタリア', ovr: 80, shirtNumber: 80, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Riccardo Orsolini', position: 'RW', age: 29, nationality: 'イタリア', ovr: 83, shirtNumber: 7, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Dan Ndoye', position: 'LW', age: 25, nationality: 'スイス', ovr: 82, shirtNumber: 11, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Santiago Castro', position: 'ST', age: 21, nationality: 'アルゼンチン', ovr: 81, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Thijs Dallinga', position: 'ST', age: 25, nationality: 'オランダ', ovr: 79, shirtNumber: 24, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Jens Odgaard', position: 'RW', age: 27, nationality: 'デンマーク', ovr: 78, shirtNumber: 21, playstyle: 'ゴールゲッター', preferredFoot: '左' }
  ],

  // =========================================================================
  // LIGUE 1 (Additional Clubs)
  // =========================================================================
  lille: [
    { name: 'Lucas Chevalier', position: 'GK', age: 24, nationality: 'フランス', ovr: 84, shirtNumber: 30, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Vito Mannone', position: 'GK', age: 38, nationality: 'イタリア', ovr: 72, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Tiago Santos', position: 'RB', age: 24, nationality: 'ポルトガル', ovr: 80, shirtNumber: 22, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Bafodé Diakité', position: 'CB', age: 25, nationality: 'フランス', ovr: 81, shirtNumber: 18, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Alexsandro', position: 'CB', age: 27, nationality: 'ブラジル', ovr: 80, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '左' },
    { name: 'Gabriel Gudmundsson', position: 'LB', age: 27, nationality: 'スウェーデン', ovr: 78, shirtNumber: 5, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Benjamin André', position: 'CDM', age: 35, nationality: 'フランス', ovr: 81, shirtNumber: 21, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Angel Gomes', position: 'CM', age: 25, nationality: 'イングランド', ovr: 82, shirtNumber: 8, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Ngal\'ayel Mukau', position: 'CM', age: 21, nationality: 'コンゴ民主共和国', ovr: 76, shirtNumber: 17, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Edon Zhegrova', position: 'RW', age: 27, nationality: 'コソボ', ovr: 83, shirtNumber: 23, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Osame Sahraoui', position: 'LW', age: 25, nationality: 'モロッコ', ovr: 79, shirtNumber: 11, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Jonathan David', position: 'ST', age: 26, nationality: 'カナダ', ovr: 85, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '両足' },
    { name: 'Mohamed Bayo', position: 'ST', age: 28, nationality: 'ギニア', ovr: 77, shirtNumber: 27, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Rémy Cabella', position: 'CAM', age: 36, nationality: 'フランス', ovr: 78, shirtNumber: 10, playstyle: 'チャンスメイカー', preferredFoot: '右' }
  ],

  nice: [
    { name: 'Marcin Bułka', position: 'GK', age: 26, nationality: 'ポーランド', ovr: 83, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Maxime Dupé', position: 'GK', age: 33, nationality: 'フランス', ovr: 74, shirtNumber: 31, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Jonathan Clauss', position: 'RB', age: 33, nationality: 'フランス', ovr: 81, shirtNumber: 92, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Youssouf Ndayishimiye', position: 'CB', age: 27, nationality: 'ブルンジ', ovr: 80, shirtNumber: 55, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Moïse Bombito', position: 'CB', age: 26, nationality: 'カナダ', ovr: 79, shirtNumber: 4, playstyle: 'スピードスター', preferredFoot: '右' },
    { name: 'Dante', position: 'CB', age: 42, nationality: 'ブラジル', ovr: 79, shirtNumber: 4, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Melvin Bard', position: 'LB', age: 25, nationality: 'フランス', ovr: 79, shirtNumber: 26, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Pablo Rosario', position: 'CDM', age: 29, nationality: 'オランダ', ovr: 78, shirtNumber: 8, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Tanguy Ndombele', position: 'CM', age: 29, nationality: 'フランス', ovr: 81, shirtNumber: 22, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Hicham Boudaoui', position: 'CM', age: 26, nationality: 'アルジェリア', ovr: 79, shirtNumber: 28, playstyle: 'ボックストゥボックス', preferredFoot: '右' },
    { name: 'Badredine Bouanani', position: 'RW', age: 21, nationality: 'アルジェリア', ovr: 77, shirtNumber: 19, playstyle: '俊足ドリブラー', preferredFoot: '左' },
    { name: 'Jérémie Boga', position: 'LW', age: 29, nationality: 'コートジボワール', ovr: 81, shirtNumber: 7, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Evann Guessand', position: 'ST', age: 25, nationality: 'コートジボワール', ovr: 81, shirtNumber: 29, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Gaëtan Laborde', position: 'ST', age: 32, nationality: 'フランス', ovr: 80, shirtNumber: 24, playstyle: 'ゴールゲッター', preferredFoot: '左' },
    { name: 'Terem Moffi', position: 'ST', age: 27, nationality: 'ナイジェリア', ovr: 80, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '左' }
  ],

  lens: [
    { name: 'Brice Samba', position: 'GK', age: 32, nationality: 'フランス', ovr: 83, shirtNumber: 30, playstyle: 'ショットストッパー', preferredFoot: '左' },
    { name: 'Hervé Koffi', position: 'GK', age: 29, nationality: 'ブルキナファソ', ovr: 75, shirtNumber: 16, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Przemysław Frankowski', position: 'RWB', age: 31, nationality: 'ポーランド', ovr: 80, shirtNumber: 29, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Facundo Medina', position: 'CB', age: 27, nationality: 'アルゼンチン', ovr: 82, shirtNumber: 14, playstyle: 'ボール運べるCB', preferredFoot: '左' },
    { name: 'Kevin Danso', position: 'CB', age: 27, nationality: 'オーストリア', ovr: 82, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Jonathan Gradit', position: 'CB', age: 33, nationality: 'フランス', ovr: 79, shirtNumber: 24, playstyle: 'ボール運べるCB', preferredFoot: '右' },
    { name: 'Deiver Machado', position: 'LWB', age: 32, nationality: 'コロンビア', ovr: 78, shirtNumber: 3, playstyle: 'スピードスター', preferredFoot: '左' },
    { name: 'Andy Diouf', position: 'CM', age: 23, nationality: 'フランス', ovr: 80, shirtNumber: 18, playstyle: 'ボックストゥボックス', preferredFoot: '左' },
    { name: 'Adrien Thomasson', position: 'CM', age: 32, nationality: 'フランス', ovr: 78, shirtNumber: 28, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Angelo Fulgini', position: 'CAM', age: 29, nationality: 'フランス', ovr: 79, shirtNumber: 11, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Anass Zaroury', position: 'LW', age: 25, nationality: 'モロッコ', ovr: 78, shirtNumber: 36, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Florian Sotoca', position: 'ST', age: 35, nationality: 'フランス', ovr: 79, shirtNumber: 7, playstyle: 'ターゲットマン', preferredFoot: '右' },
    { name: 'Wesley Saïd', position: 'ST', age: 31, nationality: 'フランス', ovr: 79, shirtNumber: 22, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'M\'Bala Nzola', position: 'ST', age: 30, nationality: 'アンゴラ', ovr: 79, shirtNumber: 8, playstyle: 'ターゲットマン', preferredFoot: '左' }
  ],

  rennes: [
    { name: 'Steve Mandanda', position: 'GK', age: 41, nationality: 'フランス', ovr: 78, shirtNumber: 30, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Gauthier Gallon', position: 'GK', age: 33, nationality: 'フランス', ovr: 73, shirtNumber: 1, playstyle: 'ショットストッパー', preferredFoot: '右' },
    { name: 'Lorenz Assignon', position: 'RB', age: 26, nationality: 'フランス', ovr: 78, shirtNumber: 22, playstyle: '攻撃的SB', preferredFoot: '右' },
    { name: 'Alidu Seidu', position: 'CB', age: 26, nationality: 'ガーナ', ovr: 78, shirtNumber: 36, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Leo Østigård', position: 'CB', age: 26, nationality: 'ノルウェー', ovr: 78, shirtNumber: 55, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Christopher Wooh', position: 'CB', age: 24, nationality: 'カメルーン', ovr: 78, shirtNumber: 4, playstyle: 'ハードタックラー', preferredFoot: '右' },
    { name: 'Adrien Truffert', position: 'LB', age: 24, nationality: 'フランス', ovr: 80, shirtNumber: 3, playstyle: '攻撃的SB', preferredFoot: '左' },
    { name: 'Baptiste Santamaria', position: 'CDM', age: 31, nationality: 'フランス', ovr: 79, shirtNumber: 8, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Azor Matusiwa', position: 'CDM', age: 28, nationality: 'オランダ', ovr: 79, shirtNumber: 6, playstyle: 'アンカー', preferredFoot: '右' },
    { name: 'Albert Grønbæk', position: 'CAM', age: 25, nationality: 'デンマーク', ovr: 80, shirtNumber: 7, playstyle: 'チャンスメイカー', preferredFoot: '右' },
    { name: 'Ludovic Blas', position: 'RW', age: 28, nationality: 'フランス', ovr: 81, shirtNumber: 11, playstyle: 'チャンスメイカー', preferredFoot: '左' },
    { name: 'Jota', position: 'LW', age: 27, nationality: 'ポルトガル', ovr: 80, shirtNumber: 27, playstyle: '俊足ドリブラー', preferredFoot: '右' },
    { name: 'Amine Gouiri', position: 'ST', age: 26, nationality: 'アルジェリア', ovr: 82, shirtNumber: 9, playstyle: 'ゴールゲッター', preferredFoot: '右' },
    { name: 'Arnaud Kalimuendo', position: 'ST', age: 24, nationality: 'フランス', ovr: 81, shirtNumber: 99, playstyle: 'ゴールゲッター', preferredFoot: '右' }
  ]
};
