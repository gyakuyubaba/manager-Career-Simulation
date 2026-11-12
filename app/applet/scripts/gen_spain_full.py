# -*- coding: utf-8 -*-
import json

# Full Official Rosters for all 42 Spanish Clubs
# 10 Top Clubs depth + 10 LaLiga clubs full (25 players, 3 GKs) + 22 Segunda Division clubs full (25 players, 3 GKs)
from build_spain_rosters import spain_squads

# 10 Remaining LaLiga Clubs (25 players, 3 GKs each)
spain_squads["celta_vigo"] = [
    {"name": "Vicente Guaita", "position": "GK", "age": 39, "nationality": "スペイン", "ovr": 77, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Iván Villar", "position": "GK", "age": 29, "nationality": "スペイン", "ovr": 74, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "守備的GK"},
    {"name": "Coke Carrillo", "position": "GK", "age": 24, "nationality": "スペイン", "ovr": 68, "shirtNumber": 26, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Carl Starfelt", "position": "CB", "age": 31, "nationality": "スウェーデン", "ovr": 77, "shirtNumber": 2, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Carlos Domínguez", "position": "CB", "age": 25, "nationality": "スペイン", "ovr": 75, "shirtNumber": 24, "preferredFoot": "左", "playstyle": "ボール運べるCB"},
    {"name": "Marcos Alonso", "position": "LB", "age": 35, "nationality": "スペイン", "ovr": 76, "shirtNumber": 20, "preferredFoot": "左", "playstyle": "攻撃的SB"},
    {"name": "Óscar Mingueza", "position": "RB", "age": 27, "nationality": "スペイン", "ovr": 79, "shirtNumber": 3, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Mihailo Ristić", "position": "LB", "age": 30, "nationality": "セルビア", "ovr": 73, "shirtNumber": 21, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Javi Manquillo", "position": "RB", "age": 32, "nationality": "スペイン", "ovr": 74, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "守備的SB"},
    {"name": "Javi Rodríguez", "position": "CB", "age": 23, "nationality": "スペイン", "ovr": 73, "shirtNumber": 32, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Fran Beltrán", "position": "CDM", "age": 27, "nationality": "スペイン", "ovr": 78, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Ilaix Moriba", "position": "CM", "age": 23, "nationality": "ギニア", "ovr": 76, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Hugo Sotelo", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 75, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Damián Rodríguez", "position": "CDM", "age": 23, "nationality": "スペイン", "ovr": 74, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Jonathan Bamba", "position": "LM", "age": 30, "nationality": "コートジボワール", "ovr": 77, "shirtNumber": 17, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Williot Swedberg", "position": "LW", "age": 22, "nationality": "スウェーデン", "ovr": 76, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
    {"name": "Iago Aspas", "position": "CF", "age": 39, "nationality": "スペイン", "ovr": 80, "shirtNumber": 10, "preferredFoot": "左", "playstyle": "チャンスメイカー"},
    {"name": "Borja Iglesias", "position": "ST", "age": 33, "nationality": "スペイン", "ovr": 78, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ポストプレイヤー"},
    {"name": "Anastasios Douvikas", "position": "ST", "age": 27, "nationality": "ギリシャ", "ovr": 77, "shirtNumber": 12, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "Tadeo Allende", "position": "RW", "age": 27, "nationality": "アルゼンチン", "ovr": 74, "shirtNumber": 9, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
    {"name": "Franco Cervi", "position": "LW", "age": 32, "nationality": "アルゼンチン", "ovr": 74, "shirtNumber": 11, "preferredFoot": "左", "playstyle": "ドリブラー"},
    {"name": "Hugo Álvarez", "position": "LM", "age": 23, "nationality": "スペイン", "ovr": 75, "shirtNumber": 30, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Pablo Durán", "position": "ST", "age": 25, "nationality": "スペイン", "ovr": 73, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "Sergio Carreira", "position": "RB", "age": 25, "nationality": "スペイン", "ovr": 72, "shirtNumber": 5, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Alfon González", "position": "LW", "age": 27, "nationality": "スペイン", "ovr": 73, "shirtNumber": 23, "preferredFoot": "右", "playstyle": "ドリブラー"}
]

spain_squads["osasuna"] = [
    {"name": "Sergio Herrera", "position": "GK", "age": 33, "nationality": "スペイン", "ovr": 78, "shirtNumber": 1, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Aitor Fernández", "position": "GK", "age": 35, "nationality": "スペイン", "ovr": 75, "shirtNumber": 13, "preferredFoot": "右", "playstyle": "守備的GK"},
    {"name": "Dimitrios Stamatakis", "position": "GK", "age": 23, "nationality": "ギリシャ", "ovr": 67, "shirtNumber": 31, "preferredFoot": "右", "playstyle": "ショットストッパー"},
    {"name": "Alejandro Catena", "position": "CB", "age": 31, "nationality": "スペイン", "ovr": 77, "shirtNumber": 24, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Enzo Boyomo", "position": "CB", "age": 24, "nationality": "カメルーン", "ovr": 77, "shirtNumber": 22, "preferredFoot": "右", "playstyle": "ボール運べるCB"},
    {"name": "Jorge Herrando", "position": "CB", "age": 25, "nationality": "スペイン", "ovr": 75, "shirtNumber": 5, "preferredFoot": "左", "playstyle": "ハードタックラー"},
    {"name": "Juan Cruz", "position": "LB", "age": 34, "nationality": "スペイン", "ovr": 74, "shirtNumber": 3, "preferredFoot": "左", "playstyle": "守備的SB"},
    {"name": "Abel Bretones", "position": "LB", "age": 25, "nationality": "スペイン", "ovr": 75, "shirtNumber": 23, "preferredFoot": "左", "playstyle": "攻撃的SB"},
    {"name": "Jesús Areso", "position": "RB", "age": 27, "nationality": "スペイン", "ovr": 77, "shirtNumber": 12, "preferredFoot": "右", "playstyle": "攻撃的SB"},
    {"name": "Rubén Peña", "position": "RB", "age": 35, "nationality": "スペイン", "ovr": 75, "shirtNumber": 15, "preferredFoot": "右", "playstyle": "守備的SB"},
    {"name": "Lucas Torró", "position": "CDM", "age": 32, "nationality": "スペイン", "ovr": 78, "shirtNumber": 6, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Jon Moncayola", "position": "CM", "age": 28, "nationality": "スペイン", "ovr": 78, "shirtNumber": 7, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Moi Gómez", "position": "LM", "age": 32, "nationality": "スペイン", "ovr": 77, "shirtNumber": 16, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Pablo Ibáñez", "position": "CM", "age": 27, "nationality": "スペイン", "ovr": 75, "shirtNumber": 8, "preferredFoot": "右", "playstyle": "ボックストゥボックス"},
    {"name": "Aimar Oroz", "position": "CAM", "age": 24, "nationality": "スペイン", "ovr": 79, "shirtNumber": 10, "preferredFoot": "右", "playstyle": "チャンスメイカー"},
    {"name": "Kike Barja", "position": "RW", "age": 29, "nationality": "スペイン", "ovr": 74, "shirtNumber": 11, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Bryan Zaragoza", "position": "LW", "age": 24, "nationality": "スペイン", "ovr": 79, "shirtNumber": 19, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Ante Budimir", "position": "ST", "age": 35, "nationality": "クロアチア", "ovr": 80, "shirtNumber": 17, "preferredFoot": "左", "playstyle": "ポストプレイヤー"},
    {"name": "Raúl García de Haro", "position": "ST", "age": 25, "nationality": "スペイン", "ovr": 75, "shirtNumber": 9, "preferredFoot": "右", "playstyle": "ラインブレーカー"},
    {"name": "José Arnaiz", "position": "LW", "age": 31, "nationality": "スペイン", "ovr": 74, "shirtNumber": 20, "preferredFoot": "右", "playstyle": "ウイングストライカー"},
    {"name": "Iker Benito", "position": "RW", "age": 24, "nationality": "スペイン", "ovr": 72, "shirtNumber": 14, "preferredFoot": "右", "playstyle": "ドリブラー"},
    {"name": "Iker Muñoz", "position": "CDM", "age": 23, "nationality": "スペイン", "ovr": 75, "shirtNumber": 18, "preferredFoot": "右", "playstyle": "アンカー"},
    {"name": "Unai García", "position": "CB", "age": 33, "nationality": "スペイン", "ovr": 74, "shirtNumber": 4, "preferredFoot": "右", "playstyle": "ハードタックラー"},
    {"name": "Asier Osambela", "position": "CM", "age": 22, "nationality": "スペイン", "ovr": 69, "shirtNumber": 27, "preferredFoot": "右", "playstyle": "ゲームメイカー"},
    {"name": "Inigo Arguibide", "position": "RB", "age": 21, "nationality": "スペイン", "ovr": 68, "shirtNumber": 28, "preferredFoot": "右", "playstyle": "攻撃的SB"}
]

print("Osasuna and Celta populated")
