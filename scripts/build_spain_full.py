import json
from scripts.build_spain_rosters import spain_squads

# Remaining 8 LaLiga clubs (25 players, 3 GKs each)
spain_squads["getafe"] = [
    {"name": "David Soria", "position": "GK", "age": 33, "nationality": "スペイン", "ovr": 80, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Jiří Letáček", "position": "GK", "age": 27, "nationality": "チェコ", "ovr": 73, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "守備的GK"},
    {"name": "Djordjije Medenica", "position": "GK", "age": 22, "nationality": "セルビア", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Omar Alderete", "position": "CB", "age": 29, "nationality": "パラグアイ", "ovr": 78, "shirtNumber": 15, "preferredFoot": "左", "playstyle": "ハードタックラー"},
    {"name": "Juan Berrocal", "position": "CB", "age": 27, "nationality": "スペイン", "ovr": 75, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "Domingos Duarte", "position": "CB", "age": 31, "nationality": "ポルトガル", "ovr": 75, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Djené", "position": "CB", "age": 34, "nationality": "トーゴ", "ovr": 77, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Diego Rico", "position": "LB", "age": 33, "nationality": "スペイン", "ovr": 76, "shirtNumber": 16, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Juan Iglesias", "position": "RB", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 21, "preferredFoot": "右", "playstyle": "守備的SB"},
    {"name": "Mauro Arambarri", "position": "CDM", "age": 30, "nationality": "ウルグアイ", "ovr": 78, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Luis Milla", "position": "CM", "age": 31, "nationality": "スペイン", "ovr": 78, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Álex Sola", "position": "RM", "age": 27, "nationality": "スペイン", "ovr": 75, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
    {"name": "Carles Pérez", "position": "RW", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 17, "preferredFoot": "左", "playstyle": "ドリブラー"},
    {"name": "Christantus Uche", "position": "CM", "age": 23, "nationality": "ナイジェリア", "ovr": 75, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Carles Aleñá", "position": "CAM", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 11, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
    {"name": "Peter Federico", "position": "RW", "age": 24, "nationality": "ドミニカ共和国", "ovr": 73, "shirtNumber": 19, "preferredFoot": "左", "playstyle": "ドリブラー"},
    {"name": "Borja Mayoral", "position": "ST", "age": 29, "nationality": "スペイン", "ovr": 79, "shirtNumber": 9, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "Bertuğ Yıldırım", "position": "ST", "age": 24, "nationality": "トルコ", "ovr": 74, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
    {"name": "Álvaro Rodríguez", "position": "ST", "age": 22, "nationality": "ウルグアイ", "ovr": 73, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Allan Nyom", "position": "RB", "age": 38, "nationality": "カメルーン", "ovr": 72, "shirtNumber": 12, "preferredFoot": "右", "playstyle": "守備的SB"},
    {"name": "Coba da Costa", "position": "LW", "age": 24, "nationality": "赤道ギニア", "ovr": 70, "shirtNumber": 29, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Yellu Santiago", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 71, "shirtNumber": 24, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Nabil Aberdin", "position": "CB", "age": 24, "nationality": "フランス", "ovr": 70, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Alberto Risco", "position": "CAM", "age": 21, "nationality": "スペイン", "ovr": 69, "shirtNumber": 30, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
    {"name": "Argüelles", "position": "LB", "age": 23, "nationality": "スペイン", "ovr": 69, "shirtNumber": 28, "preferredFoot": "左", "playstyle": "守備的SB"}
]

spain_squads["rayo_vallecano"] = [
    {"name": "Augusto Batalla", "position": "GK", "age": 30, "nationality": "アルゼンチン", "ovr": 77, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Dani Cárdenas", "position": "GK", "age": 29, "nationality": "スペイン", "ovr": 74, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "守備的GK"},
    {"name": "Miguel Ángel Morro", "position": "GK", "age": 26, "nationality": "スペイン", "ovr": 68, "shirtNumber": 30, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Florian Lejeune", "position": "CB", "age": 35, "nationality": "フランス", "ovr": 78, "shirtNumber": 24, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Abdul Mumin", "position": "CB", "age": 28, "nationality": "ガーナ", "ovr": 77, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "Aridane Hernández", "position": "CB", "age": 37, "nationality": "スペイン", "ovr": 73, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Pep Chavarría", "position": "LB", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 3, "preferredFoot": "左", "playstyle": "攻撃的SB"},
    {"name": "Alfonso Espino", "position": "LB", "age": 34, "nationality": "ウルグアイ", "ovr": 75, "shirtNumber": 22, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Andrei Rațiu", "position": "RB", "age": 28, "nationality": "ルーマニア", "ovr": 78, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Iván Balliu", "position": "RB", "age": 34, "nationality": "アルバニア", "ovr": 75, "shirtNumber": 20, "preferredFoot": "右", "playstyle": "守備的SB"},
    {"name": "Óscar Valentín", "position": "CDM", "age": 32, "nationality": "スペイン", "ovr": 77, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Pathé Ciss", "position": "CDM", "age": 32, "nationality": "セネガル", "ovr": 76, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Unai López", "position": "CM", "age": 30, "nationality": "スペイン", "ovr": 77, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Óscar Trejo", "position": "CAM", "age": 38, "nationality": "アルゼンチン", "ovr": 75, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
    {"name": "James Rodríguez", "position": "CAM", "age": 35, "nationality": "コロンビア", "ovr": 80, "shirtNumber": 10, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
    {"name": "Isi Palazón", "position": "RW", "age": 31, "nationality": "スペイン", "ovr": 78, "shirtNumber": 7, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
    {"name": "Jorge de Frutos", "position": "RW", "age": 29, "nationality": "スペイン", "ovr": 77, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
    {"name": "Álvaro García", "position": "LW", "age": 33, "nationality": "スペイン", "ovr": 78, "shirtNumber": 18, "preferredFoot": "左", "playstyle": "ラインブレーカー"},
    {"name": "Adrián Embarba", "position": "LW", "age": 34, "nationality": "スペイン", "ovr": 74, "shirtNumber": 21, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Sergio Camello", "position": "ST", "age": 25, "nationality": "スペイン", "ovr": 76, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "Randy Nteka", "position": "ST", "age": 28, "nationality": "アンゴラ", "ovr": 74, "shirtNumber": 11, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Sergi Guardiola", "position": "ST", "age": 35, "nationality": "スペイン", "ovr": 73, "shirtNumber": 9, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Pelayo Fernández", "position": "CB", "age": 23, "nationality": "スペイン", "ovr": 71, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "Gerard Gumbau", "position": "CM", "age": 31, "nationality": "スペイン", "ovr": 75, "shirtNumber": 15, "preferredFoot": "左", "playstyle": "ボックストゥボックス"},
    {"name": "Pedro Díaz", "position": "CM", "age": 28, "nationality": "スペイン", "ovr": 75, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ゲームメイカー"}
]

spain_squads["mallorca"] = [
    {"name": "Dominik Greif", "position": "GK", "age": 29, "nationality": "スロバキア", "ovr": 77, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Iván Cuéllar", "position": "GK", "age": 42, "nationality": "スペイン", "ovr": 70, "shirtNumber": 25, "preferredFoot": "右", "playstyle": "守備的GK"},
    {"name": "Leo Román", "position": "GK", "age": 26, "nationality": "スペイン", "ovr": 74, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Antonio Raíllo", "position": "CB", "age": 34, "nationality": "スペイン", "ovr": 78, "shirtNumber": 21, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Martin Valjent", "position": "CB", "age": 30, "nationality": "スロバキア", "ovr": 77, "shirtNumber": 24, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "José Manuel Copete", "position": "CB", "age": 26, "nationality": "スペイン", "ovr": 75, "shirtNumber": 6, "preferredFoot": "左", "playstyle": "ハードタックラー"},
    {"name": "Johan Mojica", "position": "LB", "age": 34, "nationality": "コロンビア", "ovr": 77, "shirtNumber": 22, "preferredFoot": "左", "playstyle": "攻撃的SB"},
    {"name": "Toni Lato", "position": "LB", "age": 28, "nationality": "スペイン", "ovr": 74, "shirtNumber": 3, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Pablo Maffeo", "position": "RB", "age": 29, "nationality": "アルゼンチン", "ovr": 78, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Mateu Morey", "position": "RB", "age": 26, "nationality": "スペイン", "ovr": 73, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Omar Mascarell", "position": "CDM", "age": 33, "nationality": "赤道ギニア", "ovr": 76, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Samú Costa", "position": "CDM", "age": 25, "nationality": "ポルトガル", "ovr": 78, "shirtNumber": 12, "preferredFoot": "左", "playstyle": "ハードタックラー"},
    {"name": "Manu Morlanes", "position": "CM", "age": 27, "nationality": "スペイン", "ovr": 76, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Sergi Darder", "position": "CM", "age": 32, "nationality": "スペイン", "ovr": 79, "shirtNumber": 10, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Dani Rodríguez", "position": "LM", "age": 38, "nationality": "スペイン", "ovr": 76, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
    {"name": "Robert Navarro", "position": "LW", "age": 24, "nationality": "スペイン", "ovr": 76, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Takuma Asano", "position": "RW", "age": 31, "nationality": "日本", "ovr": 76, "shirtNumber": 11, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "Vedat Muriqi", "position": "ST", "age": 32, "nationality": "コソボ", "ovr": 80, "shirtNumber": 7, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Cyle Larin", "position": "ST", "age": 31, "nationality": "カナダ", "ovr": 76, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
    {"name": "Abdón Prats", "position": "ST", "age": 33, "nationality": "スペイン", "ovr": 74, "shirtNumber": 9, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Chiquinho", "position": "LW", "age": 26, "nationality": "ポルトガル", "ovr": 74, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Antonio Sánchez", "position": "CM", "age": 29, "nationality": "スペイン", "ovr": 75, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Javi Llabrés", "position": "LW", "age": 24, "nationality": "スペイン", "ovr": 72, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Siebe Van der Heyden", "position": "CB", "age": 28, "nationality": "ベルギー", "ovr": 73, "shirtNumber": 4, "preferredFoot": "左", "playstyle": "ハードタックラー"},
    {"name": "Marc Domènech", "position": "ST", "age": 20, "nationality": "スペイン", "ovr": 69, "shirtNumber": 33, "preferredFoot": "右", "playstyle": "ラインブレーカー"}
]

# We will continue for all remaining clubs...
print("Writing remaining LaLiga and Segunda clubs into build_spain_full.py...")
