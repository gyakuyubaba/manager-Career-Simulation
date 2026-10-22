import { Player } from '../types/game';
import { makeRealPlayer } from './realPlayersDatabase';

export const CURATED_REAL_SQUADS: Record<string, Player[]> = {
  // ==========================================
  // PREMIER LEAGUE SQUADS
  // ==========================================
  arsenal: [
    makeRealPlayer('ars_raya', 'David Raya', 'arsenal', 'GK', 30, 'スペイン', 86, 88, 45000000, 140000, 22, '右', 'ビルドアップ型GK'),
    makeRealPlayer('ars_saliba', 'William Saliba', 'arsenal', 'CB', 24, 'フランス', 88, 92, 90000000, 210000, 2, '右', 'ボール運べるCB'),
    makeRealPlayer('ars_gabriel', 'Gabriel Magalhães', 'arsenal', 'CB', 27, 'ブラジル', 87, 89, 75000000, 190000, 6, '左', 'ボール運べるCB'),
    makeRealPlayer('ars_white', 'Ben White', 'arsenal', 'RB', 27, 'イングランド', 85, 86, 55000000, 160000, 4, '右', '守備的SB'),
    makeRealPlayer('ars_timber', 'Jurriën Timber', 'arsenal', 'LB', 24, 'オランダ', 83, 87, 50000000, 150000, 12, '右', '守備的SB', ['RB', 'CB']),
    makeRealPlayer('ars_rice', 'Declan Rice', 'arsenal', 'CDM', 26, 'イングランド', 88, 91, 115000000, 260000, 41, '右', 'アンカー', ['CM']),
    makeRealPlayer('ars_odegaard', 'Martin Ødegaard', 'arsenal', 'CAM', 26, 'ノルウェー', 89, 91, 110000000, 290000, 8, '左', 'チャンスメイカー', ['CM']),
    makeRealPlayer('ars_merino', 'Mikel Merino', 'arsenal', 'CM', 29, 'スペイン', 84, 84, 48000000, 170000, 23, '左', 'ボックストゥボックス', ['CDM']),
    makeRealPlayer('ars_saka', 'Bukayo Saka', 'arsenal', 'RW', 23, 'イングランド', 89, 93, 135000000, 310000, 7, '左', '俊足ドリブラー', ['LW']),
    makeRealPlayer('ars_havertz', 'Kai Havertz', 'arsenal', 'ST', 26, 'ドイツ', 85, 87, 65000000, 240000, 29, '左', 'ターゲットマン', ['CAM', 'CF']),
    makeRealPlayer('ars_martinelli', 'Gabriel Martinelli', 'arsenal', 'LW', 24, 'ブラジル', 85, 88, 70000000, 200000, 11, '右', 'スピードスター', ['CF']),
    makeRealPlayer('ars_trossard', 'Leandro Trossard', 'arsenal', 'LW', 30, 'ベルギー', 83, 83, 35000000, 130000, 19, '両足', 'チャンスメイカー', ['ST', 'CAM']),
    makeRealPlayer('ars_calafiori', 'Riccardo Calafiori', 'arsenal', 'LB', 23, 'イタリア', 83, 88, 55000000, 130000, 33, '左', 'ボール運べるCB', ['CB']),
    makeRealPlayer('ars_jesus', 'Gabriel Jesus', 'arsenal', 'ST', 28, 'ブラジル', 83, 84, 42000000, 220000, 9, '右', 'ゴールゲッター', ['LW', 'RW']),
    makeRealPlayer('ars_partey', 'Thomas Partey', 'arsenal', 'CDM', 32, 'ガーナ', 82, 82, 22000000, 180000, 5, '右', 'アンカー'),
    makeRealPlayer('ars_jorginho', 'Jorginho', 'arsenal', 'CM', 33, 'イタリア', 81, 81, 15000000, 120000, 20, '右', 'チャンスメイカー'),
    makeRealPlayer('ars_kiwior', 'Jakub Kiwior', 'arsenal', 'CB', 25, 'ポーランド', 80, 83, 28000000, 85000, 15, '左', 'ボール運べるCB', ['LB']),
    makeRealPlayer('ars_zinchenko', 'Oleksandr Zinchenko', 'arsenal', 'LB', 28, 'ウクライナ', 81, 82, 25000000, 140000, 35, '左', '攻撃的SB', ['CM']),
    makeRealPlayer('ars_sterling', 'Raheem Sterling', 'arsenal', 'LW', 30, 'イングランド', 83, 83, 40000000, 180000, 30, '右', '俊足ドリブラー', ['RW', 'CF'])
  ],

  man_city: [
    makeRealPlayer('mci_ederson', 'Ederson', 'man_city', 'GK', 32, 'ブラジル', 88, 88, 40000000, 180000, 31, '左', 'ビルドアップ型GK'),
    makeRealPlayer('mci_dias', 'Rúben Dias', 'man_city', 'CB', 28, 'ポルトガル', 89, 90, 85000000, 220000, 3, '右', 'ボール運べるCB'),
    makeRealPlayer('mci_akanji', 'Manuel Akanji', 'man_city', 'CB', 30, 'スイス', 85, 85, 45000000, 160000, 25, '右', '守備的SB', ['RB', 'LB']),
    makeRealPlayer('mci_gvardiol', 'Joško Gvardiol', 'man_city', 'LB', 23, 'クロアチア', 86, 91, 80000000, 170000, 24, '左', '攻撃的SB', ['CB']),
    makeRealPlayer('mci_walker', 'Kyle Walker', 'man_city', 'RB', 35, 'イングランド', 83, 83, 12000000, 160000, 2, '右', 'スピードスター'),
    makeRealPlayer('mci_rodri', 'Rodri', 'man_city', 'CDM', 29, 'スペイン', 91, 91, 130000000, 320000, 16, '右', 'アンカー', ['CM']),
    makeRealPlayer('mci_debruyne', 'Kevin De Bruyne', 'man_city', 'CAM', 34, 'ベルギー', 90, 90, 50000000, 380000, 17, '右', 'チャンスメイカー', ['CM']),
    makeRealPlayer('mci_silva', 'Bernardo Silva', 'man_city', 'CM', 31, 'ポルトガル', 88, 88, 65000000, 260000, 20, '左', 'チャンスメイカー', ['RW']),
    makeRealPlayer('mci_foden', 'Phil Foden', 'man_city', 'RW', 25, 'イングランド', 89, 92, 140000000, 280000, 47, '左', 'チャンスメイカー', ['LW', 'CAM']),
    makeRealPlayer('mci_haaland', 'Erling Haaland', 'man_city', 'ST', 25, 'ノルウェー', 91, 94, 180000000, 420000, 9, '左', 'ゴールゲッター'),
    makeRealPlayer('mci_doku', 'Jérémy Doku', 'man_city', 'LW', 23, 'ベルギー', 84, 88, 65000000, 130000, 11, '右', '俊足ドリブラー'),
    makeRealPlayer('mci_gundogan', 'İlkay Gündoğan', 'man_city', 'CM', 34, 'ドイツ', 86, 86, 20000000, 220000, 19, '右', 'チャンスメイカー'),
    makeRealPlayer('mci_grealish', 'Jack Grealish', 'man_city', 'LW', 29, 'イングランド', 84, 84, 55000000, 230000, 10, '右', 'チャンスメイカー'),
    makeRealPlayer('mci_stones', 'John Stones', 'man_city', 'CB', 31, 'イングランド', 85, 85, 38000000, 210000, 5, '右', 'ボール運べるCB', ['CDM']),
    makeRealPlayer('mci_ake', 'Nathan Aké', 'man_city', 'CB', 30, 'オランダ', 83, 83, 35000000, 150000, 6, '左', '守備的SB', ['LB']),
    makeRealPlayer('mci_kovacic', 'Mateo Kovačić', 'man_city', 'CM', 31, 'クロアチア', 83, 83, 30000000, 160000, 8, '右', 'ボックストゥボックス'),
    makeRealPlayer('mci_savinho', 'Savinho', 'man_city', 'RW', 21, 'ブラジル', 83, 89, 50000000, 90000, 26, '左', '俊足ドリブラー'),
    makeRealPlayer('mci_lewis', 'Rico Lewis', 'man_city', 'RB', 20, 'イングランド', 80, 88, 38000000, 65000, 82, '右', '攻撃的SB', ['CDM'])
  ],

  liverpool: [
    makeRealPlayer('liv_alisson', 'Alisson Becker', 'liverpool', 'GK', 32, 'ブラジル', 89, 89, 45000000, 210000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('liv_vandijk', 'Virgil van Dijk', 'liverpool', 'CB', 34, 'オランダ', 89, 89, 35000000, 250000, 4, '右', 'ボール運べるCB'),
    makeRealPlayer('liv_konate', 'Ibrahima Konaté', 'liverpool', 'CB', 26, 'フランス', 85, 88, 60000000, 140000, 5, '右', 'ボール運べるCB'),
    makeRealPlayer('liv_trent', 'Trent Alexander-Arnold', 'liverpool', 'RB', 26, 'イングランド', 87, 89, 85000000, 240000, 66, '右', 'チャンスメイカー', ['CM']),
    makeRealPlayer('liv_robertson', 'Andy Robertson', 'liverpool', 'LB', 31, 'スコットランド', 84, 84, 30000000, 160000, 26, '左', '攻撃的SB'),
    makeRealPlayer('liv_gravenberch', 'Ryan Gravenberch', 'liverpool', 'CDM', 23, 'オランダ', 84, 89, 65000000, 130000, 38, '右', 'ボックストゥボックス', ['CM']),
    makeRealPlayer('liv_macallister', 'Alexis Mac Allister', 'liverpool', 'CM', 26, 'アルゼンチン', 87, 89, 80000000, 180000, 10, '右', 'チャンスメイカー', ['CDM']),
    makeRealPlayer('liv_szoboszlai', 'Dominik Szoboszlai', 'liverpool', 'CAM', 24, 'ハンガリー', 84, 88, 70000000, 150000, 8, '右', 'ボックストゥボックス', ['RW']),
    makeRealPlayer('liv_salah', 'Mohamed Salah', 'liverpool', 'RW', 33, 'エジプト', 89, 89, 55000000, 350000, 11, '左', 'ゴールゲッター'),
    makeRealPlayer('liv_diaz', 'Luis Díaz', 'liverpool', 'LW', 28, 'コロンビア', 85, 86, 75000000, 170000, 7, '右', '俊足ドリブラー'),
    makeRealPlayer('liv_nunez', 'Darwin Núñez', 'liverpool', 'ST', 26, 'ウルグアイ', 83, 86, 65000000, 160000, 9, '右', 'スピードスター'),
    makeRealPlayer('liv_gakpo', 'Cody Gakpo', 'liverpool', 'LW', 26, 'オランダ', 83, 85, 55000000, 140000, 18, '右', 'チャンスメイカー', ['ST']),
    makeRealPlayer('liv_bradley', 'Conor Bradley', 'liverpool', 'RB', 22, '北アイルランド', 80, 86, 28000000, 50000, 84, '右', '攻撃的SB', ['RWB']),
    makeRealPlayer('liv_endo', '遠藤 航 (Wataru Endo)', 'liverpool', 'CDM', 32, '日本', 81, 81, 15000000, 110000, 3, '右', 'アンカー'),
    makeRealPlayer('liv_chiesa', 'Federico Chiesa', 'liverpool', 'RW', 27, 'イタリア', 82, 83, 35000000, 130000, 14, '右', 'スピードスター', ['LW']),
    makeRealPlayer('liv_jones', 'Curtis Jones', 'liverpool', 'CM', 24, 'イングランド', 81, 85, 38000000, 85000, 17, '右', 'ボックストゥボックス'),
    makeRealPlayer('liv_elliott', 'Harvey Elliott', 'liverpool', 'CAM', 22, 'イングランド', 81, 87, 40000000, 75000, 19, '左', 'チャンスメイカー', ['RW']),
    makeRealPlayer('liv_quansah', 'Jarell Quansah', 'liverpool', 'CB', 22, 'イングランド', 79, 86, 30000000, 50000, 78, '右', 'ボール運べるCB')
  ],

  brighton: [
    makeRealPlayer('bha_verbruggen', 'Bart Verbruggen', 'brighton', 'GK', 23, 'オランダ', 80, 86, 25000000, 45000, 1, '右', 'ビルドアップ型GK'),
    makeRealPlayer('bha_dunk', 'Lewis Dunk', 'brighton', 'CB', 33, 'イングランド', 80, 80, 12000000, 85000, 5, '右', 'ボール運べるCB'),
    makeRealPlayer('bha_vanhecke', 'Jan Paul van Hecke', 'brighton', 'CB', 25, 'オランダ', 80, 84, 28000000, 55000, 29, '右', 'ボール運べるCB'),
    makeRealPlayer('bha_estupinan', 'Pervis Estupiñán', 'brighton', 'LB', 27, 'エクアドル', 81, 82, 32000000, 70000, 30, '左', '攻撃的SB'),
    makeRealPlayer('bha_veltman', 'Joël Veltman', 'brighton', 'RB', 33, 'オランダ', 78, 78, 8000000, 60000, 34, '右', '守備的SB', ['CB']),
    makeRealPlayer('bha_baleba', 'Carlos Baleba', 'brighton', 'CDM', 21, 'カメルーン', 81, 88, 45000000, 45000, 20, '左', 'ボックストゥボックス'),
    makeRealPlayer('bha_wieffer', 'Mats Wieffer', 'brighton', 'CM', 25, 'オランダ', 80, 84, 30000000, 65000, 27, '右', 'アンカー'),
    makeRealPlayer('bha_mitoma', '三笘 薫 (Kaoru Mitoma)', 'brighton', 'LW', 28, '日本', 83, 84, 50000000, 110000, 22, '右', '俊足ドリブラー'),
    makeRealPlayer('bha_minteh', 'Yankuba Minteh', 'brighton', 'RW', 21, 'ガンビア', 79, 87, 35000000, 40000, 17, '左', 'スピードスター'),
    makeRealPlayer('bha_pedro', 'João Pedro', 'brighton', 'CF', 24, 'ブラジル', 81, 86, 48000000, 80000, 9, '右', 'ゴールゲッター', ['ST', 'CAM']),
    makeRealPlayer('bha_welbeck', 'Danny Welbeck', 'brighton', 'ST', 34, 'イングランド', 79, 79, 7000000, 75000, 18, '右', 'ターゲットマン'),
    makeRealPlayer('bha_rutter', 'Georginio Rutter', 'brighton', 'CAM', 23, 'フランス', 79, 85, 42000000, 65000, 14, '左', 'チャンスメイカー', ['ST']),
    makeRealPlayer('bha_ferguson', 'Evan Ferguson', 'brighton', 'ST', 20, 'アイルランド', 79, 87, 45000000, 40000, 28, '右', 'ゴールゲッター')
  ],

  chelsea: [
    makeRealPlayer('che_sanchez', 'Robert Sánchez', 'chelsea', 'GK', 27, 'スペイン', 80, 83, 25000000, 80000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('che_colwill', 'Levi Colwill', 'chelsea', 'CB', 22, 'イングランド', 82, 88, 55000000, 100000, 6, '左', 'ボール運べるCB'),
    makeRealPlayer('che_fofana', 'Wesley Fofana', 'chelsea', 'CB', 24, 'フランス', 81, 86, 45000000, 120000, 29, '右', 'ボール運べるCB'),
    makeRealPlayer('che_gusto', 'Malo Gusto', 'chelsea', 'RB', 22, 'フランス', 80, 86, 40000000, 65000, 27, '右', '攻撃的SB'),
    makeRealPlayer('che_cucurella', 'Marc Cucurella', 'chelsea', 'LB', 27, 'スペイン', 82, 84, 45000000, 140000, 3, '左', '守備的SB'),
    makeRealPlayer('che_caicedo', 'Moisés Caicedo', 'chelsea', 'CDM', 23, 'エクアドル', 85, 90, 90000000, 180000, 25, '右', 'アンカー'),
    makeRealPlayer('che_enzo', 'Enzo Fernández', 'chelsea', 'CM', 24, 'アルゼンチン', 84, 89, 80000000, 200000, 8, '右', 'チャンスメイカー'),
    makeRealPlayer('che_palmer', 'Cole Palmer', 'chelsea', 'CAM', 23, 'イングランド', 88, 93, 125000000, 220000, 20, '左', 'チャンスメイカー', ['RW', 'CF']),
    makeRealPlayer('che_madueke', 'Noni Madueke', 'chelsea', 'RW', 23, 'イングランド', 81, 86, 45000000, 80000, 11, '左', '俊足ドリブラー'),
    makeRealPlayer('che_neto', 'Pedro Neto', 'chelsea', 'LW', 25, 'ポルトガル', 82, 86, 55000000, 130000, 7, '左', 'スピードスター'),
    makeRealPlayer('che_jackson', 'Nicolas Jackson', 'chelsea', 'ST', 24, 'セネガル', 82, 87, 60000000, 110000, 15, '右', 'ゴールゲッター'),
    makeRealPlayer('che_nkunku', 'Christopher Nkunku', 'chelsea', 'CF', 27, 'フランス', 84, 86, 65000000, 190000, 18, '右', 'ゴールゲッター', ['CAM', 'LW']),
    makeRealPlayer('che_sancho', 'Jadon Sancho', 'chelsea', 'LW', 25, 'イングランド', 81, 84, 40000000, 150000, 19, '右', '俊足ドリブラー'),
    makeRealPlayer('che_lavia', 'Roméo Lavia', 'chelsea', 'CDM', 21, 'ベルギー', 79, 87, 35000000, 60000, 45, '右', 'アンカー'),
    makeRealPlayer('che_james', 'Reece James', 'chelsea', 'RB', 25, 'イングランド', 83, 86, 45000000, 220000, 24, '右', '攻撃的SB'),
    makeRealPlayer('che_felix', 'João Félix', 'chelsea', 'CF', 25, 'ポルトガル', 83, 86, 50000000, 160000, 14, '右', 'チャンスメイカー', ['LW', 'CAM'])
  ],

  // ==========================================
  // LALIGA SQUADS
  // ==========================================
  real_madrid: [
    makeRealPlayer('rma_courtois', 'Thibaut Courtois', 'real_madrid', 'GK', 33, 'ベルギー', 90, 90, 35000000, 280000, 1, '左', 'ショットストッパー'),
    makeRealPlayer('rma_militao', 'Éder Militão', 'real_madrid', 'CB', 27, 'ブラジル', 87, 89, 70000000, 220000, 3, '右', 'ボール運べるCB'),
    makeRealPlayer('rma_rudiger', 'Antonio Rüdiger', 'real_madrid', 'CB', 32, 'ドイツ', 88, 88, 38000000, 260000, 22, '右', 'ボール運べるCB'),
    makeRealPlayer('rma_carvajal', 'Dani Carvajal', 'real_madrid', 'RB', 33, 'スペイン', 86, 86, 18000000, 210000, 2, '右', '攻撃的SB'),
    makeRealPlayer('rma_mendy', 'Ferland Mendy', 'real_madrid', 'LB', 30, 'フランス', 83, 83, 25000000, 180000, 23, '左', '守備的SB'),
    makeRealPlayer('rma_valverde', 'Federico Valverde', 'real_madrid', 'CM', 27, 'ウルグアイ', 89, 91, 130000000, 320000, 8, '右', 'ボックストゥボックス', ['RW']),
    makeRealPlayer('rma_tchouameni', 'Aurélien Tchouaméni', 'real_madrid', 'CDM', 25, 'フランス', 87, 90, 95000000, 240000, 14, '右', 'アンカー', ['CB']),
    makeRealPlayer('rma_bellingham', 'Jude Bellingham', 'real_madrid', 'CAM', 22, 'イングランド', 91, 95, 180000000, 400000, 5, '右', 'ボックストゥボックス', ['CM']),
    makeRealPlayer('rma_rodrygo', 'Rodrygo', 'real_madrid', 'RW', 24, 'ブラジル', 87, 90, 110000000, 250000, 11, '右', '俊足ドリブラー', ['LW', 'ST']),
    makeRealPlayer('rma_mbappe', 'Kylian Mbappé', 'real_madrid', 'ST', 26, 'フランス', 92, 94, 185000000, 500000, 9, '右', 'スピードスター', ['LW']),
    makeRealPlayer('rma_vinicius', 'Vinícius Júnior', 'real_madrid', 'LW', 25, 'ブラジル', 91, 94, 185000000, 420000, 7, '右', '俊足ドリブラー'),
    makeRealPlayer('rma_camavinga', 'Eduardo Camavinga', 'real_madrid', 'CM', 22, 'フランス', 87, 91, 100000000, 220000, 6, '左', 'ボックストゥボックス', ['LB', 'CDM']),
    makeRealPlayer('rma_modric', 'Luka Modrić', 'real_madrid', 'CM', 39, 'クロアチア', 85, 85, 8000000, 190000, 10, '両足', 'チャンスメイカー'),
    makeRealPlayer('rma_brahim', 'Brahim Díaz', 'real_madrid', 'CAM', 26, 'モロッコ', 83, 85, 45000000, 140000, 21, '両足', '俊足ドリブラー', ['RW']),
    makeRealPlayer('rma_guler', 'Arda Güler', 'real_madrid', 'CAM', 20, 'トルコ', 81, 90, 45000000, 90000, 15, '左', 'チャンスメイカー', ['RW']),
    makeRealPlayer('rma_endrick', 'Endrick', 'real_madrid', 'ST', 19, 'ブラジル', 80, 91, 55000000, 80000, 16, '左', 'ゴールゲッター')
  ],

  barcelona: [
    makeRealPlayer('bar_terstegen', 'Marc-André ter Stegen', 'barcelona', 'GK', 33, 'ドイツ', 88, 88, 30000000, 250000, 1, '右', 'ビルドアップ型GK'),
    makeRealPlayer('bar_kounde', 'Jules Koundé', 'barcelona', 'RB', 26, 'フランス', 86, 88, 65000000, 220000, 23, '右', '守備的SB', ['CB']),
    makeRealPlayer('bar_cubarsi', 'Pau Cubarsí', 'barcelona', 'CB', 18, 'スペイン', 83, 91, 55000000, 60000, 2, '右', 'ボール運べるCB'),
    makeRealPlayer('bar_inigo', 'Iñigo Martínez', 'barcelona', 'CB', 34, 'スペイン', 82, 82, 8000000, 140000, 5, '左', 'ボール運べるCB'),
    makeRealPlayer('bar_balde', 'Alejandro Balde', 'barcelona', 'LB', 21, 'スペイン', 83, 88, 50000000, 110000, 3, '左', '攻撃的SB'),
    makeRealPlayer('bar_dejong', 'Frenkie de Jong', 'barcelona', 'CM', 28, 'オランダ', 88, 89, 75000000, 350000, 21, '右', 'ボール運べるCB', ['CDM']),
    makeRealPlayer('bar_pedri', 'Pedri', 'barcelona', 'CM', 22, 'スペイン', 88, 92, 100000000, 220000, 8, '右', 'チャンスメイカー'),
    makeRealPlayer('bar_olmo', 'Dani Olmo', 'barcelona', 'CAM', 27, 'スペイン', 86, 87, 65000000, 200000, 20, '右', 'チャンスメイカー', ['LW']),
    makeRealPlayer('bar_yamal', 'Lamine Yamal', 'barcelona', 'RW', 18, 'スペイン', 88, 95, 150000000, 140000, 19, '左', '俊足ドリブラー'),
    makeRealPlayer('bar_lewandowski', 'Robert Lewandowski', 'barcelona', 'ST', 37, 'ポーランド', 88, 88, 20000000, 380000, 9, '右', 'ゴールゲッター'),
    makeRealPlayer('bar_raphinha', 'Raphinha', 'barcelona', 'LW', 28, 'ブラジル', 87, 87, 80000000, 240000, 11, '左', 'スピードスター', ['RW']),
    makeRealPlayer('bar_gavi', 'Gavi', 'barcelona', 'CM', 21, 'スペイン', 85, 91, 90000000, 180000, 6, '右', 'ボックストゥボックス'),
    makeRealPlayer('bar_araujo', 'Ronald Araújo', 'barcelona', 'CB', 26, 'ウルグアイ', 86, 89, 70000000, 200000, 4, '右', 'ボール運べるCB'),
    makeRealPlayer('bar_ferran', 'Ferran Torres', 'barcelona', 'LW', 25, 'スペイン', 81, 84, 35000000, 140000, 7, '右', 'ゴールゲッター', ['ST', 'RW']),
    makeRealPlayer('bar_fermin', 'Fermín López', 'barcelona', 'CAM', 22, 'スペイン', 81, 87, 40000000, 75000, 16, '右', 'ボックストゥボックス'),
    makeRealPlayer('bar_casado', 'Marc Casadó', 'barcelona', 'CDM', 21, 'スペイン', 80, 87, 30000000, 50000, 17, '右', 'アンカー')
  ],

  real_sociedad: [
    makeRealPlayer('rso_remiro', 'Álex Remiro', 'real_sociedad', 'GK', 30, 'スペイン', 84, 85, 30000000, 85000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('rso_zubeldia', 'Igor Zubeldia', 'real_sociedad', 'CB', 28, 'スペイン', 81, 82, 25000000, 75000, 5, '右', 'ボール運べるCB'),
    makeRealPlayer('rso_aguerd', 'Nayef Aguerd', 'real_sociedad', 'CB', 29, 'モロッコ', 81, 81, 28000000, 80000, 21, '左', 'ボール運べるCB'),
    makeRealPlayer('rso_aramburu', 'Jon Aramburu', 'real_sociedad', 'RB', 23, 'ベネズエラ', 79, 85, 22000000, 45000, 27, '右', '守備的SB'),
    makeRealPlayer('rso_sergiogomez', 'Sergio Gómez', 'real_sociedad', 'LB', 24, 'スペイン', 80, 84, 25000000, 60000, 17, '左', '攻撃的SB', ['LM', 'LW']),
    makeRealPlayer('rso_zubimendi', 'Martín Zubimendi', 'real_sociedad', 'CDM', 26, 'スペイン', 85, 88, 65000000, 120000, 4, '右', 'アンカー'),
    makeRealPlayer('rso_brais', 'Brais Méndez', 'real_sociedad', 'CM', 28, 'スペイン', 82, 82, 35000000, 85000, 23, '左', 'チャンスメイカー'),
    makeRealPlayer('rso_sucic', 'Luka Sučić', 'real_sociedad', 'CAM', 22, 'クロアチア', 80, 86, 30000000, 55000, 24, '左', 'チャンスメイカー'),
    makeRealPlayer('rso_kubo', '久保 建英 (Takefusa Kubo)', 'real_sociedad', 'RW', 24, '日本', 84, 88, 65000000, 130000, 14, '左', '俊足ドリブラー', ['CAM', 'LW']),
    makeRealPlayer('rso_oyarzabal', 'Mikel Oyarzabal', 'real_sociedad', 'ST', 28, 'スペイン', 84, 84, 45000000, 140000, 10, '左', 'ゴールゲッター', ['LW']),
    makeRealPlayer('rso_barrenetxea', 'Ander Barrenetxea', 'real_sociedad', 'LW', 23, 'スペイン', 80, 85, 28000000, 55000, 7, '右', '俊足ドリブラー'),
    makeRealPlayer('rso_turrientes', 'Beñat Turrientes', 'real_sociedad', 'CM', 23, 'スペイン', 78, 84, 20000000, 45000, 8, '右', 'ボックストゥボックス')
  ],

  // ==========================================
  // BUNDESLIGA SQUADS
  // ==========================================
  bayern: [
    makeRealPlayer('bay_neuer', 'Manuel Neuer', 'bayern', 'GK', 39, 'ドイツ', 88, 88, 10000000, 250000, 1, '右', 'ビルドアップ型GK'),
    makeRealPlayer('bay_upamecano', 'Dayot Upamecano', 'bayern', 'CB', 26, 'フランス', 84, 87, 50000000, 170000, 2, '右', 'ボール運べるCB'),
    makeRealPlayer('bay_kim', '金 玟哉 (Kim Min-jae)', 'bayern', 'CB', 28, '韓国', 84, 86, 50000000, 180000, 3, '右', 'ボール運べるCB'),
    makeRealPlayer('bay_kimmich', 'Joshua Kimmich', 'bayern', 'RB', 30, 'ドイツ', 87, 87, 60000000, 280000, 6, '右', 'チャンスメイカー', ['CDM', 'CM']),
    makeRealPlayer('bay_davies', 'Alphonso Davies', 'bayern', 'LB', 24, 'カナダ', 85, 89, 65000000, 200000, 19, '左', 'スピードスター'),
    makeRealPlayer('bay_palhinha', 'João Palhinha', 'bayern', 'CDM', 30, 'ポルトガル', 85, 85, 55000000, 190000, 16, '右', 'アンカー'),
    makeRealPlayer('bay_pavlovic', 'Aleksandar Pavlović', 'bayern', 'CM', 21, 'ドイツ', 81, 89, 45000000, 80000, 45, '右', 'ボックストゥボックス'),
    makeRealPlayer('bay_musiala', 'Jamal Musiala', 'bayern', 'CAM', 22, 'ドイツ', 88, 93, 130000000, 260000, 42, '右', '俊足ドリブラー', ['LW', 'CM']),
    makeRealPlayer('bay_olise', 'Michael Olise', 'bayern', 'RW', 23, 'フランス', 84, 90, 75000000, 160000, 17, '左', 'チャンスメイカー'),
    makeRealPlayer('bay_kane', 'Harry Kane', 'bayern', 'ST', 32, 'イングランド', 90, 90, 95000000, 450000, 9, '右', 'ゴールゲッター', ['CF']),
    makeRealPlayer('bay_gnabry', 'Serge Gnabry', 'bayern', 'LW', 30, 'ドイツ', 83, 83, 35000000, 210000, 7, '右', 'スピードスター', ['RW']),
    makeRealPlayer('bay_sane', 'Leroy Sané', 'bayern', 'RW', 29, 'ドイツ', 84, 84, 45000000, 240000, 10, '左', 'スピードスター', ['LW']),
    makeRealPlayer('bay_coman', 'Kingsley Coman', 'bayern', 'LW', 29, 'フランス', 83, 83, 35000000, 210000, 11, '右', 'スピードスター'),
    makeRealPlayer('bay_muller', 'Thomas Müller', 'bayern', 'CAM', 35, 'ドイツ', 82, 82, 10000000, 250000, 25, '右', 'チャンスメイカー', ['ST']),
    makeRealPlayer('bay_laimer', 'Konrad Laimer', 'bayern', 'CM', 28, 'オーストリア', 81, 82, 28000000, 130000, 27, '右', 'ボックストゥボックス', ['RB']),
    makeRealPlayer('bay_ito', '伊藤 洋輝 (Hiroki Ito)', 'bayern', 'CB', 26, '日本', 81, 85, 30000000, 120000, 21, '左', 'ボール運べるCB', ['LB'])
  ],

  leverkusen: [
    makeRealPlayer('lev_hradecky', 'Lukáš Hrádecký', 'leverkusen', 'GK', 35, 'フィンランド', 83, 83, 10000000, 90000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('lev_tah', 'Jonathan Tah', 'leverkusen', 'CB', 29, 'ドイツ', 86, 87, 45000000, 150000, 4, '右', 'ボール運べるCB'),
    makeRealPlayer('lev_tapsoba', 'Edmond Tapsoba', 'leverkusen', 'CB', 26, 'ブルキナファソ', 84, 87, 50000000, 120000, 12, '右', 'ボール運べるCB'),
    makeRealPlayer('lev_hincapie', 'Piero Hincapié', 'leverkusen', 'CB', 23, 'エクアドル', 83, 88, 48000000, 110000, 3, '左', 'ボール運べるCB', ['LB']),
    makeRealPlayer('lev_frimpong', 'Jeremie Frimpong', 'leverkusen', 'RWB', 24, 'オランダ', 85, 89, 65000000, 140000, 30, '右', 'スピードスター', ['RM']),
    makeRealPlayer('lev_grimaldo', 'Álex Grimaldo', 'leverkusen', 'LWB', 29, 'スペイン', 86, 86, 55000000, 150000, 20, '左', '攻撃的SB', ['LM']),
    makeRealPlayer('lev_xhaka', 'Granit Xhaka', 'leverkusen', 'CDM', 32, 'スイス', 86, 86, 30000000, 160000, 34, '左', 'アンカー'),
    makeRealPlayer('lev_palacios', 'Exequiel Palacios', 'leverkusen', 'CM', 26, 'アルゼンチン', 84, 87, 50000000, 120000, 25, '右', 'ボックストゥボックス'),
    makeRealPlayer('lev_wirtz', 'Florian Wirtz', 'leverkusen', 'CAM', 22, 'ドイツ', 89, 94, 135000000, 220000, 10, '右', 'チャンスメイカー', ['LW']),
    makeRealPlayer('lev_terrier', 'Martin Terrier', 'leverkusen', 'LW', 28, 'フランス', 81, 82, 30000000, 100000, 11, '右', 'ゴールゲッター'),
    makeRealPlayer('lev_boniface', 'Victor Boniface', 'leverkusen', 'ST', 24, 'ナイジェリア', 84, 88, 60000000, 130000, 22, '右', 'ターゲットマン'),
    makeRealPlayer('lev_schick', 'Patrik Schick', 'leverkusen', 'ST', 29, 'チェコ', 82, 82, 28000000, 120000, 14, '左', 'ゴールゲッター'),
    makeRealPlayer('lev_andrich', 'Robert Andrich', 'leverkusen', 'CDM', 30, 'ドイツ', 82, 82, 22000000, 110000, 8, '右', 'アンカー')
  ],

  // ==========================================
  // SERIE A & LIGUE 1 SQUADS
  // ==========================================
  inter: [
    makeRealPlayer('int_sommer', 'Yann Sommer', 'inter', 'GK', 36, 'スイス', 86, 86, 12000000, 140000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('int_bastoni', 'Alessandro Bastoni', 'inter', 'CB', 26, 'イタリア', 87, 90, 80000000, 210000, 95, '左', 'ボール運べるCB'),
    makeRealPlayer('int_acerbi', 'Francesco Acerbi', 'inter', 'CB', 37, 'イタリア', 83, 83, 6000000, 120000, 15, '左', '守備的SB'),
    makeRealPlayer('int_pavard', 'Benjamin Pavard', 'inter', 'CB', 29, 'フランス', 84, 85, 45000000, 160000, 28, '右', '守備的SB', ['RB']),
    makeRealPlayer('int_dumfries', 'Denzel Dumfries', 'inter', 'RWB', 29, 'オランダ', 82, 83, 30000000, 120000, 2, '右', 'スピードスター'),
    makeRealPlayer('int_dimarco', 'Federico Dimarco', 'inter', 'LWB', 27, 'イタリア', 85, 87, 55000000, 150000, 32, '左', '攻撃的SB'),
    makeRealPlayer('int_calhanoglu', 'Hakan Çalhanoğlu', 'inter', 'CDM', 31, 'トルコ', 86, 86, 45000000, 190000, 20, '右', 'チャンスメイカー'),
    makeRealPlayer('int_barella', 'Nicolò Barella', 'inter', 'CM', 28, 'イタリア', 87, 89, 85000000, 240000, 23, '右', 'ボックストゥボックス'),
    makeRealPlayer('int_mkhitaryan', 'Henrikh Mkhitaryan', 'inter', 'CM', 36, 'アルメニア', 83, 83, 8000000, 130000, 22, '両足', 'チャンスメイカー'),
    makeRealPlayer('int_martinez', 'Lautaro Martínez', 'inter', 'ST', 28, 'アルゼンチン', 89, 90, 110000000, 310000, 10, '右', 'ゴールゲッター'),
    makeRealPlayer('int_thuram', 'Marcus Thuram', 'inter', 'ST', 28, 'フランス', 85, 86, 65000000, 180000, 9, '右', 'スピードスター', ['LW'])
  ],

  psg: [
    makeRealPlayer('psg_donnarumma', 'Gianluigi Donnarumma', 'psg', 'GK', 26, 'イタリア', 88, 91, 55000000, 260000, 1, '右', 'ショットストッパー'),
    makeRealPlayer('psg_marquinhos', 'Marquinhos', 'psg', 'CB', 31, 'ブラジル', 86, 86, 45000000, 280000, 5, '右', 'ボール運べるCB'),
    makeRealPlayer('psg_pacho', 'Willian Pacho', 'psg', 'CB', 23, 'エクアドル', 82, 87, 45000000, 120000, 51, '左', 'ボール運べるCB'),
    makeRealPlayer('psg_hakimi', 'Achraf Hakimi', 'psg', 'RB', 26, 'モロッコ', 86, 88, 70000000, 250000, 2, '右', 'スピードスター'),
    makeRealPlayer('psg_mendes', 'Nuno Mendes', 'psg', 'LB', 23, 'ポルトガル', 84, 89, 60000000, 160000, 25, '左', 'スピードスター'),
    makeRealPlayer('psg_vitinha', 'Vitinha', 'psg', 'CM', 25, 'ポルトガル', 86, 89, 70000000, 180000, 17, '右', 'チャンスメイカー'),
    makeRealPlayer('psg_neves', 'João Neves', 'psg', 'CDM', 20, 'ポルトガル', 83, 90, 65000000, 120000, 87, '右', 'ボックストゥボックス'),
    makeRealPlayer('psg_ruiz', 'Fabián Ruiz', 'psg', 'CM', 29, 'スペイン', 83, 83, 40000000, 160000, 8, '左', 'チャンスメイカー'),
    makeRealPlayer('psg_dembele', 'Ousmane Dembélé', 'psg', 'RW', 28, 'フランス', 86, 86, 65000000, 290000, 10, '両足', '俊足ドリブラー'),
    makeRealPlayer('psg_barcola', 'Bradley Barcola', 'psg', 'LW', 22, 'フランス', 84, 90, 70000000, 140000, 29, '右', '俊足ドリブラー'),
    makeRealPlayer('psg_lee', '李 康仁 (Lee Kang-in)', 'psg', 'CAM', 24, '韓国', 81, 86, 35000000, 110000, 19, '左', 'チャンスメイカー', ['RW'])
  ],

  bournemouth: [
    makeRealPlayer('bou_kepa', 'Kepa Arrizabalaga', 'bournemouth', 'GK', 30, 'スペイン', 80, 81, 18000000, 70000, 13, '右', 'ショットストッパー'),
    makeRealPlayer('bou_zabarnyi', 'Illia Zabarnyi', 'bournemouth', 'CB', 23, 'ウクライナ', 80, 86, 38000000, 65000, 27, '右', 'ボール運べるCB'),
    makeRealPlayer('bou_senesi', 'Marcos Senesi', 'bournemouth', 'CB', 28, 'アルゼンチン', 79, 80, 24000000, 60000, 25, '左', 'ボール運べるCB'),
    makeRealPlayer('bou_smith', 'Adam Smith', 'bournemouth', 'RB', 34, 'イングランド', 76, 76, 4000000, 45000, 15, '右', '守備的SB'),
    makeRealPlayer('bou_kerkez', 'Milos Kerkez', 'bournemouth', 'LB', 21, 'ハンガリー', 79, 86, 32000000, 50000, 3, '左', '攻撃的SB'),
    makeRealPlayer('bou_cook', 'Lewis Cook', 'bournemouth', 'CDM', 28, 'イングランド', 79, 80, 22000000, 60000, 4, '右', 'アンカー'),
    makeRealPlayer('bou_christie', 'Ryan Christie', 'bournemouth', 'CM', 30, 'スコットランド', 78, 78, 16000000, 55000, 10, '左', 'ボックストゥボックス'),
    makeRealPlayer('bou_kluivert', 'Justin Kluivert', 'bournemouth', 'CAM', 26, 'オランダ', 79, 82, 26000000, 65000, 19, '右', 'チャンスメイカー', ['LW', 'RW']),
    makeRealPlayer('bou_semenyo', 'Antoine Semenyo', 'bournemouth', 'RW', 25, 'ガーナ', 81, 86, 45000000, 75000, 24, '右', '俊足ドリブラー', ['ST', 'LW']),
    makeRealPlayer('bou_tavernier', 'Marcus Tavernier', 'bournemouth', 'LW', 26, 'イングランド', 78, 80, 20000000, 55000, 16, '左', 'チャンスメイカー'),
    makeRealPlayer('bou_evanilson', 'Evanilson', 'bournemouth', 'ST', 25, 'ブラジル', 80, 85, 42000000, 80000, 9, '右', 'ゴールゲッター'),
    makeRealPlayer('bou_ouattara', 'Dango Ouattara', 'bournemouth', 'LW', 23, 'ブルキナファソ', 77, 82, 18000000, 40000, 11, '左', 'スピードスター'),
    makeRealPlayer('bou_unai', 'Enes Ünal', 'bournemouth', 'ST', 28, 'トルコ', 78, 79, 18000000, 55000, 26, '右', 'ターゲットマン'),
    makeRealPlayer('bou_huijsen', 'Dean Huijsen', 'bournemouth', 'CB', 20, 'スペイン', 77, 87, 25000000, 40000, 2, '右', 'ボール運べるCB'),
    makeRealPlayer('bou_aarons', 'Max Aarons', 'bournemouth', 'RB', 25, 'イングランド', 76, 78, 14000000, 45000, 37, '右', '攻撃的SB')
  ],

  lyon: [
    makeRealPlayer('lyo_perri', 'Lucas Perri', 'lyon', 'GK', 27, 'ブラジル', 80, 83, 22000000, 60000, 23, '右', 'ショットストッパー'),
    makeRealPlayer('lyo_niakhate', 'Moussa Niakhaté', 'lyon', 'CB', 29, 'セネガル', 79, 80, 22000000, 65000, 19, '左', 'ボール運べるCB'),
    makeRealPlayer('lyo_caleta', 'Duje Ćaleta-Car', 'lyon', 'CB', 28, 'クロアチア', 78, 79, 16000000, 55000, 55, '右', 'ボール運べるCB'),
    makeRealPlayer('lyo_mata', 'Clinton Mata', 'lyon', 'RB', 32, 'アンゴラ', 78, 78, 10000000, 50000, 22, '右', '守備的SB'),
    makeRealPlayer('lyo_tagliafico', 'Nicolás Tagliafico', 'lyon', 'LB', 32, 'アルゼンチン', 80, 80, 14000000, 65000, 3, '左', '守備的SB'),
    makeRealPlayer('lyo_matic', 'Nemanja Matić', 'lyon', 'CDM', 36, 'セルビア', 79, 79, 8000000, 75000, 31, '左', 'アンカー'),
    makeRealPlayer('lyo_caqueret', 'Maxence Caqueret', 'lyon', 'CM', 25, 'フランス', 80, 84, 30000000, 70000, 6, '右', 'ボックストゥボックス'),
    makeRealPlayer('lyo_tolisso', 'Corentin Tolisso', 'lyon', 'CM', 31, 'フランス', 80, 80, 20000000, 80000, 8, '右', 'ボックストゥボックス'),
    makeRealPlayer('lyo_cherki', 'Rayan Cherki', 'lyon', 'CAM', 22, 'フランス', 81, 87, 42000000, 70000, 18, '両足', 'チャンスメイカー', ['RW', 'LW']),
    makeRealPlayer('lyo_fofana', 'Malick Fofana', 'lyon', 'LW', 20, 'ベルギー', 79, 87, 32000000, 45000, 11, '右', '俊足ドリブラー'),
    makeRealPlayer('lyo_lacazette', 'Alexandre Lacazette', 'lyon', 'ST', 34, 'フランス', 82, 82, 18000000, 120000, 10, '右', 'ゴールゲッター'),
    makeRealPlayer('lyo_mikautadze', 'Georges Mikautadze', 'lyon', 'ST', 24, 'ジョージア', 80, 86, 35000000, 65000, 69, '右', 'ゴールゲッター'),
    makeRealPlayer('lyo_nuamah', 'Ernest Nuamah', 'lyon', 'RW', 21, 'ガーナ', 78, 85, 24000000, 45000, 37, '左', 'スピードスター'),
    makeRealPlayer('lyo_veretout', 'Jordan Veretout', 'lyon', 'CM', 32, 'フランス', 79, 79, 14000000, 60000, 7, '右', 'ボックストゥボックス'),
    makeRealPlayer('lyo_abner', 'Abner Vinícius', 'lyon', 'LB', 25, 'ブラジル', 77, 81, 15000000, 40000, 16, '左', '攻撃的SB')
  ]
};
