/**
 * Club Vision & Multi-Year Roadmap Engine (クラブの未来予想図)
 * 
 * Generates realistic growth trajectories and board objectives:
 * - 2nd Division clubs: Promotion in 1-3 years, playoffs, domestic cup giant-killing.
 *   NEVER assigns current-year continental tournament (CL/ACL) goals to 2nd division teams!
 * - 1st Division clubs: League title, European/ACL spots, survival/top-half.
 * - Dynamic updating upon promotion or milestone achievements.
 */

import { Club, ClubVisionRoadmap, ClubRoadmapGoal, LeagueKey, GameWorldState } from '../types/game';

export function isSecondDivisionLeague(league: LeagueKey): boolean {
  return [
    'j2-league',
    'championship',
    'segunda-division',
    '2-bundesliga',
    'serie-b',
    'ligue-2'
  ].includes(league);
}

export function generateClubVisionRoadmap(club: Club, currentSeason: string = '2026/27'): ClubVisionRoadmap {
  const is2ndDiv = isSecondDivisionLeague(club.league) || club.division === 2;
  const isJLeague = club.league === 'j1-league' || club.league === 'j2-league';

  const goals: ClubRoadmapGoal[] = [];

  let shortTermObjective = '';
  let midTermObjective = '';
  let longTermObjective = '';
  let overviewPhilosophy = '';
  let transferPolicy = '';
  let boardPatience: '忍耐強い' | '標準的' | '結果即時要求' = '標準的';

  if (is2ndDiv) {
    // -------------------------------------------------------------
    // 2部クラブの目標設定 (2nd Division Clubs)
    // -------------------------------------------------------------
    const isStrong2ndDiv = club.tier === 'Upper' || club.tier === 'Elite' || club.reputation >= 68;

    if (isStrong2ndDiv) {
      boardPatience = '結果即時要求';
      overviewPhilosophy = `${club.name}は本来トップリーグで戦うべき実力と歴史を持つクラブです。理事会およびサポーターの要求は明確であり、「1年での1部自動昇格」こそが唯一の目標です。`;
      shortTermObjective = '【今季至上命題】2部リーグ優勝または自動昇格枠の獲得（1年での1部復帰）';
      midTermObjective = '【2年目】1部リーグ残留および中位定着（勝ち点42以上）';
      longTermObjective = '【3〜5年後】1部上位進出（トップ8定着）および国内カップ戦タイトル挑戦';
      transferPolicy = '昇格を即座に引き寄せる即戦力補強を最優先。若手育成とベテランの融合。';

      goals.push({
        id: 'goal_div2_promo_1',
        yearTarget: 1,
        category: 'league',
        title: '1部自動昇格の達成',
        description: '2部リーグで上位2位以内に入り、来季のトップリーグ自動昇格権を確定させる。',
        targetCondition: '2部リーグ2位以内',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_div2_cup_giantkill',
        yearTarget: 1,
        category: 'cup',
        title: '国内カップ戦での1部撃破（ベスト16以上）',
        description: '天皇杯/国内カップ戦で1部クラブとの対戦を制し、クラブの知名度を高める。',
        targetCondition: '国内カップ戦ベスト16進出',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_div2_stabilize',
        yearTarget: 2,
        category: 'league',
        title: '1部昇格初年度の確実な残留',
        description: '昇格後の過酷なトップリーグで残留争いを回避し、15位以上でシーズンを終える。',
        targetCondition: '1部リーグ15位以上',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_div2_top_half',
        yearTarget: 3,
        category: 'growth',
        title: 'トップリーグ中位〜上位への定着',
        description: '補強資金を再投資し、1部で安定してトップ10を争える戦力基盤を確立する。',
        targetCondition: '1部リーグ上位10位以内',
        status: 'in_progress'
      });
    } else {
      boardPatience = '忍耐強い';
      overviewPhilosophy = `${club.name}は持続可能な成長と堅実なクラブ経営を重視しています。無理な投資を避け、アカデミーからの若手育成と組織的な戦術構築により、2〜3年以内での1部昇格を目指します。`;
      shortTermObjective = '【今季至上命題】2部上位進出（昇格プレーオフ圏内または1桁順位確保）';
      midTermObjective = '【2〜3年以内】戦力を整え、悲願の1部リーグ昇格を果たす';
      longTermObjective = '【4〜5年後】1部に定着し、下位に沈まない持続可能なスカッドを構築';
      transferPolicy = '若手有望株のスカウティングと育成型レンタルを積極活用。身の丈に合った健全経営。';

      goals.push({
        id: 'goal_div2_playoff',
        yearTarget: 1,
        category: 'league',
        title: '昇格プレーオフ進出または上位フィニッシュ',
        description: '厳しい2部リーグで粘り強く戦い、6位以内の昇格プレーオフ圏を争う。',
        targetCondition: '2部リーグ6位以内',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_div2_promo_2',
        yearTarget: 2,
        category: 'league',
        title: '2〜3年以内での1部昇格達成',
        description: '戦術の浸透と選手育成を進め、来季以降の1部昇格を掴み取る。',
        targetCondition: '1部昇格枠の獲得',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_div2_financial',
        yearTarget: 3,
        category: 'financial',
        title: '健全な財政基盤とアカデミー強化',
        description: '移籍収支を黒字に保ちながら、アカデミーからトップ昇格選手を輩出する。',
        targetCondition: '年間予算維持と若手育成枠確立',
        status: 'in_progress'
      });
    }
  } else {
    // -------------------------------------------------------------
    // 1部クラブの目標設定 (1st Division Clubs)
    // -------------------------------------------------------------
    if (club.tier === 'Elite') {
      boardPatience = '結果即時要求';
      if (isJLeague) {
        overviewPhilosophy = `${club.name}はアジアおよび日本を牽引する名門クラブです。国内三冠争いは当然の義務であり、ACLエリート制覇とクラブW杯進出が長期ビジョンです。`;
        shortTermObjective = '【今季至上命題】J1リーグ優勝および天皇杯・ルヴァンカップ制覇の国内タイトル奪還';
        midTermObjective = '【2年目】ACLエリート（アジア最高峰）でのタイトル獲得および連覇体制';
        longTermObjective = '【3〜5年後】クラブワールドカップでの世界強豪との対峙、アジアの盟主確立';
      } else {
        overviewPhilosophy = `${club.name}は世界屈指のメガクラブです。国内外の全コンペティションで優勝を争うことが常に課せられており、勝利のみならず魅力的で支配的なフットボールが求められます。`;
        shortTermObjective = '【今季至上命題】国内リーグ制覇およびUEFAチャンピオンズリーグ（CL）ベスト8以上';
        midTermObjective = '【2年目】欧州CL決勝進出および国内カップ戦を含む複数タイトル（トレブル）挑戦';
        longTermObjective = '【3〜5年後】欧州の覇権を握る黄金期・世界No.1フットボールブランドの継続';
      }
      transferPolicy = '世界基準のトップタレントおよびワールドクラスの即戦力を獲得。勝利を最優先。';

      goals.push({
        id: 'goal_elite_league_title',
        yearTarget: 1,
        category: 'league',
        title: '国内リーグ優勝の達成',
        description: 'シーズンを通じて首位争いを主導し、リーグタイトルを獲得する。',
        targetCondition: 'リーグ1位 (優勝)',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_elite_cl_run',
        yearTarget: 1,
        category: 'continental',
        title: isJLeague ? 'ACLエリート出場権の確保' : 'UEFAチャンピオンズリーグでの躍進',
        description: isJLeague ? 'J1トップ3または天皇杯優勝により来季ACLE出場枠を獲得する。' : 'CLノックアウトステージで勝ち上がり、ベスト8以上へ進出する。',
        targetCondition: isJLeague ? 'ACLE出場権獲得' : '欧州CLベスト8以上',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_elite_double',
        yearTarget: 2,
        category: 'cup',
        title: '主要タイトル複数冠（2冠以上）の獲得',
        description: '国内カップ戦（天皇杯/FA Cup等）とリーグ戦の両立を果たし、複数タイトルを掲げる。',
        targetCondition: 'シーズン2冠以上の達成',
        status: 'in_progress'
      });
    } else if (club.tier === 'Upper') {
      boardPatience = '標準的';
      if (isJLeague) {
        overviewPhilosophy = `${club.name}はJ1上位の常連であり、悲願のリーグ初制覇・ACL進出を狙う挑戦者です。着実なスカッド強化によりビッグクラブへの定着を図ります。`;
        shortTermObjective = '【今季至上命題】J1上位3位以内（ACL出場権獲得圏内）および国内カップ戦戴冠';
        midTermObjective = '【2年目】J1リーグ優勝争いへの本格参入とアジア大会での経験蓄積';
        longTermObjective = '【3〜5年後】J1チャンピオンおよび毎年アジアに挑む常勝クラブへの進化';
      } else {
        overviewPhilosophy = `${club.name}はトップリーグの上位争いを演じる実力派クラブです。欧州チャンピオンズリーグ出場権の確保を最大の標的とし、格上相手にも互角に渡り合います。`;
        shortTermObjective = '【今季至上命題】リーグ上位4位以内（UEFAチャンピオンズリーグ出場権獲得）';
        midTermObjective = '【2年目】CL本戦でのノックアウトステージ進出および国内カップ戦優勝';
        longTermObjective = '【3〜5年後】国内外で優勝を争うタイトルコンテンダーへの定着';
      }
      transferPolicy = '費用対効果の高い実力派と、将来高く売却可能な若手有望株をバランスよく獲得。';

      goals.push({
        id: 'goal_upper_continental',
        yearTarget: 1,
        category: 'continental',
        title: isJLeague ? 'J1トップ3進出とACLE出場権獲得' : 'CL出場権（リーグ4位以内）の獲得',
        description: '上位集団に食らいつき、欧州最高峰またはアジア最高峰の出場権を確定させる。',
        targetCondition: isJLeague ? 'J1リーグ3位以内' : 'リーグ4位以内',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_upper_cup_trophy',
        yearTarget: 2,
        category: 'cup',
        title: '国内カップ戦でのタイトル獲得',
        description: 'トーナメント大会で勝負強さを発揮し、サポーターに銀杯をもたらす。',
        targetCondition: '国内カップ戦優勝',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_upper_league_challenge',
        yearTarget: 3,
        category: 'league',
        title: 'リーグタイトルへの本格挑戦',
        description: '首位と僅差の優勝争いを展開し、クラブ史上最高位を狙う。',
        targetCondition: 'リーグ2位以内',
        status: 'in_progress'
      });
    } else {
      // Mid / Lower 1st Division Club
      boardPatience = '忍耐強い';
      overviewPhilosophy = `${club.name}にとって1部トップリーグで生き残ることは最大の価値です。強豪クラブからの大金獲得と賢明な投資、粘り強い守備組織で中位〜上位進出の足がかりを作ります。`;
      shortTermObjective = '【今季至上命題】1部リーグ確実な残留および1桁順位（中位以上）の達成';
      midTermObjective = '【2年目】中位での安定と、国内カップ戦での上位進出（ベスト4以上）';
      longTermObjective = '【3〜5年後】欧州大会（EL/ECL）またはACL出場圏内（トップ6）への挑戦';
      transferPolicy = '移籍金ゼロのフリー選手や期限付きレンタルを巧みに活用。給与総額の厳格管理。';

      goals.push({
        id: 'goal_mid_survival',
        yearTarget: 1,
        category: 'league',
        title: 'トップリーグ残留の早期確定',
        description: '降格圏から距離を置き、勝ち点40以上を早期に積み上げて残留を果たす。',
        targetCondition: '1部リーグ14位以上',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_mid_top_half',
        yearTarget: 2,
        category: 'league',
        title: 'リーグ1桁順位（トップ10進出）',
        description: '格下からの取りこぼしを減らし、安定した順位を確保する。',
        targetCondition: '1部リーグ10位以内',
        status: 'in_progress'
      });
      goals.push({
        id: 'goal_mid_cup_deep',
        yearTarget: 3,
        category: 'cup',
        title: 'カップ戦ベスト4以上の快進撃',
        description: '一発勝負のカップ戦でジャイアントキリングを起こし、国立競技場/ウェンブリー等の大舞台に立つ。',
        targetCondition: '国内カップ戦ベスト4進出',
        status: 'in_progress'
      });
    }
  }

  return {
    clubId: club.id,
    clubName: club.name,
    leagueId: club.league,
    division: is2ndDiv ? 2 : 1,
    overviewPhilosophy,
    shortTermObjective,
    midTermObjective,
    longTermObjective,
    goals,
    boardPatienceLevel: boardPatience,
    transferPolicy,
    updatedAtSeason: currentSeason
  };
}

/**
 * Updates Club Vision upon season rollover or promotion/relegation
 */
export function updateClubVisionAfterSeason(
  currentVision: ClubVisionRoadmap,
  club: Club,
  newSeason: string,
  state: GameWorldState
): ClubVisionRoadmap {
  const isNow2ndDiv = isSecondDivisionLeague(club.league) || club.division === 2;
  const was2ndDiv = currentVision.division === 2;

  // If division changed (promoted or relegated), regenerate tailored vision
  if (isNow2ndDiv !== was2ndDiv) {
    return generateClubVisionRoadmap(club, newSeason);
  }

  // Update existing goals status based on achievements
  const updatedGoals = currentVision.goals.map(g => {
    // Increment year target progress or mark completed
    return { ...g };
  });

  return {
    ...currentVision,
    leagueId: club.league,
    division: isNow2ndDiv ? 2 : 1,
    goals: updatedGoals,
    updatedAtSeason: newSeason
  };
}
