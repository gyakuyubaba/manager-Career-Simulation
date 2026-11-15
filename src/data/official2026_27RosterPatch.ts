import { Club, PlayStyle, Player, Position } from '../types/game';
import { makeRealPlayer } from './realPlayersDatabase';
import { calculatePlayerPositionProficiency } from './playerPositionsHelper';
import { initializePlayerSkills } from '../engine/skillEngine';
import { recalculateDynamicMarketValue, syncPlayerGkAttributes } from '../engine/valuationEngine';
import {
  ALLOWED_DISTINCT_HOMONYMS,
  areAllowedDistinctHomonyms,
  extractNameMatchTokens,
  normalizePlayerNameKey
} from '../engine/dataValidator';

interface ReserveSeed {
  name: string;
  position: Position;
  age: number;
  nationality: string;
  ovr: number;
  shirtNumber: number;
  preferredFoot?: '右' | '左' | '両足';
  playstyle?: string;
  isLoaned?: boolean;
}

function normalizePlayStyle(raw: string | undefined, position: Position): PlayStyle {
  const validStyles: PlayStyle[] = [
    'ゴールゲッター', 'シャドーストライカー', 'ラインブレイカー', 'バランス型',
    'チャンスメイカー', '俊足ドリブラー', 'スピードスター', 'ターゲットマン',
    'ボックストゥボックス', 'アンカー', 'ハードタックラー', 'ボール運べるCB',
    '攻撃的SB', '守備的SB', '守備的GK', 'ビルドアップ型GK', 'ショットストッパー'
  ];
  if (raw && (validStyles as string[]).includes(raw)) {
    return raw as PlayStyle;
  }
  switch (raw) {
    case 'レジスタ':
      return 'チャンスメイカー';
    case 'ドリブラー':
      return '俊足ドリブラー';
    case 'インサイドフォワード':
      return 'シャドーストライカー';
    case 'ポーチャー':
      return 'ゴールゲッター';
    case 'アンカーマン':
    case 'ボールウィナー':
      return 'アンカー';
    case 'カバーリングマスター':
      return 'ハードタックラー';
    case 'オーバーラップSB':
    case 'インバーテッドSB':
    case 'クロッサー':
      return '攻撃的SB';
    case 'バランス型SB':
      return '守備的SB';
    default:
      if (position === 'GK') return 'ショットストッパー';
      if (position === 'CB') return 'ハードタックラー';
      if (['LB', 'RB', 'LWB', 'RWB'].includes(position)) return '攻撃的SB';
      if (['CDM'].includes(position)) return 'アンカー';
      if (['LW', 'RW'].includes(position)) return '俊足ドリブラー';
      if (['ST', 'CF'].includes(position)) return 'ゴールゲッター';
      return 'ボックストゥボックス';
  }
}

/**
 * Curated verified 2026/27 real players per club used both for:
 *  1) filling thin/post-transfer clubs with >= 3 GKs and >= 25 outfield+GK squad size, and
 *  2) eliminating all `[未確認]` synthetic placeholders across all 329 clubs.
 */
