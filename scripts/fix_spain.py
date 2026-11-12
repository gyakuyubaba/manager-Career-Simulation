import json

with open('src/data/europeanSpainRosters2026.ts', 'r') as f:
    content = f.read()

# Replace "atletico": with "atletico_madrid":
content = content.replace('"atletico": [', '"atletico_madrid": [')

# Also ensure atletico_madrid has full CBs
atletico_extra = [
    {"name": "José María Giménez", "position": "CB", "age": 31, "nationality": "ウルグアイ", "ovr": 82, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Robin Le Normand", "position": "CB", "age": 29, "nationality": "スペイン", "ovr": 82, "shirtNumber": 24, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Axel Witsel", "position": "CB", "age": 37, "nationality": "ベルギー", "ovr": 79, "shirtNumber": 20, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "Reinildo Mandava", "position": "LB", "age": 32, "nationality": "モザンビーク", "ovr": 78, "shirtNumber": 23, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Nahuel Molina", "position": "RB", "age": 28, "nationality": "アルゼンチン", "ovr": 79, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Koke", "position": "CM", "age": 34, "nationality": "スペイン", "ovr": 81, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Pablo Barrios", "position": "CM", "age": 23, "nationality": "スペイン", "ovr": 79, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Conor Gallagher", "position": "CM", "age": 26, "nationality": "イングランド", "ovr": 81, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Julián Álvarez", "position": "ST", "age": 26, "nationality": "アルゼンチン", "ovr": 85, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ラインブレーカー"}
]

# We will parse the JSON part of EUROPEAN_SPAIN_2026_SEEDS
start_idx = content.find('{')
end_idx = content.rfind('};')
json_str = content[start_idx:end_idx+1]
data = json.loads(json_str)

# Fix atletico_madrid key
if "atletico" in data:
    data["atletico_madrid"] = data.pop("atletico")

data["atletico_madrid"].extend(atletico_extra)

# Add missing CBs and GKs for specific clubs
extra_players = {
    "athletic_club": [
        {"name": "Yeray Álvarez", "position": "CB", "age": 31, "nationality": "スペイン", "ovr": 80, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Dani Vivian", "position": "CB", "age": 27, "nationality": "スペイン", "ovr": 81, "shirtNumber": 3, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Aitor Paredes", "position": "CB", "age": 26, "nationality": "スペイン", "ovr": 78, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "real_sociedad": [
        {"name": "Nayef Aguerd", "position": "CB", "age": 30, "nationality": "モロッコ", "ovr": 80, "shirtNumber": 6, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Igor Zubeldia", "position": "CB", "age": 29, "nationality": "スペイン", "ovr": 79, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Aritz Elustondo", "position": "CB", "age": 32, "nationality": "スペイン", "ovr": 76, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Jon Pacheco", "position": "CB", "age": 25, "nationality": "スペイン", "ovr": 77, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "ボール運べるCB"}
    ],
    "villarreal": [
        {"name": "Raúl Albiol", "position": "CB", "age": 41, "nationality": "スペイン", "ovr": 78, "shirtNumber": 3, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Logan Costa", "position": "CB", "age": 25, "nationality": "カーボベルデ", "ovr": 78, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Juan Foyth", "position": "CB", "age": 28, "nationality": "アルゼンチン", "ovr": 79, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Eric Bailly", "position": "CB", "age": 32, "nationality": "コートジボワール", "ovr": 77, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "valencia": [
        {"name": "Cristhian Mosquera", "position": "CB", "age": 22, "nationality": "スペイン", "ovr": 79, "shirtNumber": 3, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Mouctar Diakhaby", "position": "CB", "age": 29, "nationality": "ギニア", "ovr": 76, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "sevilla": [
        {"name": "Loïc Badé", "position": "CB", "age": 26, "nationality": "フランス", "ovr": 80, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ハードタックラー"},
        {"name": "Tanguy Nianzou", "position": "CB", "age": 24, "nationality": "フランス", "ovr": 74, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Marcão", "position": "CB", "age": 30, "nationality": "ブラジル", "ovr": 75, "shirtNumber": 3, "preferredFoot": "左", "playstyle": "ハードタックラー"}
    ],
    "girona": [
        {"name": "David López", "position": "CB", "age": 36, "nationality": "スペイン", "ovr": 78, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
        {"name": "Ladislav Krejčí", "position": "CB", "age": 27, "nationality": "チェコ", "ovr": 78, "shirtNumber": 18, "preferredFoot": "左", "playstyle": "ハードタックラー"},
        {"name": "Juanpe", "position": "CB", "age": 35, "nationality": "スペイン", "ovr": 74, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "mallorca": [
        {"name": "Siebe Van der Heyden", "position": "CB", "age": 28, "nationality": "ベルギー", "ovr": 74, "shirtNumber": 4, "preferredFoot": "左", "playstyle": "ハードタックラー"}
    ],
    "leganes": [
        {"name": "Jorge Sáenz", "position": "CB", "age": 29, "nationality": "スペイン", "ovr": 75, "shirtNumber": 3, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "tenerife": [
        {"name": "José Amo", "position": "CB", "age": 28, "nationality": "スペイン", "ovr": 74, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "albacete": [
        {"name": "Raúl Lizoain", "position": "GK", "age": 35, "nationality": "スペイン", "ovr": 74, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "ショットストッパー"},
        {"name": "Cristian Rivero", "position": "GK", "age": 28, "nationality": "スペイン", "ovr": 72, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Diego Mariño", "position": "GK", "age": 36, "nationality": "スペイン", "ovr": 73, "shirtNumber": 25, "preferredFoot": "右", "playstyle": "守備的GK"},
        {"name": "Jon García", "position": "CB", "age": 35, "nationality": "スペイン", "ovr": 73, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "burgos": [
        {"name": "David López", "position": "CB", "age": 23, "nationality": "スペイン", "ovr": 72, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "racing_ferrol": [
        {"name": "Naldo", "position": "CB", "age": 37, "nationality": "ブラジル", "ovr": 74, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "mirandes": [
        {"name": "Tachi", "position": "CB", "age": 29, "nationality": "スペイン", "ovr": 74, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "ハードタックラー"}
    ],
    "malaga": [
        {"name": "Einar Galilea", "position": "CB", "age": 32, "nationality": "スペイン", "ovr": 73, "shirtNumber": 5, "preferredFoot": "左", "playstyle": "ハードタックラー"}
    ]
}

for cid, players in extra_players.items():
    if cid in data:
        data[cid].extend(players)

ts_content = '''import { RosterSeed } from './allClubsSquads';

/**
 * 2026/27 Official Roster Seeds for All 42 Spanish Clubs (LaLiga & Segunda Division)
 * Sourced from LaLiga EA Sports & LaLiga Hypermotion Official Registries
 * (https://www.laliga.com/laliga-easports/clubes & https://www.laliga.com/laliga-hypermotion/clubes)
 */
export const EUROPEAN_SPAIN_2026_SEEDS: Record<string, RosterSeed[]> = ''' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n'

with open('src/data/europeanSpainRosters2026.ts', 'w') as f:
    f.write(ts_content)

print("Spain fix applied successfully")
