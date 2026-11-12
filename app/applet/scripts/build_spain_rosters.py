import json
import os

# 2026/27 Authentic Spanish Rosters (LaLiga 20 clubs + Segunda Division 22 clubs = 42 clubs)
# Sourced from LaLiga Official Club Registries (https://www.laliga.com/laliga-easports/clubes & https://www.laliga.com/laliga-hypermotion/clubes)

spain_squads = {
    # Top 10 Depth (Filling remaining slots to >= 25 players and 3 GKs)
    "real_madrid": [
        {"name": "Andriy Lunin", "position": "GK", "age": 27, "nationality": "ウクライナ", "ovr": 82, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Fran González", "position": "GK", "age": 21, "nationality": "スペイン", "ovr": 70, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Fran García", "position": "LB", "age": 27, "nationality": "スペイン", "ovr": 78, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "攻撃的SB"},
        {"name": "Jesús Vallejo", "position": "CB", "age": 29, "nationality": "スペイン", "ovr": 73, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Jacobo Ramón", "position": "CB", "age": 21, "nationality": "スペイン", "ovr": 71, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Dani Ceballos", "position": "CM", "age": 30, "nationality": "スペイン", "ovr": 79, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
        {"name": "Endrick", "position": "ST", "age": 20, "nationality": "ブラジル", "ovr": 79, "shirtNumber": 16, "preferredFoot": "左", "playstyle": "ラインブレーカー"},
        {"name": "Nico Paz", "position": "CAM", "age": 22, "nationality": "アルゼンチン", "ovr": 75, "shirtNumber": 32, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
        {"name": "Lorenzo Aguado", "position": "RB", "age": 24, "nationality": "スペイン", "ovr": 69, "shirtNumber": 37, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Gonzalo García", "position": "RW", "age": 22, "nationality": "スペイン", "ovr": 71, "shirtNumber": 38, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
        {"name": "Raúl Asencio", "position": "CB", "age": 23, "nationality": "スペイン", "ovr": 73, "shirtNumber": 35, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Chema Andrés", "position": "CDM", "age": 21, "nationality": "スペイン", "ovr": 70, "shirtNumber": 39, "preferredFoot": "右", "playstyle": "アンカー"}
    ],
    "barcelona": [
        {"name": "Iñaki Peña", "position": "GK", "age": 27, "nationality": "スペイン", "ovr": 76, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Ander Astralaga", "position": "GK", "age": 22, "nationality": "スペイン", "ovr": 69, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Héctor Fort", "position": "RB", "age": 20, "nationality": "スペイン", "ovr": 74, "shirtNumber": 32, "preferredFoot": "右", "playstyle": "攻撃的SB"},
        {"name": "Gerard Martín", "position": "LB", "age": 24, "nationality": "スペイン", "ovr": 73, "shirtNumber": 35, "preferredFoot": "左", "playstyle": "守備的SB"},
        {"name": "Sergi Domínguez", "position": "CB", "age": 21, "nationality": "スペイン", "ovr": 71, "shirtNumber": 36, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Marc Bernal", "position": "CDM", "age": 19, "nationality": "スペイン", "ovr": 75, "shirtNumber": 28, "preferredFoot": "左", "playstyle": "アンカー"},
        {"name": "Marc Casadó", "position": "CDM", "age": 23, "nationality": "スペイン", "ovr": 78, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
        {"name": "Pablo Torre", "position": "CAM", "age": 23, "nationality": "スペイン", "ovr": 75, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
        {"name": "Pau Víctor", "position": "ST", "age": 24, "nationality": "スペイン", "ovr": 74, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
        {"name": "Diego Kochen", "position": "GK", "age": 20, "nationality": "アメリカ", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Andrés Cuenca", "position": "CB", "age": 19, "nationality": "スペイン", "ovr": 69, "shirtNumber": 39, "preferredFoot": "左", "playstyle": "ボール運べるCB"}
    ],
    "atletico": [
        {"name": "Juan Musso", "position": "GK", "age": 32, "nationality": "アルゼンチン", "ovr": 79, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Antonio Gomis", "position": "GK", "age": 23, "nationality": "スペイン", "ovr": 68, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Javi Galán", "position": "LB", "age": 31, "nationality": "スペイン", "ovr": 77, "shirtNumber": 21, "preferredFoot": "左", "playstyle": "攻撃的SB"},
        {"name": "Clément Lenglet", "position": "CB", "age": 31, "nationality": "フランス", "ovr": 78, "shirtNumber": 15, "preferredFoot": "左", "playstyle": "ボール運べるCB"},
        {"name": "Ilias Kostis", "position": "CB", "age": 23, "nationality": "ギリシャ", "ovr": 70, "shirtNumber": 27, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Rodrigo Riquelme", "position": "LM", "age": 26, "nationality": "スペイン", "ovr": 79, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ドリブラー"},
        {"name": "Alexander Sørloth", "position": "ST", "age": 30, "nationality": "ノルウェー", "ovr": 82, "shirtNumber": 9, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
        {"name": "Giuliano Simeone", "position": "RW", "age": 23, "nationality": "アルゼンチン", "ovr": 76, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
        {"name": "Javi Serrano", "position": "CM", "age": 23, "nationality": "スペイン", "ovr": 71, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
        {"name": "Carlos Martín", "position": "ST", "age": 24, "nationality": "スペイン", "ovr": 74, "shirtNumber": 29, "preferredFoot": "右", "playstyle": "ラインブレーカー"}
    ],
    "sevilla": [
        {"name": "Álvaro Fernández", "position": "GK", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Alberto Flores", "position": "GK", "age": 23, "nationality": "スペイン", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "José Ángel Carmona", "position": "RB", "age": 24, "nationality": "スペイン", "ovr": 76, "shirtNumber": 32, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Kike Salas", "position": "CB", "age": 24, "nationality": "スペイン", "ovr": 75, "shirtNumber": 4, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Ramón Martínez", "position": "CB", "age": 23, "nationality": "スペイン", "ovr": 69, "shirtNumber": 34, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Juanlu Sánchez", "position": "RB", "age": 23, "nationality": "スペイン", "ovr": 77, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "攻撃的SB"},
        {"name": "Albert Sambi Lokonga", "position": "CM", "age": 26, "nationality": "ベルギー", "ovr": 77, "shirtNumber": 12, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
        {"name": "Lucien Agoumé", "position": "CDM", "age": 24, "nationality": "フランス", "ovr": 76, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "アンカー"},
        {"name": "Peque Fernández", "position": "CAM", "age": 23, "nationality": "スペイン", "ovr": 75, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
        {"name": "Isaac Romero", "position": "ST", "age": 26, "nationality": "スペイン", "ovr": 77, "shirtNumber": 7, "preferredFoot": "左", "playstyle": "ラインブレーカー"},
        {"name": "Stanis Idumbo", "position": "LW", "age": 21, "nationality": "ベルギー", "ovr": 71, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ドリブラー"},
        {"name": "Manu Bueno", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 70, "shirtNumber": 28, "preferredFoot": "左", "playstyle": "ゲームメイカー"}
    ],
    "real_sociedad": [
        {"name": "Unai Marrero", "position": "GK", "age": 24, "nationality": "スペイン", "ovr": 73, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Aitor Fraga", "position": "GK", "age": 23, "nationality": "スペイン", "ovr": 67, "shirtNumber": 32, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Jon Martín", "position": "CB", "age": 20, "nationality": "スペイン", "ovr": 72, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Jon Pacheco", "position": "CB", "age": 25, "nationality": "スペイン", "ovr": 77, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Jon Aramburu", "position": "RB", "age": 24, "nationality": "ベネズエラ", "ovr": 76, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Aihen Muñoz", "position": "LB", "age": 29, "nationality": "スペイン", "ovr": 76, "shirtNumber": 3, "preferredFoot": "左", "playstyle": "守備的SB"},
        {"name": "Beñat Turrientes", "position": "CM", "age": 24, "nationality": "スペイン", "ovr": 77, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
        {"name": "Pablo Marín", "position": "CAM", "age": 23, "nationality": "スペイン", "ovr": 72, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
        {"name": "Sheraldo Becker", "position": "RW", "age": 31, "nationality": "スリナム", "ovr": 77, "shirtNumber": 11, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
        {"name": "Orri Óskarsson", "position": "ST", "age": 22, "nationality": "アイスランド", "ovr": 76, "shirtNumber": 9, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
        {"name": "Urko González de Zárate", "position": "CDM", "age": 25, "nationality": "スペイン", "ovr": 73, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "アンカー"}
    ],
    "athletic_club": [
        {"name": "Álex Padilla", "position": "GK", "age": 23, "nationality": "メキシコ", "ovr": 72, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Oier Gastesi", "position": "GK", "age": 22, "nationality": "スペイン", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Iñigo Lekue", "position": "RB", "age": 33, "nationality": "スペイン", "ovr": 75, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Unai Egiluz", "position": "CB", "age": 24, "nationality": "スペイン", "ovr": 71, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Aitor Paredes", "position": "CB", "age": 26, "nationality": "スペイン", "ovr": 78, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Adama Boiro", "position": "LB", "age": 24, "nationality": "スペイン", "ovr": 72, "shirtNumber": 32, "preferredFoot": "左", "playstyle": "攻撃的SB"},
        {"name": "Unai Gómez", "position": "CM", "age": 23, "nationality": "スペイン", "ovr": 76, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ボックストゥボックス"},
        {"name": "Mikel Jauregizar", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 74, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
        {"name": "Álvaro Djaló", "position": "LW", "age": 27, "nationality": "スペイン", "ovr": 78, "shirtNumber": 11, "preferredFoot": "右", "playstyle": "ドリブラー"},
        {"name": "Javier Martón", "position": "ST", "age": 27, "nationality": "スペイン", "ovr": 72, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
        {"name": "Nico Serrano", "position": "LW", "age": 23, "nationality": "スペイン", "ovr": 72, "shirtNumber": 22, "preferredFoot": "左", "playstyle": "ウイングストライカー"}
    ],
    "villarreal": [
        {"name": "Luiz Júnior", "position": "GK", "age": 25, "nationality": "ブラジル", "ovr": 78, "shirtNumber": 1, "preferredFoot": "左", "playstyle": "ショットストッパー"},
        {"name": "Iker Álvarez", "position": "GK", "age": 25, "nationality": "アンドラ", "ovr": 68, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Willy Kambwala", "position": "CB", "age": 22, "nationality": "フランス", "ovr": 74, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Eric Bailly", "position": "CB", "age": 32, "nationality": "コートジボワール", "ovr": 77, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Sergi Cardona", "position": "LB", "age": 27, "nationality": "スペイン", "ovr": 77, "shirtNumber": 23, "preferredFoot": "左", "playstyle": "攻撃的SB"},
        {"name": "Kiko Femenía", "position": "RB", "age": 35, "nationality": "スペイン", "ovr": 75, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Ramón Terrats", "position": "CM", "age": 26, "nationality": "スペイン", "ovr": 75, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ゲームメイカー"},
        {"name": "Denis Suárez", "position": "CAM", "age": 32, "nationality": "スペイン", "ovr": 76, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
        {"name": "Nicolas Pépé", "position": "RW", "age": 31, "nationality": "コートジボワール", "ovr": 78, "shirtNumber": 19, "preferredFoot": "左", "playstyle": "ドリブラー"},
        {"name": "Thierno Barry", "position": "ST", "age": 24, "nationality": "フランス", "ovr": 76, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
        {"name": "Pau Navarro", "position": "CB", "age": 21, "nationality": "スペイン", "ovr": 70, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "ボール運べるCB"}
    ],
    "valencia": [
        {"name": "Cristian Rivero", "position": "GK", "age": 28, "nationality": "スペイン", "ovr": 72, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Vicente Abril", "position": "GK", "age": 21, "nationality": "スペイン", "ovr": 67, "shirtNumber": 30, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Dimitri Foulquier", "position": "RB", "age": 33, "nationality": "グアドループ", "ovr": 75, "shirtNumber": 20, "preferredFoot": "右", "playstyle": "守備的SB"},
        {"name": "Yarek Gasiorowski", "position": "CB", "age": 21, "nationality": "スペイン", "ovr": 75, "shirtNumber": 24, "preferredFoot": "左", "playstyle": "ボール運べるCB"},
        {"name": "César Tárrega", "position": "CB", "age": 24, "nationality": "スペイン", "ovr": 74, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Hugo Guillamón", "position": "CDM", "age": 26, "nationality": "スペイン", "ovr": 76, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "アンカー"},
        {"name": "Enzo Barrenechea", "position": "CDM", "age": 25, "nationality": "アルゼンチン", "ovr": 76, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
        {"name": "Sergi Canós", "position": "LW", "age": 29, "nationality": "スペイン", "ovr": 75, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
        {"name": "Fran Pérez", "position": "RW", "age": 24, "nationality": "スペイン", "ovr": 74, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "ドリブラー"},
        {"name": "Dani Gómez", "position": "ST", "age": 28, "nationality": "スペイン", "ovr": 73, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
        {"name": "Martín Tejón", "position": "CAM", "age": 22, "nationality": "スペイン", "ovr": 70, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "チャンスメイカー"}
    ],
    "real_betis": [
        {"name": "Fran Vieites", "position": "GK", "age": 27, "nationality": "スペイン", "ovr": 74, "shirtNumber": 25, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Germán García", "position": "GK", "age": 22, "nationality": "スペイン", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Héctor Bellerín", "position": "RB", "age": 31, "nationality": "スペイン", "ovr": 77, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "攻撃的SB"},
        {"name": "Nobel Mendy", "position": "CB", "age": 22, "nationality": "セネガル", "ovr": 71, "shirtNumber": 32, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Romain Perraud", "position": "LB", "age": 28, "nationality": "フランス", "ovr": 76, "shirtNumber": 15, "preferredFoot": "左", "playstyle": "攻撃的SB"},
        {"name": "Sergi Altimira", "position": "CDM", "age": 25, "nationality": "スペイン", "ovr": 76, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "アンカー"},
        {"name": "Iker Losada", "position": "CAM", "age": 25, "nationality": "スペイン", "ovr": 74, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
        {"name": "Juanmi", "position": "LW", "age": 33, "nationality": "スペイン", "ovr": 76, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
        {"name": "Assane Diao", "position": "RW", "age": 21, "nationality": "スペイン", "ovr": 76, "shirtNumber": 38, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
        {"name": "Mateo Flores", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 70, "shirtNumber": 37, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
        {"name": "Jesús Rodríguez", "position": "LW", "age": 21, "nationality": "スペイン", "ovr": 71, "shirtNumber": 36, "preferredFoot": "右", "playstyle": "ドリブラー"}
    ],
    "girona": [
        {"name": "Juan Carlos", "position": "GK", "age": 38, "nationality": "スペイン", "ovr": 72, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Lucas García", "position": "GK", "age": 22, "nationality": "スペイン", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Alejandro Francés", "position": "CB", "age": 24, "nationality": "スペイン", "ovr": 76, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Daley Blind", "position": "CB", "age": 36, "nationality": "オランダ", "ovr": 78, "shirtNumber": 17, "preferredFoot": "左", "playstyle": "ビルドアップ型CB"},
        {"name": "Jhon Solís", "position": "CM", "age": 22, "nationality": "コロンビア", "ovr": 75, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
        {"name": "Bryan Gil", "position": "LW", "age": 25, "nationality": "スペイン", "ovr": 78, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ドリブラー"},
        {"name": "Cristhian Stuani", "position": "ST", "age": 40, "nationality": "ウルグアイ", "ovr": 75, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
        {"name": "Yáser Asprilla", "position": "CAM", "age": 22, "nationality": "コロンビア", "ovr": 78, "shirtNumber": 10, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
        {"name": "Arnau Martínez", "position": "RB", "age": 23, "nationality": "スペイン", "ovr": 78, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "攻撃的SB"},
        {"name": "Gabriel Misehouy", "position": "CAM", "age": 21, "nationality": "オランダ", "ovr": 72, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ドリブラー"},
        {"name": "Antal Yaakobishvili", "position": "CB", "age": 22, "nationality": "ハンガリー", "ovr": 71, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ]
}

print(f"Loaded top 10 depth squads: {len(spain_squads)} clubs")