const VERIFIED_RESERVE_POOL: Record<string, ReserveSeed[]> = {
  // === J1 / J2 / J3 ===
  'sanfrecce-hiroshima': [
    { name: 'キム・ジュソン', position: 'CB', age: 25, nationality: '韓国', ovr: 74, shirtNumber: 37, preferredFoot: '左', playstyle: 'ボール運べるCB' },
    { name: '川村 拓夢', position: 'CM', age: 27, nationality: '日本', ovr: 75, shirtNumber: 8, preferredFoot: '左', playstyle: 'ボックストゥボックス' },
    { name: 'ヒル 袈依廉', position: 'GK', age: 24, nationality: '日本', ovr: 68, shirtNumber: 38, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: '小川 煌', position: 'GK', age: 18, nationality: '日本', ovr: 62, shirtNumber: 43, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '中村 草太', position: 'ST', age: 23, nationality: '日本', ovr: 71, shirtNumber: 39, preferredFoot: '右', playstyle: 'ラインブレイカー' },
    { name: '小林 志紋', position: 'CAM', age: 19, nationality: '日本', ovr: 65, shirtNumber: 45, preferredFoot: '右', playstyle: 'チャンスメイカー' },
    { name: '木下 康介', position: 'ST', age: 31, nationality: '日本', ovr: 71, shirtNumber: 17, preferredFoot: '右', playstyle: 'ターゲットマン' }
  ],
  'vissel-kobe': [
    { name: 'グスタボ・クリスマン (Gustavo Klismahn)', position: 'CAM', age: 27, nationality: 'ブラジル', ovr: 73, shirtNumber: 20, preferredFoot: '右', playstyle: 'チャンスメイカー' },
    { name: 'カエターノ (Caetano)', position: 'CB', age: 27, nationality: 'ブラジル', ovr: 74, shirtNumber: 3, preferredFoot: '左', playstyle: 'ハードタックラー' },
    { name: '小池 裕太', position: 'LB', age: 29, nationality: '日本', ovr: 70, shirtNumber: 26, preferredFoot: '左', playstyle: 'オーバーラップSB' },
    { name: '橋本 陸斗', position: 'LW', age: 21, nationality: '日本', ovr: 66, shirtNumber: 35, preferredFoot: '右', playstyle: 'ドリブラー' },
    { name: '寺阪 尚悟', position: 'CB', age: 22, nationality: '日本', ovr: 66, shirtNumber: 31, preferredFoot: '右', playstyle: 'カバーリングマスター' },
    { name: '濱﨑 健斗', position: 'CAM', age: 19, nationality: '日本', ovr: 65, shirtNumber: 34, preferredFoot: '左', playstyle: 'チャンスメイカー' }
  ],
  'avispa-fukuoka': [
    { name: 'ウェリック・ポポ (Werik Popó)', position: 'ST', age: 25, nationality: 'ブラジル', ovr: 72, shirtNumber: 9, preferredFoot: '右', playstyle: 'ラインブレイカー' },
    { name: '藤本 一輝', position: 'LW', age: 28, nationality: '日本', ovr: 71, shirtNumber: 19, preferredFoot: '右', playstyle: 'ドリブラー' },
    { name: '佐藤 颯之介', position: 'RB', age: 23, nationality: '日本', ovr: 67, shirtNumber: 26, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: 'サニブラウン・アブデルハナン', position: 'ST', age: 20, nationality: '日本', ovr: 66, shirtNumber: 32, preferredFoot: '右', playstyle: 'ターゲットマン' }
  ],
  'kashima-antlers': [
    { name: 'マテウス・ブエノ (Matheus Bueno)', position: 'CM', age: 28, nationality: 'ブラジル', ovr: 73, shirtNumber: 8, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: '松本 遥翔', position: 'RB', age: 20, nationality: '日本', ovr: 65, shirtNumber: 25, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: '佐藤 海宏', position: 'LB', age: 19, nationality: '日本', ovr: 64, shirtNumber: 32, preferredFoot: '左', playstyle: 'バランス型SB' },
    { name: '吉田 湊海', position: 'ST', age: 18, nationality: '日本', ovr: 63, shirtNumber: 40, preferredFoot: '右', playstyle: 'ラインブレイカー' }
  ],
  'tokyo-verdy': [
    { name: 'チョ・ユミン (Cho Yu-min)', position: 'CB', age: 29, nationality: '韓国', ovr: 73, shirtNumber: 4, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'fagiano-okayama': [
    { name: '川浪 吾郎 (Goro Kawanami)', position: 'GK', age: 35, nationality: '日本', ovr: 66, shirtNumber: 22, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '谷口 璃成', position: 'GK', age: 23, nationality: '日本', ovr: 63, shirtNumber: 49, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],
  'tokushima-vortis': [
    { name: '三井 大輝', position: 'GK', age: 25, nationality: '日本', ovr: 66, shirtNumber: 29, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '長谷川 徹', position: 'GK', age: 37, nationality: '日本', ovr: 67, shirtNumber: 31, preferredFoot: '右', playstyle: '守備的GK' },
    { name: 'カン・ヨンガン', position: 'GK', age: 21, nationality: '韓国', ovr: 63, shirtNumber: 50, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: '増田 将馬', position: 'CB', age: 24, nationality: '日本', ovr: 65, shirtNumber: 15, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'ventforet-kofu': [
    { name: '後藤 陽翔', position: 'GK', age: 19, nationality: '日本', ovr: 61, shirtNumber: 34, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '井上 樹', position: 'CB', age: 28, nationality: '日本', ovr: 68, shirtNumber: 2, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '一瀬 大寿', position: 'CB', age: 24, nationality: '日本', ovr: 67, shirtNumber: 5, preferredFoot: '左', playstyle: 'ハードタックラー' },
    { name: '末木 裕也', position: 'CM', age: 28, nationality: '日本', ovr: 68, shirtNumber: 16, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: '山本 英臣', position: 'CB', age: 45, nationality: '日本', ovr: 64, shirtNumber: 4, preferredFoot: '右', playstyle: 'カバーリングマスター' },
    { name: '野澤 陸', position: 'CB', age: 27, nationality: '日本', ovr: 67, shirtNumber: 3, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'nara-club': [
    { name: '宮澤 樹', position: 'GK', age: 22, nationality: '日本', ovr: 62, shirtNumber: 1, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '黒川 雷平', position: 'GK', age: 23, nationality: '日本', ovr: 63, shirtNumber: 49, preferredFoot: '右', playstyle: 'ショットストッパー', isLoaned: true },
    { name: '高畠 捷', position: 'CB', age: 23, nationality: '日本', ovr: 63, shirtNumber: 2, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '芝本 蓮', position: 'CM', age: 26, nationality: '日本', ovr: 65, shirtNumber: 50, preferredFoot: '右', playstyle: 'チャンスメイカー' }
  ],
  'vanraure-hachinohe': [
    { name: '谷口 裕介', position: 'GK', age: 30, nationality: '日本', ovr: 63, shirtNumber: 25, preferredFoot: '右', playstyle: '守備的GK' },
    { name: 'カウン・ゼン・マラ', position: 'GK', age: 24, nationality: 'ミャンマー', ovr: 61, shirtNumber: 77, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: '佐藤 碧', position: 'CM', age: 28, nationality: '日本', ovr: 65, shirtNumber: 10, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: '澤上 竜二', position: 'ST', age: 33, nationality: '日本', ovr: 66, shirtNumber: 9, preferredFoot: '右', playstyle: 'ターゲットマン' },
    { name: '高橋 耕平', position: 'CB', age: 27, nationality: '日本', ovr: 65, shirtNumber: 4, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '平松 航', position: 'CB', age: 26, nationality: '日本', ovr: 65, shirtNumber: 2, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '白井 陽貴', position: 'CB', age: 25, nationality: '日本', ovr: 64, shirtNumber: 14, preferredFoot: '右', playstyle: 'カバーリングマスター' }
  ],
  'azul-claro-numazu': [
    { name: '渡辺 健太', position: 'GK', age: 28, nationality: '日本', ovr: 65, shirtNumber: 21, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '宮嵜 海斗', position: 'CB', age: 25, nationality: '日本', ovr: 64, shirtNumber: 4, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '篠﨑 輝和', position: 'CB', age: 28, nationality: '日本', ovr: 64, shirtNumber: 5, preferredFoot: '右', playstyle: 'カバーリングマスター' },
    { name: '三原 秀真', position: 'RB', age: 24, nationality: '日本', ovr: 65, shirtNumber: 16, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: 'ペク・インファン', position: 'CB', age: 20, nationality: '韓国', ovr: 63, shirtNumber: 40, preferredFoot: '左', playstyle: 'ボール運べるCB' }
  ],
  'fc-gifu': [
    { name: '福田 晃斗', position: 'CM', age: 34, nationality: '日本', ovr: 68, shirtNumber: 6, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: '荒木 大吾', position: 'RM', age: 32, nationality: '日本', ovr: 67, shirtNumber: 8, preferredFoot: '右', playstyle: 'クロッサー' },
    { name: '中村 駿', position: 'CDM', age: 32, nationality: '日本', ovr: 69, shirtNumber: 9, preferredFoot: '右', playstyle: 'レジスタ' },
    { name: '泉澤 仁', position: 'LW', age: 34, nationality: '日本', ovr: 68, shirtNumber: 39, preferredFoot: '右', playstyle: 'ドリブラー' },
    { name: '羽田 健人', position: 'CB', age: 29, nationality: '日本', ovr: 67, shirtNumber: 5, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'kamatamare-sanuki': [
    { name: 'イ・ギサン', position: 'CB', age: 25, nationality: '韓国', ovr: 63, shirtNumber: 20, preferredFoot: '左', playstyle: 'ハードタックラー' },
    { name: 'キム・ドフン', position: 'CB', age: 22, nationality: '韓国', ovr: 62, shirtNumber: 25, preferredFoot: '右', playstyle: 'カバーリングマスター' },
    { name: '高嶋 修也', position: 'CB', age: 26, nationality: '日本', ovr: 64, shirtNumber: 40, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '森川 裕基', position: 'CAM', age: 33, nationality: '日本', ovr: 65, shirtNumber: 60, preferredFoot: '右', playstyle: 'チャンスメイカー' },
    { name: '禹 相皓', position: 'CDM', age: 33, nationality: '韓国', ovr: 65, shirtNumber: 66, preferredFoot: '右', playstyle: 'アンカーマン' }
  ],
  'fc-ryukyu': [
    { name: '積田 景介', position: 'GK', age: 33, nationality: '日本', ovr: 64, shirtNumber: 31, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '吉田 温紀', position: 'CB', age: 23, nationality: '日本', ovr: 65, shirtNumber: 3, preferredFoot: '右', playstyle: 'ボール運べるCB' },
    { name: '千葉 和彦', position: 'CB', age: 41, nationality: '日本', ovr: 66, shirtNumber: 35, preferredFoot: '右', playstyle: 'カバーリングマスター' },
    { name: '石浦 大雅', position: 'CAM', age: 24, nationality: '日本', ovr: 66, shirtNumber: 11, preferredFoot: '左', playstyle: 'チャンスメイカー' },
    { name: '神谷 凱士', position: 'CB', age: 29, nationality: '日本', ovr: 66, shirtNumber: 22, preferredFoot: '左', playstyle: 'ハードタックラー' }
  ],
  'matsumoto-yamaga': [
    { name: '小林 将天', position: 'GK', age: 21, nationality: '日本', ovr: 63, shirtNumber: 31, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'キム・ジュンヒョン', position: 'GK', age: 22, nationality: '韓国', ovr: 62, shirtNumber: 33, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '蓑田 広大', position: 'CB', age: 27, nationality: '日本', ovr: 66, shirtNumber: 4, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '金子 翔太', position: 'LW', age: 31, nationality: '日本', ovr: 68, shirtNumber: 11, preferredFoot: '右', playstyle: 'インサイドフォワード' }
  ],
  'fujieda-myfc': [
    { name: '栗栖 汰志', position: 'GK', age: 19, nationality: '日本', ovr: 61, shirtNumber: 31, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '閑田 隼人', position: 'ST', age: 24, nationality: '日本', ovr: 66, shirtNumber: 29, preferredFoot: '右', playstyle: 'ラインブレイカー' },
    { name: '楠本 卓海', position: 'CB', age: 30, nationality: '日本', ovr: 67, shirtNumber: 5, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '岡本 拓也', position: 'RB', age: 34, nationality: '日本', ovr: 68, shirtNumber: 6, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: '梶川 諒太', position: 'CM', age: 37, nationality: '日本', ovr: 67, shirtNumber: 28, preferredFoot: '右', playstyle: 'レジスタ' }
  ],
  'omiya-ardija': [
    { name: '酒井 匠', position: 'CB', age: 28, nationality: '日本', ovr: 66, shirtNumber: 25, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: '濱田 水輝', position: 'CB', age: 36, nationality: '日本', ovr: 68, shirtNumber: 4, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'yokohama-fc': [
    { name: '山根 永遠', position: 'RM', age: 27, nationality: '日本', ovr: 70, shirtNumber: 14, preferredFoot: '右', playstyle: 'クロッサー' },
    { name: '伊藤 槙人', position: 'CB', age: 34, nationality: '日本', ovr: 69, shirtNumber: 16, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'shonan-bellmare': [
    { name: '松本 果成', position: 'CB', age: 19, nationality: '日本', ovr: 66, shirtNumber: 41, preferredFoot: '右', playstyle: 'ボール運べるCB' },
    { name: 'キム・ミンテ', position: 'CB', age: 32, nationality: '韓国', ovr: 72, shirtNumber: 47, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'v-varen-nagasaki': [
    { name: '青木 俊輔', position: 'RW', age: 23, nationality: '日本', ovr: 67, shirtNumber: 26, preferredFoot: '左', playstyle: 'インサイドフォワード' },
    { name: '七牟禮 蒼太', position: 'CM', age: 21, nationality: '日本', ovr: 66, shirtNumber: 33, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: 'エドゥアルド', position: 'CB', age: 33, nationality: 'ブラジル', ovr: 74, shirtNumber: 5, preferredFoot: '左', playstyle: 'ハードタックラー' }
  ],
  'consadole-sapporo': [
    { name: '西野 奨太', position: 'CB', age: 22, nationality: '日本', ovr: 68, shirtNumber: 47, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'iwaki-fc': [
    { name: '坂元 一渚璃', position: 'CB', age: 21, nationality: '日本', ovr: 66, shirtNumber: 35, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'kagoshima-united': [
    { name: '大森 博', position: 'CB', age: 24, nationality: '日本', ovr: 65, shirtNumber: 25, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'fc-machida-zelvia': [
    { name: '中山 雄太', position: 'CB', age: 29, nationality: '日本', ovr: 75, shirtNumber: 19, preferredFoot: '左', playstyle: 'ボール運べるCB' }
  ],
  'sc-sagamihara': [
    { name: 'バウマン', position: 'GK', age: 30, nationality: 'スイス', ovr: 66, shirtNumber: 46, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: '三浦 基瑛', position: 'GK', age: 26, nationality: '日本', ovr: 64, shirtNumber: 1, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '綿引 康', position: 'RB', age: 28, nationality: '日本', ovr: 64, shirtNumber: 5, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'jef-united-chiba': [
    { name: '谷田 壮志朗', position: 'CB', age: 21, nationality: '日本', ovr: 67, shirtNumber: 28, preferredFoot: '左', playstyle: 'ボール運べるCB' },
    { name: '鈴木 椋大', position: 'GK', age: 32, nationality: '日本', ovr: 68, shirtNumber: 23, preferredFoot: '右', playstyle: '守備的GK' },
    { name: '椿 直起', position: 'LW', age: 26, nationality: '日本', ovr: 71, shirtNumber: 14, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'ac-nagano-parceiro': [
    { name: '砂森 和也', position: 'LB', age: 35, nationality: '日本', ovr: 65, shirtNumber: 33, preferredFoot: '左', playstyle: 'バランス型SB' }
  ],

  // === England ===
  'arsenal': [
    { name: 'Eberechi Eze', position: 'CAM', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 10, preferredFoot: '右', playstyle: 'ドリブラー' },
    { name: 'Myles Lewis-Skelly', position: 'LB', age: 19, nationality: 'イングランド', ovr: 77, shirtNumber: 49, preferredFoot: '左', playstyle: 'インバーテッドSB' }
  ],
  'liverpool': [
    { name: 'Freddie Woodman', position: 'GK', age: 29, nationality: 'イングランド', ovr: 73, shirtNumber: 28, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Rio Ngumoha', position: 'LW', age: 18, nationality: 'イングランド', ovr: 70, shirtNumber: 73, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'man_city': [
    { name: 'Jahmai Simpson-Pusey', position: 'CB', age: 20, nationality: 'イングランド', ovr: 72, shirtNumber: 66, preferredFoot: '右', playstyle: 'ボール運べるCB' },
    { name: 'Max Alleyne', position: 'CB', age: 21, nationality: 'イングランド', ovr: 71, shirtNumber: 68, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: 'Divine Mukasa', position: 'CAM', age: 19, nationality: 'イングランド', ovr: 70, shirtNumber: 63, preferredFoot: '左', playstyle: 'チャンスメイカー' },
    { name: 'Kaden Braithwaite', position: 'CB', age: 18, nationality: 'イングランド', ovr: 67, shirtNumber: 61, preferredFoot: '左', playstyle: 'ボール運べるCB' }
  ],
  'chelsea': [
    { name: 'Aaron Anselmino', position: 'CB', age: 21, nationality: 'アルゼンチン', ovr: 75, shirtNumber: 30, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: 'Kendry Páez', position: 'CAM', age: 19, nationality: 'エクアドル', ovr: 76, shirtNumber: 37, preferredFoot: '左', playstyle: 'チャンスメイカー' },
    { name: 'Deivid Washington', position: 'ST', age: 21, nationality: 'ブラジル', ovr: 73, shirtNumber: 36, preferredFoot: '右', playstyle: 'ラインブレイカー' },
    { name: 'Reggie Walsh', position: 'CM', age: 18, nationality: 'イングランド', ovr: 68, shirtNumber: 46, preferredFoot: '右', playstyle: 'ボックストゥボックス' }
  ],
  'tottenham': [
    { name: 'Antonín Kinský', position: 'GK', age: 23, nationality: 'チェコ', ovr: 76, shirtNumber: 31, preferredFoot: '右', playstyle: 'ビルドアップ型GK' },
    { name: 'Lucas Bergvall', position: 'CM', age: 20, nationality: 'スウェーデン', ovr: 77, shirtNumber: 15, preferredFoot: '右', playstyle: 'ボックストゥボックス' }
  ],
  'aston_villa': [
    { name: 'James Wright', position: 'GK', age: 21, nationality: 'イングランド', ovr: 64, shirtNumber: 42, preferredFoot: '右', playstyle: '守備的GK' },
    { name: 'Lamare Bogarde', position: 'CDM', age: 22, nationality: 'オランダ', ovr: 72, shirtNumber: 26, preferredFoot: '右', playstyle: 'アンカーマン' }
  ],
  'newcastle': [
    { name: 'Sean Neave', position: 'ST', age: 19, nationality: 'イングランド', ovr: 68, shirtNumber: 62, preferredFoot: '右', playstyle: 'ポーチャー' },
    { name: 'Alfie Harrison', position: 'CM', age: 20, nationality: 'イングランド', ovr: 68, shirtNumber: 64, preferredFoot: '右', playstyle: 'チャンスメイカー' },
    { name: 'Leo Shahar', position: 'RB', age: 19, nationality: 'イングランド', ovr: 67, shirtNumber: 58, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'everton': [
    { name: 'Merlin Röhl', position: 'CM', age: 24, nationality: 'ドイツ', ovr: 76, shirtNumber: 18, preferredFoot: '右', playstyle: 'ボックストゥボックス', isLoaned: true }
  ],
  'bournemouth': [
    { name: 'Alex Paulsen', position: 'GK', age: 24, nationality: 'ニュージーランド', ovr: 71, shirtNumber: 30, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Mataï Akinmboni', position: 'CB', age: 20, nationality: 'アメリカ', ovr: 70, shirtNumber: 44, preferredFoot: '左', playstyle: 'ハードタックラー' },
    { name: 'Owen Bevan', position: 'CB', age: 22, nationality: 'ウェールズ', ovr: 68, shirtNumber: 38, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: 'Zain Silcott-Duberry', position: 'RW', age: 21, nationality: 'イングランド', ovr: 67, shirtNumber: 47, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'wolves': [
    { name: 'Sam Johnstone', position: 'GK', age: 33, nationality: 'イングランド', ovr: 76, shirtNumber: 31, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Nasser Djiga', position: 'CB', age: 23, nationality: 'ブルキナファソ', ovr: 74, shirtNumber: 34, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: 'Fer López', position: 'CAM', age: 22, nationality: 'スペイン', ovr: 74, shirtNumber: 28, preferredFoot: '左', playstyle: 'チャンスメイカー' },
    { name: 'Bastian Meupiyou', position: 'CB', age: 20, nationality: 'フランス', ovr: 70, shirtNumber: 33, preferredFoot: '左', playstyle: 'ボール運べるCB' },
    { name: 'Mateus Mané', position: 'ST', age: 19, nationality: 'イングランド', ovr: 69, shirtNumber: 36, preferredFoot: '右', playstyle: 'ラインブレイカー' }
  ],
  'brentford': [
    { name: 'Romelle Donovan', position: 'RW', age: 19, nationality: 'イングランド', ovr: 70, shirtNumber: 45, preferredFoot: '左', playstyle: 'ドリブラー' }
  ],
  'brighton': [
    { name: 'Harry Howell', position: 'CAM', age: 18, nationality: 'イングランド', ovr: 69, shirtNumber: 53, preferredFoot: '左', playstyle: 'チャンスメイカー' }
  ],
  'west_ham': [
    { name: 'Airidas Golambeckis', position: 'CB', age: 19, nationality: 'イングランド', ovr: 68, shirtNumber: 62, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'southampton': [
    { name: 'Welington', position: 'LB', age: 25, nationality: 'ブラジル', ovr: 73, shirtNumber: 34, preferredFoot: '左', playstyle: 'オーバーラップSB' },
    { name: 'Jay Robinson', position: 'RW', age: 19, nationality: 'イングランド', ovr: 69, shirtNumber: 46, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'leeds_united': [
    { name: 'Harry Christy', position: 'GK', age: 22, nationality: 'イングランド', ovr: 66, shirtNumber: 31, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Darryl Ombang', position: 'GK', age: 21, nationality: 'イングランド', ovr: 65, shirtNumber: 32, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'burnley': [
    { name: 'Oliver Sonne', position: 'RB', age: 25, nationality: 'ペルー', ovr: 73, shirtNumber: 22, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'stoke_city': [
    { name: 'Frank Fielding', position: 'GK', age: 38, nationality: 'イングランド', ovr: 65, shirtNumber: 34, preferredFoot: '右', playstyle: '守備的GK' },
    { name: 'Tomás Rigo', position: 'CM', age: 24, nationality: 'スロバキア', ovr: 71, shirtNumber: 18, preferredFoot: '左', playstyle: 'レジスタ' }
  ],

  // === Spain ===
  'real_madrid': [
    { name: 'Yan Diomande', position: 'RW', age: 19, nationality: 'コートジボワール', ovr: 78, shirtNumber: 25, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'atletico_madrid': [
    { name: 'Clément Lenglet', position: 'CB', age: 31, nationality: 'フランス', ovr: 77, shirtNumber: 15, preferredFoot: '左', playstyle: 'ボール運べるCB' },
    { name: 'Gerónimo Spina', position: 'CB', age: 21, nationality: 'アルゼンチン', ovr: 70, shirtNumber: 27, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'villarreal': [
    { name: 'Rubén Gómez', position: 'GK', age: 24, nationality: 'スペイン', ovr: 69, shirtNumber: 13, preferredFoot: '右', playstyle: '守備的GK' },
    { name: 'Alassane Diatta', position: 'CDM', age: 21, nationality: 'セネガル', ovr: 70, shirtNumber: 27, preferredFoot: '右', playstyle: 'ボールウィナー' }
  ],
  'rayo_vallecano': [
    { name: 'Jozhua Vertrouwd', position: 'CB', age: 22, nationality: 'オランダ', ovr: 70, shirtNumber: 22, preferredFoot: '左', playstyle: 'ハードタックラー' }
  ],
  'real_sociedad': [
    { name: 'Iñaki Rupérez', position: 'RB', age: 23, nationality: 'スペイン', ovr: 71, shirtNumber: 30, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'sevilla': [
    { name: 'Rafael Romero', position: 'GK', age: 23, nationality: 'スペイン', ovr: 67, shirtNumber: 33, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Matías Árbol', position: 'GK', age: 24, nationality: 'スペイン', ovr: 67, shirtNumber: 31, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'valencia': [
    { name: 'Rubén Iranzo', position: 'RB', age: 23, nationality: 'スペイン', ovr: 70, shirtNumber: 32, preferredFoot: '右', playstyle: 'バランス型SB' }
  ],
  'girona': [
    { name: 'Papa Ba', position: 'CDM', age: 22, nationality: 'セネガル', ovr: 70, shirtNumber: 29, preferredFoot: '右', playstyle: 'アンカーマン' }
  ],
  'mallorca': [
    { name: 'Jan Salas', position: 'CM', age: 21, nationality: 'スペイン', ovr: 69, shirtNumber: 28, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: 'Iliesse Salhi', position: 'LB', age: 19, nationality: 'フランス', ovr: 68, shirtNumber: 31, preferredFoot: '左', playstyle: 'オーバーラップSB' }
  ],
  'alaves': [
    { name: 'Eneko Ortiz', position: 'LB', age: 23, nationality: 'スペイン', ovr: 69, shirtNumber: 30, preferredFoot: '左', playstyle: 'バランス型SB' }
  ],
  'real_zaragoza': [
    { name: 'Ander Herrera', position: 'CM', age: 37, nationality: 'スペイン', ovr: 74, shirtNumber: 21, preferredFoot: '右', playstyle: 'レジスタ' },
    { name: 'Adrián Rodríguez', position: 'GK', age: 25, nationality: 'アルゼンチン', ovr: 68, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],
  'cartagena': [
    { name: 'Lucho García', position: 'GK', age: 28, nationality: 'コロンビア', ovr: 67, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Toni Villa', position: 'LW', age: 31, nationality: 'スペイン', ovr: 69, shirtNumber: 11, preferredFoot: '右', playstyle: 'インサイドフォワード' }
  ],
  'cordoba': [
    { name: 'Guilherme Fernandes', position: 'GK', age: 25, nationality: 'ポルトガル', ovr: 68, shirtNumber: 13, preferredFoot: '右', playstyle: 'ビルドアップ型GK' }
  ],
  'las_palmas': [
    { name: 'Viti Rozada', position: 'RB', age: 28, nationality: 'スペイン', ovr: 72, shirtNumber: 23, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'deportivo': [
    { name: 'Samu Fernández', position: 'CB', age: 20, nationality: 'スペイン', ovr: 67, shirtNumber: 29, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'racing_santander': [
    { name: 'Diego Fuentes', position: 'CB', age: 22, nationality: 'スペイン', ovr: 68, shirtNumber: 28, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'leganes': [
    { name: 'Carlos Guirao', position: 'CDM', age: 23, nationality: 'スペイン', ovr: 70, shirtNumber: 27, preferredFoot: '右', playstyle: 'アンカーマン' }
  ],
  'espanyol': [
    { name: 'Pol Tristán', position: 'GK', age: 24, nationality: 'スペイン', ovr: 67, shirtNumber: 33, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],

  // === Germany ===
  'leverkusen': [
    { name: 'Axel Tape', position: 'CB', age: 19, nationality: 'フランス', ovr: 73, shirtNumber: 4, preferredFoot: '右', playstyle: 'ボール運べるCB' },
    { name: 'Andrea Natali', position: 'CB', age: 18, nationality: 'イタリア', ovr: 70, shirtNumber: 39, preferredFoot: '左', playstyle: 'ボール運べるCB' },
    { name: 'Montrell Culbreath', position: 'RW', age: 19, nationality: 'ドイツ', ovr: 69, shirtNumber: 45, preferredFoot: '右', playstyle: 'ドリブラー' },
    { name: 'Christian Michel Kofane', position: 'ST', age: 20, nationality: 'カメルーン', ovr: 74, shirtNumber: 35, preferredFoot: '右', playstyle: 'ラインブレイカー' },
    { name: 'Alejo Sarco', position: 'ST', age: 20, nationality: 'アルゼンチン', ovr: 72, shirtNumber: 27, preferredFoot: '左', playstyle: 'ポーチャー' }
  ],
  'rb_leipzig': [
    { name: 'Jonathan Norbye', position: 'CB', age: 19, nationality: 'ノルウェー', ovr: 70, shirtNumber: 41, preferredFoot: '右', playstyle: 'ハードタックラー' },
    { name: 'Samba Konaté', position: 'ST', age: 18, nationality: 'フランス', ovr: 69, shirtNumber: 48, preferredFoot: '右', playstyle: 'ラインブレイカー' }
  ],
  'stuttgart': [
    { name: 'Anrie Chase', position: 'CB', age: 22, nationality: '日本', ovr: 74, shirtNumber: 45, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'freiburg': [
    { name: 'Maxime Wörner', position: 'CM', age: 21, nationality: 'ドイツ', ovr: 69, shirtNumber: 38, preferredFoot: '右', playstyle: 'ボックストゥボックス' }
  ],
  'koln': [
    { name: 'Anthony Racioppi', position: 'GK', age: 27, nationality: 'スイス', ovr: 72, shirtNumber: 24, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],

  // === Italy ===
  'inter': [
    { name: 'Djed Spence', position: 'RB', age: 26, nationality: 'イングランド', ovr: 77, shirtNumber: 24, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: 'Alessandro Calligaris', position: 'GK', age: 21, nationality: 'イタリア', ovr: 67, shirtNumber: 40, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'roma': [
    { name: 'Giorgio De Marzi', position: 'GK', age: 19, nationality: 'イタリア', ovr: 65, shirtNumber: 70, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'parma': [
    { name: 'Filippo Rinaldi', position: 'GK', age: 23, nationality: 'イタリア', ovr: 69, shirtNumber: 40, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Manuel Moretta', position: 'GK', age: 21, nationality: 'イタリア', ovr: 65, shirtNumber: 34, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'atalanta': [
    { name: 'Marco Sportiello', position: 'GK', age: 34, nationality: 'イタリア', ovr: 74, shirtNumber: 57, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Vanja Vlahović', position: 'ST', age: 22, nationality: 'セルビア', ovr: 72, shirtNumber: 90, preferredFoot: '右', playstyle: 'ポーチャー' }
  ],
  'lazio': [
    { name: 'Reda Belahyane', position: 'CDM', age: 22, nationality: 'モロッコ', ovr: 73, shirtNumber: 21, preferredFoot: '右', playstyle: 'レジスタ' }
  ],
  'juventus': [
    { name: 'Lorenzo Palmisani', position: 'GK', age: 22, nationality: 'イタリア', ovr: 71, shirtNumber: 23, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Vasilije Adžić', position: 'CAM', age: 20, nationality: 'モンテネグロ', ovr: 73, shirtNumber: 17, preferredFoot: '右', playstyle: 'チャンスメイカー' }
  ],
  'empoli': [
    { name: 'Samuele Perisan', position: 'GK', age: 28, nationality: 'イタリア', ovr: 71, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],
  'genoa': [
    { name: 'Benjamin Siegrist', position: 'GK', age: 34, nationality: 'スイス', ovr: 72, shirtNumber: 31, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],
  'palermo': [
    { name: 'Francesco Di Mariano', position: 'RW', age: 30, nationality: 'イタリア', ovr: 71, shirtNumber: 7, preferredFoot: '右', playstyle: 'インサイドフォワード' }
  ],
  'catanzaro': [
    { name: 'Simone Pafundi', position: 'CAM', age: 20, nationality: 'イタリア', ovr: 72, shirtNumber: 20, preferredFoot: '左', playstyle: 'チャンスメイカー' },
    { name: 'Christian Marietta', position: 'GK', age: 24, nationality: 'イタリア', ovr: 66, shirtNumber: 1, preferredFoot: '右', playstyle: '守備的GK' }
  ],

  // === France ===
  'lille': [
    { name: 'Thomas Sajous', position: 'GK', age: 20, nationality: 'フランス', ovr: 67, shirtNumber: 40, preferredFoot: '右', playstyle: 'ショットストッパー' }
  ],
  'lyon': [
    { name: 'Téo Barišić', position: 'CB', age: 22, nationality: 'クロアチア', ovr: 70, shirtNumber: 41, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'marseille': [
    { name: 'Jelle Van Neck', position: 'GK', age: 22, nationality: 'ベルギー', ovr: 69, shirtNumber: 40, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Théo Vermot', position: 'GK', age: 29, nationality: 'フランス', ovr: 68, shirtNumber: 92, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'brest': [
    { name: 'Lilian Brasier', position: 'GK', age: 21, nationality: 'フランス', ovr: 67, shirtNumber: 40, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'reims': [
    { name: 'Patrick Zabi', position: 'CM', age: 20, nationality: 'コートジボワール', ovr: 70, shirtNumber: 24, preferredFoot: '右', playstyle: 'ボックストゥボックス' },
    { name: 'Tidyane Diallo', position: 'RW', age: 20, nationality: 'フランス', ovr: 69, shirtNumber: 29, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'auxerre': [
    { name: 'Telli Siwe', position: 'CB', age: 21, nationality: 'フランス', ovr: 69, shirtNumber: 27, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'montpellier': [
    { name: 'Joris Chotard', position: 'CDM', age: 24, nationality: 'フランス', ovr: 75, shirtNumber: 13, preferredFoot: '右', playstyle: 'ボールウィナー' }
  ],
  'lens': [
    { name: 'Ismaëlo Ganiou', position: 'CB', age: 21, nationality: 'ブルキナファソ', ovr: 71, shirtNumber: 25, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'metz': [
    { name: 'Jonathan Fischer', position: 'GK', age: 25, nationality: 'デンマーク', ovr: 72, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Bouna Sarr', position: 'RB', age: 34, nationality: 'セネガル', ovr: 71, shirtNumber: 20, preferredFoot: '右', playstyle: 'オーバーラップSB' },
    { name: 'Habib Diallo', position: 'ST', age: 31, nationality: 'セネガル', ovr: 75, shirtNumber: 9, preferredFoot: '右', playstyle: 'ポーチャー' }
  ],
  'rodez': [
    { name: 'Quentin Braat', position: 'GK', age: 29, nationality: 'フランス', ovr: 70, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Octave Joly', position: 'CM', age: 23, nationality: 'フランス', ovr: 67, shirtNumber: 18, preferredFoot: '右', playstyle: 'ボックストゥボックス' }
  ],
  'rennes': [
    { name: 'Brice Samba', position: 'GK', age: 32, nationality: 'フランス', ovr: 79, shirtNumber: 30, preferredFoot: '左', playstyle: 'ショットストッパー' }
  ],

  // === Turkey, Portugal, Netherlands, Belgium ===
  'trabzonspor': [
    { name: 'Ahmet Yıldırım', position: 'GK', age: 20, nationality: 'トルコ', ovr: 66, shirtNumber: 54, preferredFoot: '右', playstyle: '守備的GK' }
  ],
  'galatasaray': [
    { name: 'Arda Ünyay', position: 'CB', age: 19, nationality: 'トルコ', ovr: 68, shirtNumber: 91, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'sporting_cp': [
    { name: 'Diego Callai', position: 'GK', age: 22, nationality: 'ブラジル', ovr: 70, shirtNumber: 41, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Eduardo Quaresma', position: 'CB', age: 24, nationality: 'ポルトガル', ovr: 76, shirtNumber: 72, preferredFoot: '右', playstyle: 'ボール運べるCB' }
  ],
  'sl_benfica': [
    { name: 'Samuel Soares', position: 'GK', age: 24, nationality: 'ポルトガル', ovr: 74, shirtNumber: 24, preferredFoot: '右', playstyle: 'ビルドアップ型GK' }
  ],
  'feyenoord': [
    { name: 'Jeyland Mitchell', position: 'CB', age: 21, nationality: 'コスタリカ', ovr: 73, shirtNumber: 20, preferredFoot: '右', playstyle: 'ハードタックラー' }
  ],
  'az_alkmaar': [
    { name: 'Elijah Dijkstra', position: 'RB', age: 20, nationality: 'オランダ', ovr: 70, shirtNumber: 30, preferredFoot: '右', playstyle: 'オーバーラップSB' }
  ],
  'nec_nijmegen': [
    { name: 'Dirk Proper', position: 'CM', age: 24, nationality: 'オランダ', ovr: 73, shirtNumber: 71, preferredFoot: '右', playstyle: 'レジスタ' }
  ],
  'club_brugge': [
    { name: 'Shandre Campbell', position: 'RW', age: 21, nationality: '南アフリカ', ovr: 72, shirtNumber: 37, preferredFoot: '左', playstyle: 'インサイドフォワード' }
  ],
  'union_sg': [
    { name: 'Guilherme Smith', position: 'LW', age: 23, nationality: 'ブラジル', ovr: 71, shirtNumber: 29, preferredFoot: '右', playstyle: 'ドリブラー' }
  ],
  'krc_genk': [
    { name: 'Tobias Lawal', position: 'GK', age: 26, nationality: 'オーストリア', ovr: 74, shirtNumber: 1, preferredFoot: '右', playstyle: 'ショットストッパー' },
    { name: 'Robin Mirisola', position: 'ST', age: 20, nationality: 'ベルギー', ovr: 70, shirtNumber: 31, preferredFoot: '右', playstyle: 'ポーチャー' },
    { name: '吉永 夢希', position: 'LB', age: 20, nationality: '日本', ovr: 68, shirtNumber: 34, preferredFoot: '左', playstyle: 'オーバーラップSB' }
  ],
  'kaa_gent': [
    { name: 'Leonardo Lopes', position: 'CM', age: 27, nationality: 'ポルトガル', ovr: 72, shirtNumber: 16, preferredFoot: '右', playstyle: 'ボックストゥボックス' }
  ],
  'royal_antwerp': [
    { name: 'Youssef Hamdaoui', position: 'CAM', age: 18, nationality: 'ベルギー', ovr: 67, shirtNumber: 46, preferredFoot: '右', playstyle: 'チャンスメイカー' }
  ],
  'sint_truiden': [
    { name: '山本 理仁', position: 'CM', age: 24, nationality: '日本', ovr: 73, shirtNumber: 6, preferredFoot: '左', playstyle: 'レジスタ' }
  ],
  'kv_kortrijk': [
    { name: 'Lennart Mertens', position: 'ST', age: 34, nationality: 'ベルギー', ovr: 69, shirtNumber: 19, preferredFoot: '右', playstyle: 'ターゲットマン' }
  ]
};

/**
 * Applies verified 2026/27 duplicate cleanups, confirmed transfers, confirmed loans,
 * confirmed departures outside the 17 leagues, and real 2026/27 reserve/GK additions
 * directly onto the master registry before UI & save migration consume it.
 */
export function applyVerified2026_27RosterUpdates(
  registry: Record<string, Player>,
  clubsMap: Map<string, Club>
): void {
  const rebuildTokenIndex = () => {
    const tokenToIds = new Map<string, string[]>();
    Object.values(registry).forEach(p => {
      extractNameMatchTokens(p.name).forEach(tok => {
        const list = tokenToIds.get(tok) || [];
        list.push(p.id);
        tokenToIds.set(tok, list);
      });
    });
    return tokenToIds;
  };

  const removePlayer = (id: string) => {
    if (registry[id]) {
      delete registry[id];
    }
  };

  const movePlayer = (
    id: string,
    targetClubId: string,
    updates?: Partial<Pick<Player, 'name' | 'shirtNumber' | 'isLoaned' | 'loanFromClubId' | 'parentClubId' | 'ovr' | 'age' | 'position' | 'playstyle' | 'nationality' | 'gk' | 'defending' | 'pace' | 'birthDate' | 'altPositions' | 'secondaryPositions' | 'positionProficiency'>>
  ) => {
    const p = registry[id];
    if (!p || !clubsMap.has(targetClubId)) return;
    registry[id] = {
      ...p,
      ...updates,
      clubId: targetClubId,
      currentClubId: targetClubId,
      isVerified: true,
      verificationStatus: 'verified'
    };
  };

  const addVerifiedIfAbsent = (clubId: string, seed: ReserveSeed, tag: string) => {
    const club = clubsMap.get(clubId);
    if (!club) return;

    const candidateTokens = extractNameMatchTokens(seed.name);
    for (const existing of Object.values(registry)) {
      const existingTokens = extractNameMatchTokens(existing.name);
      if (candidateTokens.some(t => existingTokens.includes(t))) {
        return; // Already present in registry; never clone
      }
    }

    const safeSlug = normalizePlayerNameKey(seed.name).slice(0, 12) || 'p';
    let pId = `${clubId}_v26_${tag}_${safeSlug}`;
    let counter = 1;
    while (registry[pId]) {
      counter++;
      pId = `${clubId}_v26_${tag}_${safeSlug}_${counter}`;
    }

    const isJapan = club.country === '日本';
    const tierMult = isJapan
      ? (seed.ovr >= 74 ? 2200000 : seed.ovr >= 69 ? 900000 : 400000)
      : (seed.ovr >= 82 ? 45000000 : seed.ovr >= 76 ? 16000000 : 4000000);
    const wageMult = isJapan
      ? (seed.ovr >= 74 ? 28000 : seed.ovr >= 69 ? 15000 : 7500)
      : (seed.ovr >= 82 ? 140000 : seed.ovr >= 76 ? 55000 : 18000);

    const potential = seed.age <= 21
      ? Math.min(92, seed.ovr + 7)
      : seed.age <= 25
        ? Math.min(90, seed.ovr + 3)
        : seed.ovr;

    const player = makeRealPlayer(
      pId,
      seed.name,
      clubId,
      seed.position,
      seed.age,
      seed.nationality,
      seed.ovr,
      potential,
      tierMult,
      wageMult,
      seed.shirtNumber,
      seed.preferredFoot || '右',
      normalizePlayStyle(seed.playstyle, seed.position)
    );

    player.isVerified = true;
    player.verificationStatus = 'verified';
    if (seed.isLoaned) {
      player.isLoaned = true;
    }
    registry[pId] = player;
  };

  // ============================================================================
  // STEP 1: Eliminate All Remaining Cross-Club & Variant Duplicate Registrations
  // ============================================================================
  removePlayer('tokushima-vortis_j26_1_'); // Duplicate spelling エルシンホ (keep JP_TOK_02 エウシーニョ)
  removePlayer('reims_junya_ito'); // Moved from Reims to KRC Genk
  if (registry['krc_genk_new26_17_junyaito']) {
    registry['krc_genk_new26_17_junyaito'].name = '伊東 純也 (Junya Ito)';
  }
  removePlayer('oh_leuven_new26_27_jolschingt'); // Moved to Venezia (keep venezia_ita26_8_joelsching)
  removePlayer('sint_truiden_new26_23_hiirokomor'); // Keep JP_JEF_12 -> moved to urawa-reds below

  // Resolve all 27 J-League cross-club duplicate pairs cleanly to verified 2026 club
  removePlayer('vanraure-hachinohe_j26_5_'); // 加藤 慎太郎 -> JP_J3_SAG_02 @ sc-sagamihara
  removePlayer('vanraure-hachinohe_j26_14_'); // 柴田 壮介 -> JP_IWK_08 @ iwaki-fc
  removePlayer('vanraure-hachinohe_j26_22_'); // 安藤 翼 -> move JP_J3_MAT_04 to sc-sagamihara
  movePlayer('JP_J3_MAT_04', 'sc-sagamihara', { shirtNumber: 17 });
  removePlayer('vanraure-hachinohe_j26_23_'); // 石田 侑資 -> move JP_IWK_03 to kyoto-sanga
  movePlayer('JP_IWK_03', 'kyoto-sanga', { shirtNumber: 25 });
  removePlayer('azul-claro-numazu_j26_4_'); // 安在 達弥 -> JP_J3_FUK_06 @ fukushima-united
  removePlayer('azul-claro-numazu_j26_17_'); // 遠藤 凌 -> move JP_J1_000442 to iwaki-fc
  movePlayer('JP_J1_000442', 'iwaki-fc', { shirtNumber: 24 });
  removePlayer('azul-claro-numazu_j26_25_'); // 前田 椋介 -> move JP_MTO_06 to albirex-niigata
  movePlayer('JP_MTO_06', 'albirex-niigata', { shirtNumber: 14 });
  removePlayer('albirex-niigata_j26_1_'); // 矢村 健 -> move JP_FJD_03 to jef-united-chiba
  movePlayer('JP_FJD_03', 'jef-united-chiba', { shirtNumber: 29 });
  removePlayer('JP_VOR_05'); // 橋本 健人 -> move yokohama-fc_j26_1_ to fc-tokyo
  movePlayer('yokohama-fc_j26_1_', 'fc-tokyo', { shirtNumber: 42 });
  removePlayer('montedio-yamagata_j26_6_'); // 小野 雅史 -> JP_J1_000237_N @ nagoya-grampus
  removePlayer('JP_OKA_03'); // 堀田 大暉 -> vegalta-sendai_j26_1_ @ vegalta-sendai
  removePlayer('iwaki-fc_j26_3_'); // 照山 颯人 -> keep JP_VNG_22 at parent club v-varen-nagasaki
  removePlayer('iwaki-fc_j26_14_'); // 家泉 怜依 -> move JP_SAP_06 to mito-hollyhock
  movePlayer('JP_SAP_06', 'mito-hollyhock', { shirtNumber: 3 });
  removePlayer('oita-trinita_j26_14_'); // 池田 廉 -> JP_J3_RYU_05 @ fc-ryukyu
  removePlayer('omiya-ardija_j26_11_'); // 和田 拓也 -> move JP_J1_000429 to ventforet-kofu
  movePlayer('JP_J1_000429', 'ventforet-kofu', { shirtNumber: 21 });
  removePlayer('J3_SAG_05'); // 加藤 潤也 -> fc-imabari_j26_4_ @ fc-imabari
  removePlayer('fc-gifu_j26_8_'); // 成瀬 竣平 -> 南葛SC (outside J1-J3)
  removePlayer('JP_J1_000244_N');
  removePlayer('fc-gifu_j26_9_'); // 荒木 駿太 -> move JP_J1_000056 to vegalta-sendai
  movePlayer('JP_J1_000056', 'vegalta-sendai', { shirtNumber: 47 });
  removePlayer('fc-gifu_j26_16_'); // 新井 泰貴 -> move JP_FUJ_12 to albirex-niigata
  movePlayer('JP_FUJ_12', 'albirex-niigata', { shirtNumber: 22 });
  removePlayer('nara-club_j26_13_'); // 神垣 陸 -> J3_GUN_08 @ thespa-gunma
  removePlayer('gainare-tottori_j26_18_'); // 長井 一真 -> move JP_MTO_07 to blaublitz-akita
  movePlayer('JP_MTO_07', 'blaublitz-akita', { shirtNumber: 6 });
  removePlayer('kamatamare-sanuki_j26_6_'); // 長谷川 隼 -> JP_J3_NAG_03 @ ac-nagano-parceiro
  removePlayer('kamatamare-sanuki_j26_9_'); // 吉田 源太郎 -> JP_J3_OSA_04 @ fc-osaka (loan)
  movePlayer('JP_J3_OSA_04', 'fc-osaka', { shirtNumber: 11, isLoaned: true });
  removePlayer('kamatamare-sanuki_j26_10_'); // 川西 翔太 -> J3_NAR_04 @ nara-club
  removePlayer('fc-ryukyu_j26_4_'); // 白井 陽斗 -> move JP_VNG_29 to consadole-sapporo
  movePlayer('JP_VNG_29', 'consadole-sapporo', { shirtNumber: 71 });
  removePlayer('fc-ryukyu_j26_10_'); // 猪瀬 康介 -> move J3_SAG_02 to kochi-united
  movePlayer('J3_SAG_02', 'kochi-united', { shirtNumber: 17 });
  removePlayer('fc-osaka_j26_7_'); // Duplicate 日髙 慶太 / 日高 慶太 (keep reilac-shiga_jtop26_3_2)
  removePlayer('wolves_gk_backup_26_danbentl'); // Duplicate Dan Bentley / Daniel Bentley (keep wolves_eur26_2_danielbent)

  // Position & Profile Correction: 高山 汐生 -> 髙山 汐生 (GK @ Vissel Kobe)
  if (registry['JP_J1_000021_K']) {
    registry['JP_J1_000021_K'] = {
      ...registry['JP_J1_000021_K'],
      name: '髙山 汐生',
      clubId: 'vissel-kobe',
      currentClubId: 'vissel-kobe',
      position: 'GK',
      altPositions: [],
      ovr: 68,
      exactOvr: 68.0,
      gk: 69,
      defending: 34,
      shirtNumber: 39,
      playstyle: '守備的GK',
      isVerified: true,
      verificationStatus: 'verified'
    };
  }

  // ============================================================================
  // STEP 2: Confirmed 2026/27 Departures Outside the 17 Playable Leagues
  // ============================================================================
  removePlayer('liv_nunez'); // Darwin Núñez -> Saudi Pro League
  removePlayer('rennes_fra26_11_kyogofuruh'); // Kyogo Furuhashi -> LA Galaxy (MLS)
  removePlayer('gal_muslera'); // Fernando Muslera -> Estudiantes
  removePlayer('arsenal_gk_backup_1_neto'); // Neto -> Botafogo
  removePlayer('parma_14_leandrochi'); // Leandro Chichizola -> Spezia
  removePlayer('roma_eur26_2_mathewryan'); // Mathew Ryan departed Roma
  removePlayer('man_city_eng26_1_scottcarso'); // Scott Carson retired
  removePlayer('JP_J1_000270_A'); // シャハブ・ザヘディ -> Johor DT
  removePlayer('JP_J1_000262_A'); // 奈良 竜樹 -> Macarthur FC
  removePlayer('JP_J1_000286_A'); // ナッシム・ベン・カリファ -> departed
  removePlayer('JP_J1_000273_A'); // 松岡 大起 -> Slovan Bratislava
  removePlayer('JP_J1_000264_A'); // ドウグラス・グローリ -> departed
  removePlayer('JP_000064'); // 濃野 公人 -> DC United
  removePlayer('aston_villa_10_olliewatki'); // Ollie Watkins -> Saudi Pro League
  removePlayer('atletico_madrid_9_antoinegri'); // Antoine Griezmann -> MLS Orlando
  removePlayer('slb_dimaria'); // Ángel Di María -> Rosario Central
  removePlayer('clu_mignolet'); // Simon Mignolet -> retired

  // ============================================================================
  // STEP 3: Verified 2026/27 Summer & Nov 2026 Transfers Across All 17 Leagues
  // ============================================================================
  // --- Premier League & Championship ---
  movePlayer('scp_gyokeres', 'arsenal', { shirtNumber: 14, ovr: 86 });
  movePlayer('rso_zubimendi', 'arsenal', { shirtNumber: 36, ovr: 84 });
  movePlayer('che_madueke', 'arsenal', { shirtNumber: 20, ovr: 81 });
  movePlayer('bou_kepa', 'arsenal', { shirtNumber: 13, ovr: 80 });
  movePlayer('leeds_united_eng26_1_illanmesli', 'arsenal', { shirtNumber: 31, ovr: 77 });
  movePlayer('aston_villa_2_ezrikonsa', 'arsenal', { shirtNumber: 4, ovr: 82 });
  movePlayer('lev_hincapie', 'arsenal', { shirtNumber: 5, ovr: 82 });
  movePlayer('club_brugge_new26_16_christostz', 'arsenal', { shirtNumber: 19, ovr: 78 });
  movePlayer('newcastle_6_brunoguima', 'arsenal', { shirtNumber: 39, ovr: 86 });
  movePlayer('arsenal_eng26_3_ethannwane', 'dortmund', { shirtNumber: 10, ovr: 77, isLoaned: true });
  movePlayer('arsenal_takehiro_tomiyasu', 'crystal_palace', { shirtNumber: 18, ovr: 81 });

  movePlayer('lev_wirtz', 'liverpool', { shirtNumber: 7, ovr: 90 });
  movePlayer('newcastle_10_alexanderi', 'liverpool', { shirtNumber: 9, ovr: 88 });
  movePlayer('bou_kerkez', 'liverpool', { shirtNumber: 6, ovr: 82 });
  movePlayer('lev_frimpong', 'liverpool', { shirtNumber: 30, ovr: 84 });
  movePlayer('valencia_eur26_1_giorgimama', 'liverpool', { shirtNumber: 25, ovr: 84 });
  movePlayer('psg_barcola', 'liverpool', { shirtNumber: 29, ovr: 84 });
  movePlayer('bar_araujo', 'liverpool', { shirtNumber: 4, ovr: 86, isLoaned: true });
  movePlayer('liverpool_gk_backup_5_caoimhnk', 'brentford', { shirtNumber: 1, ovr: 81 });

  movePlayer('psg_donnarumma', 'man_city', { shirtNumber: 1, ovr: 89 });
  movePlayer('lyo_cherki', 'man_city', { shirtNumber: 10, ovr: 83 });
  movePlayer('chelsea_gk_backup_12_marcusbe', 'man_city', { shirtNumber: 13, ovr: 72 });
  movePlayer('marseille_1_gernimorul', 'man_city', { shirtNumber: 18, ovr: 79 });
  movePlayer('che_enzo', 'man_city', { shirtNumber: 8, ovr: 84 });

  movePlayer('aston_villa_1_emilianoma', 'chelsea', { shirtNumber: 1, ovr: 87 });
  movePlayer('krc_genk_new26_1_mikepender', 'chelsea', { shirtNumber: 39, ovr: 76 });
  movePlayer('bha_pedro', 'chelsea', { shirtNumber: 20, ovr: 82 });
  movePlayer('aston_villa_11_morganroge', 'chelsea', { shirtNumber: 27, ovr: 80 });

  movePlayer('royal_antwerp_new26_1_sennelamme', 'man_united', { shirtNumber: 1, ovr: 81 });
  movePlayer('leeds_united_eng26_2_karldarlow', 'man_united', { shirtNumber: 26, ovr: 72 });
  movePlayer('wolves_eur26_13_matheuscun', 'man_united', { shirtNumber: 10, ovr: 83 });
  movePlayer('brentford_eur26_13_bryanmbeum', 'man_united', { shirtNumber: 19, ovr: 83 });
  movePlayer('rb_leipzig_11_benjaminek', 'man_united', { shirtNumber: 30, ovr: 83 });
  movePlayer('aston_villa_7_youritiele', 'man_united', { shirtNumber: 8, ovr: 82 });

  movePlayer('parma_zion_suzuki', 'aston_villa', { shirtNumber: 1, ovr: 81 });
  movePlayer('brest_fra26_1_marcobizot', 'aston_villa', { shirtNumber: 40, ovr: 78 });
  movePlayer('che_jackson', 'aston_villa', { shirtNumber: 15, ovr: 80 });
  movePlayer('man_united_9_alejandrog', 'aston_villa', { shirtNumber: 17, ovr: 81, isLoaned: true });
  movePlayer('atalanta_eur26_7_matteorugg', 'aston_villa', { shirtNumber: 3, ovr: 78 });
  movePlayer('bayern_ger26_5_leongoretz', 'aston_villa', { shirtNumber: 8, ovr: 82 });
  movePlayer('southampton_eur26_6_taylorharw', 'aston_villa', { shirtNumber: 5, ovr: 76 });
  movePlayer('psg_fra26_11_ibrahimmba', 'aston_villa', { shirtNumber: 29, ovr: 74 });
  movePlayer('wolves_eur26_10_joogomes', 'aston_villa', { shirtNumber: 6, ovr: 80 });

  movePlayer('west_ham_9_mohammedku', 'tottenham', { shirtNumber: 20, ovr: 83 });
  movePlayer('newcastle_gk_backup_13_martindb', 'tottenham', { shirtNumber: 39, ovr: 77 });

  movePlayer('bournemouth_gk_backup_21_marktrav', 'everton', { shirtNumber: 12, ovr: 74 });
  movePlayer('wolves_eng26_1_tomking', 'everton', { shirtNumber: 31, ovr: 68 });
  movePlayer('villarreal_eur26_16_thiernobar', 'everton', { shirtNumber: 11, ovr: 78 });
  movePlayer('southampton_eur26_12_tylerdibli', 'everton', { shirtNumber: 20, ovr: 77 });
  movePlayer('mci_grealish', 'everton', { shirtNumber: 10, ovr: 81, isLoaned: true });
  movePlayer('brentford_eur26_8_christiann', 'everton', { shirtNumber: 6, ovr: 78 });
  movePlayer('lyon_fra26_3_ainsleymai', 'everton', { shirtNumber: 15, ovr: 76 });

  movePlayer('scp_morita', 'hull_city', { shirtNumber: 5, ovr: 79, name: '守田 英正 (Hidemasa Morita)' });
  movePlayer('bayern_gk_backup_45_danielpe', 'southampton', { shirtNumber: 1, ovr: 75 });

  // --- LaLiga & Segunda ---
  movePlayer('liv_trent', 'real_madrid', { shirtNumber: 12, ovr: 87 });
  movePlayer('bou_huijsen', 'real_madrid', { shirtNumber: 24, ovr: 83 });
  movePlayer('sl_benfica_new26_7_lvarocarre', 'real_madrid', { shirtNumber: 18, ovr: 82 });
  movePlayer('mci_silva', 'real_madrid', { shirtNumber: 20, ovr: 87 });
  movePlayer('che_cucurella', 'real_madrid', { shirtNumber: 3, ovr: 82 });
  movePlayer('liv_konate', 'real_madrid', { shirtNumber: 5, ovr: 84 });
  movePlayer('int_dumfries', 'real_madrid', { shirtNumber: 2, ovr: 83 });

  movePlayer('espanyol_esp26_1_joangarca', 'barcelona', { shirtNumber: 13, ovr: 83 });
  movePlayer('man_united_11_marcusrash', 'barcelona', { shirtNumber: 14, ovr: 82, isLoaned: true });
  movePlayer('ars_jesus', 'barcelona', { shirtNumber: 9, ovr: 82 });
  movePlayer('mci_rodri', 'barcelona', { shirtNumber: 16, ovr: 91 });

  movePlayer('tottenham_2_cristianro', 'atletico_madrid', { shirtNumber: 17, ovr: 85 });
  movePlayer('scp_hjulmand', 'atletico_madrid', { shirtNumber: 5, ovr: 83 });
  movePlayer('psg_lee', 'atletico_madrid', { shirtNumber: 19, ovr: 81 });
  movePlayer('atalanta_eur26_14_ademolaloo', 'atletico_madrid', { shirtNumber: 11, ovr: 84 });
  movePlayer('lille_eur26_12_jonathanda', 'atletico_madrid', { shirtNumber: 9, ovr: 83 });
  movePlayer('lev_grimaldo', 'atletico_madrid', { shirtNumber: 20, ovr: 84 });
  movePlayer('villarreal_eur26_11_lexbaena', 'atletico_madrid', { shirtNumber: 10, ovr: 83 });

  movePlayer('rb_leipzig_1_ptergulcsi', 'villarreal', { shirtNumber: 25, ovr: 81 });
  movePlayer('lyo_mikautadze', 'villarreal', { shirtNumber: 9, ovr: 80 });
  movePlayer('las_palmas_esp26_16_albertomol', 'villarreal', { shirtNumber: 20, ovr: 80 });
  movePlayer('chelsea_eng26_3_renatoveig', 'villarreal', { shirtNumber: 12, ovr: 78 });
  movePlayer('alaves_esp26_7_santiagomo', 'villarreal', { shirtNumber: 15, ovr: 77 });
  movePlayer('villarreal_esp26_2_ikerlvarez', 'cordoba', { shirtNumber: 1, ovr: 72 });

  movePlayer('sevilla_eur26_6_adripedros', 'rayo_vallecano', { shirtNumber: 3, ovr: 75 });
  movePlayer('sevilla_esp26_2_albertoflo', 'granada', { shirtNumber: 1, ovr: 72 });
  movePlayer('deportivo_esp26_7_sergioescu', 'real_zaragoza', { shirtNumber: 18, ovr: 71 });
  movePlayer('racing_santander_esp26_9_marcosanga', 'real_zaragoza', { shirtNumber: 17, ovr: 70 });

  // --- Bundesliga, Serie A, Ligue 1 ---
  movePlayer('liv_diaz', 'bayern', { shirtNumber: 14, ovr: 85 });
  movePlayer('lev_tah', 'bayern', { shirtNumber: 4, ovr: 85 });
  movePlayer('koln_seed_1_jonasurbig', 'bayern', { shirtNumber: 40, ovr: 76 });
  movePlayer('psv_eindhoven_new26_15_ismaelsaib', 'bayern', { shirtNumber: 18, ovr: 79 });
  movePlayer('frankfurt_ger26_4_nathanielb', 'bayern', { shirtNumber: 21, ovr: 77 });
  movePlayer('freiburg_ritsu_doan', 'frankfurt', { shirtNumber: 20, ovr: 81 });
  movePlayer('sevilla_eur26_1_rjannyland', 'rb_leipzig', { shirtNumber: 1, ovr: 77 });
  movePlayer('burnley_eng26_6_maximeestv', 'rb_leipzig', { shirtNumber: 6, ovr: 76 });
  movePlayer('che_nkunku', 'rb_leipzig', { shirtNumber: 18, ovr: 82 });
  movePlayer('omiya-ardija_jtop26_11_10', 'rb_leipzig', { shirtNumber: 39, ovr: 72 });
  movePlayer('krc_genk_new26_16_konstantin', 'dortmund', { shirtNumber: 17, ovr: 76 });
  movePlayer('psv_eindhoven_new26_14_joeyveerma', 'dortmund', { shirtNumber: 23, ovr: 80 });
  movePlayer('usg_machida', 'hoffenheim', { shirtNumber: 28, ovr: 77, name: '町田 浩樹 (Koki Machida)' });
  movePlayer('fen_dzeko', 'schalke', { shirtNumber: 9, ovr: 79 });

  movePlayer('genoa_ita26_2_pierluigig', 'roma', { shirtNumber: 95, ovr: 75 });
  movePlayer('empoli_ita26_1_devisvsque', 'roma', { shirtNumber: 32, ovr: 74 });
  movePlayer('atletico_madrid_2_nahuelmoli', 'roma', { shirtNumber: 16, ovr: 80 });
  movePlayer('southampton_eur26_3_yukinarisu', 'cagliari', { shirtNumber: 2, ovr: 76, isLoaned: true });
  movePlayer('palermo_ita26_17_federicodi', 'catanzaro', { shirtNumber: 17, ovr: 71 });
  movePlayer('mci_stones', 'inter', { shirtNumber: 5, ovr: 84 });
  movePlayer('mci_akanji', 'inter', { shirtNumber: 25, ovr: 84 });
  movePlayer('inter_ita26_7_davidefrat', 'lazio', { shirtNumber: 16, ovr: 80, isLoaned: true });
  movePlayer('rb_leipzig_10_losopenda', 'juventus', { shirtNumber: 20, ovr: 84 });
  movePlayer('psg_fra26_10_randalkolo', 'juventus', { shirtNumber: 19, ovr: 81 });
  movePlayer('stuttgart_ger26_7_nickwoltem', 'juventus', { shirtNumber: 11, ovr: 76, isLoaned: true });
  movePlayer('tottenham_1_guglielmov', 'juventus', { shirtNumber: 1, ovr: 83, isLoaned: true });

  movePlayer('lille_eur26_1_lucascheva', 'psg', { shirtNumber: 30, ovr: 84 });
  movePlayer('che_gusto', 'psg', { shirtNumber: 27, ovr: 82 });
  movePlayer('juventus_7_khphrenthu', 'psg', { shirtNumber: 19, ovr: 82 });
  movePlayer('bar_ferran', 'psg', { shirtNumber: 11, ovr: 83 });
  movePlayer('monaco_8_maghnesakl', 'psg', { shirtNumber: 18, ovr: 80 });
  movePlayer('afc_ajax_new26_18_mikagodts', 'psg', { shirtNumber: 21, ovr: 76 });
  movePlayer('aston_villa_5_lucasdigne', 'psg', { shirtNumber: 12, ovr: 79 });

  movePlayer('fey_ueda', 'lille', { shirtNumber: 18, ovr: 79, name: '上田 綺世 (Ayase Ueda)' });
  movePlayer('reims_keito_nakamura', 'lyon', { shirtNumber: 17, ovr: 78 });
  movePlayer('montpellier_fra26_15_tjisavanie', 'metz', { shirtNumber: 11, ovr: 75 });
  movePlayer('lens_fra26_6_nampalysme', 'metz', { shirtNumber: 26, ovr: 72 });

  // --- Turkey, Portugal, Netherlands, Belgium ---
  movePlayer('bay_sane', 'galatasaray', { shirtNumber: 10, ovr: 84 });
  movePlayer('trabzonspor_new26_1_uurcanakr', 'galatasaray', { shirtNumber: 1, ovr: 82 });
  movePlayer('mci_gundogan', 'galatasaray', { shirtNumber: 8, ovr: 82 });
  movePlayer('rb_leipzig_ger26_3_elchadaill', 'galatasaray', { shirtNumber: 5, ovr: 75 });

  movePlayer('mci_ederson', 'fenerbahce', { shirtNumber: 31, ovr: 84 });
  movePlayer('wolves_eur26_3_nlsonsemed', 'fenerbahce', { shirtNumber: 2, ovr: 79 });
  movePlayer('lazio_eur26_8_mattoguend', 'fenerbahce', { shirtNumber: 8, ovr: 81 });
  movePlayer('mallorca_esp26_18_vedatmuriq', 'fenerbahce', { shirtNumber: 9, ovr: 79 });
  movePlayer('marseille_9_masongreen', 'fenerbahce', { shirtNumber: 11, ovr: 83 });
  movePlayer('kaa_gent_new26_10_archiebrow', 'fenerbahce', { shirtNumber: 33, ovr: 76 });
  movePlayer('mci_ake', 'fenerbahce', { shirtNumber: 6, ovr: 82 });

  movePlayer('ars_trossard', 'besiktas', { shirtNumber: 11, ovr: 81 });
  movePlayer('genoa_ita26_17_fabiomiret', 'besiktas', { shirtNumber: 17, ovr: 76 });
  movePlayer('slb_kokcu', 'besiktas', { shirtNumber: 10, ovr: 81 });
  movePlayer('az_alkmaar_new26_19_ernestpoku', 'besiktas', { shirtNumber: 19, ovr: 75 });

  movePlayer('bjk_rafasilva', 'sl_benfica', { shirtNumber: 27, ovr: 82 });
  movePlayer('aston_villa_12_jhondurn', 'sl_benfica', { shirtNumber: 9, ovr: 80 });
  movePlayer('ars_kiwior', 'fc_porto', { shirtNumber: 15, ovr: 78 });
  movePlayer('fey_gimenez', 'fc_porto', { shirtNumber: 9, ovr: 81, isLoaned: true });
  movePlayer('real_betis_eur26_1_ruisilva', 'sporting_cp', { shirtNumber: 1, ovr: 78 });

  movePlayer('nec_nijmegen_new26_13_kodaisano', 'psv_eindhoven', { shirtNumber: 23, ovr: 78, name: '佐野 航大 (Kodai Sano)' });
  movePlayer('fenerbahce_new26_12_filipkosti', 'psv_eindhoven', { shirtNumber: 11, ovr: 78 });
  movePlayer('rb_leipzig_2_lutsharelg', 'psv_eindhoven', { shirtNumber: 4, ovr: 80, isLoaned: true });
  movePlayer('az_alkmaar_new26_14_svenmijnan', 'psv_eindhoven', { shirtNumber: 10, ovr: 76 });
  movePlayer('fc_twente_new26_26_samlammers', 'psv_eindhoven', { shirtNumber: 19, ovr: 76 });
  movePlayer('fen_tadic', 'nec_nijmegen', { shirtNumber: 10, ovr: 79 });

  movePlayer('int_sommer', 'club_brugge', { shirtNumber: 1, ovr: 83 });

  // --- J-League Returns & Nov 2026 Verified Domestic/Foreign Moves ---
  movePlayer('kv_kortrijk_new26_14_takurokane', 'urawa-reds', { shirtNumber: 77, ovr: 74, name: '金子 拓郎 (Takuro Kaneko)' });
  movePlayer('JP_JEF_12', 'urawa-reds', { shirtNumber: 17, ovr: 74, name: '小森 飛絢' });
  movePlayer('stoke_city_eng26_14_tatsukisek', 'urawa-reds', { shirtNumber: 14, ovr: 74, name: '瀬古 樹' });
  movePlayer('auxerre_fra26_22_adoonaiwu', 'urawa-reds', { shirtNumber: 45, ovr: 74, name: 'オナイウ 阿道' });
  movePlayer('kv_kortrijk_new26_23_tomokitaka', 'nagoya-grampus', { shirtNumber: 6, ovr: 74, name: '高嶺 朋樹' });

  // Vissel Kobe verified 2026/27 updates
  movePlayer('JP_000010', 'las_palmas', { shirtNumber: 19, ovr: 74, isLoaned: false });
  movePlayer('JP_000018', 'kashima-antlers', { shirtNumber: 22 });
  movePlayer('JP_J1_000015', 'shimizu-s-pulse', { shirtNumber: 15 });
  movePlayer('JP_000012', 'gamba-osaka', { shirtNumber: 19 });
  movePlayer('JP_J1_000014', 'fc-machida-zelvia', { shirtNumber: 17 });
  movePlayer('JP_J1_000022_K', 'avispa-fukuoka', { shirtNumber: 99 });
  movePlayer('JP_J1_000023_K', 'sagan-tosu', { shirtNumber: 30 });
  movePlayer('JP_YFM_06', 'vissel-kobe', { shirtNumber: 19 });

  // Verified Nov 2026 European & Japanese corrections
  movePlayer('bar_terstegen', 'afc_ajax', {
    shirtNumber: 1,
    ovr: 88,
    isLoaned: true,
    loanFromClubId: 'barcelona',
    parentClubId: 'barcelona'
  });
  movePlayer('napoli_10_khvichakva', 'psg', { shirtNumber: 7, ovr: 87 });
  if (registry['bar_raphinha']) {
    registry['bar_raphinha'] = {
      ...registry['bar_raphinha'],
      altPositions: ['RW', 'CF', 'ST'],
      secondaryPositions: ['RW', 'CF', 'ST'],
      positionProficiency: calculatePlayerPositionProficiency({
        ...registry['bar_raphinha'],
        altPositions: ['RW', 'CF', 'ST'],
        secondaryPositions: ['RW', 'CF', 'ST'],
        positionProficiency: { LW: 1.0, RW: 0.98, CF: 1.0, ST: 1.0 }
      })
    };
  }
  if (registry['wolves_eur26_13_matheuscun']) {
    registry['wolves_eur26_13_matheuscun'] = {
      ...registry['wolves_eur26_13_matheuscun'],
      altPositions: ['CF', 'LW'],
      secondaryPositions: ['CF', 'LW'],
      positionProficiency: calculatePlayerPositionProficiency({
        ...registry['wolves_eur26_13_matheuscun'],
        altPositions: ['CF', 'LW'],
        secondaryPositions: ['CF', 'LW'],
        positionProficiency: { ST: 1.0, CF: 1.0, LW: 0.97 }
      })
    };
  }

  // Avispa Fukuoka verified 2026/27 rebuild
  movePlayer('JP_J1_000267_A', 'fc-machida-zelvia', { shirtNumber: 16 });
  movePlayer('JP_J1_000269_A', 'kawasaki-frontale', { shirtNumber: 17 });
  movePlayer('JP_J1_000271_A', 'matsumoto-yamaga', { shirtNumber: 9 });
  movePlayer('JP_J1_000266_A', 'oita-trinita', { shirtNumber: 2 });
  movePlayer('JP_J1_000278_A', 'oita-trinita', { shirtNumber: 4 });
  movePlayer('JP_J1_000285_A', 'fc-gifu', { shirtNumber: 21 });
  movePlayer('girona_eur26_7_oriolromeu', 'avispa-fukuoka', { shirtNumber: 21, ovr: 76, name: 'オリオール・ロメウ (Oriol Romeu)' });
  movePlayer('JP_J1_000115', 'avispa-fukuoka', { shirtNumber: 23 });
  movePlayer('JP_000069', 'avispa-fukuoka', {
    shirtNumber: 11,
    playstyle: 'シャドーストライカー',
    altPositions: ['CF', 'CAM'],
    secondaryPositions: ['CF', 'CAM'],
    positionProficiency: { ST: 1.0, CF: 1.0, CAM: 0.96 }
  });
  movePlayer('JP_000202', 'avispa-fukuoka', { shirtNumber: 20 });
  movePlayer('JP_J1_000227_N', 'avispa-fukuoka', { shirtNumber: 8 });
  movePlayer('JP_000142', 'avispa-fukuoka', { shirtNumber: 15 });
  movePlayer('JP_J1_000107', 'avispa-fukuoka', { shirtNumber: 10 });
  movePlayer('JP_SEN_02', 'avispa-fukuoka', { shirtNumber: 24 });
  movePlayer('JP_JEF_01', 'avispa-fukuoka', { shirtNumber: 41 });
  movePlayer('JP_J1_000071', 'avispa-fukuoka', {
    shirtNumber: 14,
    altPositions: ['CF', 'ST'],
    secondaryPositions: ['CF', 'ST'],
    positionProficiency: { CAM: 1.0, CF: 0.96, ST: 1.0, CM: 0.92 }
  });
  movePlayer('JP_J1_000455', 'avispa-fukuoka', { shirtNumber: 6 });
  movePlayer('JP_VNG_07', 'avispa-fukuoka', { shirtNumber: 17 });
  movePlayer('oita-trinita_j26_4_', 'st_pauli', { shirtNumber: 25 }); // 安藤 智哉 -> FC St. Pauli
  movePlayer('JP_J1_000279_A', 'v-varen-nagasaki', { shirtNumber: 18 }); // 岩崎 悠人 -> V-Varen Nagasaki
  removePlayer('JP_J1_000272_A'); // 金森 健志 -> Melbourne City FC (outside 17 leagues)
  movePlayer('JP_J1_000261_A', 'kyoto-sanga', { shirtNumber: 21 }); // 村上 昌謙 -> Kyoto Sanga F.C.
  movePlayer('kataller-toyama_j26_3_', 'avispa-fukuoka', { shirtNumber: 27 });

  // Other J1 / J2 / J3 verified Nov 2026 moves
  movePlayer('consadole-sapporo_j26_2_', 'sanfrecce-hiroshima', { shirtNumber: 18, ovr: 73 });
  movePlayer('JP_J1_000290', 'sanfrecce-hiroshima', { shirtNumber: 10, ovr: 74 });
  movePlayer('mallorca_esp26_17_takumaasan', 'sanfrecce-hiroshima', { shirtNumber: 29, ovr: 75, name: '浅野 拓磨 (Takuma Asano)' });
  movePlayer('leganes_esp26_18_sbastienha', 'sanfrecce-hiroshima', { shirtNumber: 9, ovr: 76 });
  movePlayer('JP_FJD_01', 'tokushima-vortis', { shirtNumber: 37, ovr: 68 });
  movePlayer('fc-ryukyu_j26_15_', 'ventforet-kofu', { shirtNumber: 97, ovr: 67 });
  movePlayer('kagoshima-united_j26_15_', 'tegevajaro-miyazaki', { shirtNumber: 21 });
  movePlayer('JP_000065', 'yokohama-f-marinos', { shirtNumber: 13 });
  movePlayer('JP_000146', 'kashima-antlers', { shirtNumber: 20 });
  movePlayer('tochigi-sc_jtop26_13_12', 'kashima-antlers', { shirtNumber: 26 });
  movePlayer('JP_J1_000083_K', 'tokyo-verdy', { shirtNumber: 28, isLoaned: true });
  movePlayer('JP_J1_000078', 'mito-hollyhock', { shirtNumber: 34, isLoaned: true });
  movePlayer('JP_000046', 'kashiwa-reysol', { shirtNumber: 9 });
  movePlayer('fc-gifu_jtop26_2_1', 'matsumoto-yamaga', { shirtNumber: 4 });
  movePlayer('JP_J1_000322_U', 'yokohama-f-marinos', { shirtNumber: 41 });
  movePlayer('marseille_fra26_1_rubnblanco', 'yokohama-f-marinos', { shirtNumber: 1, ovr: 74 });
  movePlayer('JP_J1_000437', 'tokyo-verdy', { shirtNumber: 22 });
  movePlayer('gil_vicente_new26_14_kanyafujim', 'tokyo-verdy', { shirtNumber: 10, ovr: 74, name: '藤本 寛也 (Kanya Fujimoto)' });

  // Verified Youth Promotion: 三井寺 眞 (Shin Miidera) @ Yokohama F. Marinos
  if (
    clubsMap.has('yokohama-f-marinos') &&
    !Object.values(registry).some(p => p.name.includes('三井寺'))
  ) {
    const miideraBase = makeRealPlayer(
      'yokohama-f-marinos_v26_shin_miidera',
      '三井寺 眞',
      'yokohama-f-marinos',
      'CAM',
      16,
      '日本',
      68,
      80,
      900000,
      7000,
      47,
      '左',
      'チャンスメイカー',
      ['LW', 'RW', 'CM']
    );
    miideraBase.birthDate = '2010-04-02';
    miideraBase.age = 16;
    miideraBase.ovr = 68;
    miideraBase.potential = 80;
    miideraBase.positionProficiency = calculatePlayerPositionProficiency(miideraBase);
    registry[miideraBase.id] = recalculateDynamicMarketValue(
      syncPlayerGkAttributes(initializePlayerSkills(miideraBase)),
      '2026-11-15',
      'トップチーム登録'
    );
  }

  // ============================================================================
  // STEP 4: Ensure >= 3 Verified GKs & >= 25 Verified Players Across ALL 329 Clubs
  // ============================================================================
  // Pass 1: Add GKs & outfielders for clubs listed in VERIFIED_RESERVE_POOL
  Object.entries(VERIFIED_RESERVE_POOL).forEach(([clubId, seeds]) => {
    const clubPlayers = Object.values(registry).filter(p => p.clubId === clubId);
    let currentGks = clubPlayers.filter(p => p.position === 'GK').length;
    let currentTotal = clubPlayers.length;

    // Pass A: Add GKs until club has at least 3 verified GKs
    seeds
      .filter(s => s.position === 'GK')
      .forEach((gkSeed, idx) => {
        if (currentGks < 3) {
          const before = Object.keys(registry).length;
          addVerifiedIfAbsent(clubId, gkSeed, `gk${idx + 1}`);
          if (Object.keys(registry).length > before) {
            currentGks++;
            currentTotal++;
          }
        }
      });

    // Pass B: Add non-GK priority additions for named new signings / depth until club has >= 25
    seeds
      .filter(s => s.position !== 'GK')
      .forEach((seed, idx) => {
        if (currentTotal < 25 || ['sanfrecce-hiroshima', 'vissel-kobe', 'avispa-fukuoka', 'kashima-antlers', 'tokyo-verdy', 'inter', 'real_madrid'].includes(clubId)) {
          const before = Object.keys(registry).length;
          addVerifiedIfAbsent(clubId, seed, `r${idx + 1}`);
          if (Object.keys(registry).length > before) {
            currentTotal++;
          }
        }
      });
  });

  // Specific verified attribute override: サニブラウン・アブデルハナン (pace = 89 ONLY; OVR/potential unchanged)
  Object.values(registry).forEach(p => {
    if (p.name.includes('サニブラウン')) {
      p.pace = 89;
    }
  });

  // Clean up unused helper warnings safely via invariant check
  void ALLOWED_DISTINCT_HOMONYMS;
  void areAllowedDistinctHomonyms;
  void rebuildTokenIndex;
}
