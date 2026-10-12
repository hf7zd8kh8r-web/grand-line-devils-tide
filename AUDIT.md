# Grand Line: Devil's Tide — Spec Audit (Oct 11, 2026, 2 PM PT)

Legend: ✅ done · 🟡 partial · ❌ missing (→ status after this round in the last column)

| Area | Requirement | Before audit | After this round |
|---|---|---|---|
| Start | Logo intro → animated stormy 3D cover → random Ultra fruit start button → joining cinematic + Log Pose loader | ✅ | ✅ |
| Start | Character creation: name, Pirate/Marine, 6 races with perks | ✅ | ✅ |
| Start | Spawn in Windmill Village, easy bandits, earn money for a boat | ✅ (free dinghy after boss) | ✅ |
| Factions | Pirate/Marine with their own progression | 🟡 cosmetic only (looks, ship sails) | ✅ ranks/titles, perks, faction rewards |
| Races | Human/Fish-Man/Mink/Skypiean/Giant/Lunarian perks | ✅ | ✅ |
| Fruits | 8 tiers, 74 fruits (10 each, Ultra exactly 4), canon names, unique icons | ✅ 74 = 10×7 + 4 | ✅ |
| Fruits | Moves by tier (3/4), cutscene specials Legendary+, special-time rules, Awakening Legendary+ | ✅ (34 specials) | ✅ |
| Fruits | Themed basic click attack, Zoan transform | ✅ | ✅ |
| Mastery | Fruits, swords, guns, styles; moves unlock 1/10/25/50 + special per tier, locks shown | ✅ | ✅ |
| Haki | Observation, Armament, Conqueror's + skill tree | ✅ | ✅ |
| Gear | Wearables with stats | ✅ 21 | ✅ |
| Swords | 55 (40 + 15 secret quest), Tier 2 swords (12), Three Sword Style forge | ✅ | ✅ |
| Guns | Iconic only, with skills | ✅ 11 | ✅ |
| Styles | 23 fighting styles, trainers, upgrade chains | ✅ | ✅ |
| Ships | Shipwright, 6 ships with stats, sea tiers, first-person deck sailing | ✅ | ✅ |
| Water | Non-fruit swim; fruit users slow + drain, never sink; shore rescue | ✅ | ✅ |
| World | 26 islands in anime order, 3 level-gated seas, parchment world map | ✅ | ✅ |
| Quests | Varied quests per island (kill, gather, timed, deliver, mats, fish, rare fish, cook, rush, abilities, bounty, chest) | ✅ | ✅ |
| Quests | Secret quests (15 swords), secret island (Laugh Tale) + secret dimension (Mirro-World) | ✅ | ✅ |
| Variety | Random events: storms, Sea King ambushes, Knock Up Stream, Davy Back Fight, treasure dig, ship races, escort, stealth, Buster Call | ❌ (voyage hazards only) | ✅ island event director + voyage events (events run per player, not shared with the crew yet) |
| Variety | Crew recruitment | ❌ | ✅ |
| Variety | Day/night cycle | ❌ | ✅ |
| Bosses | Canon abilities + props, intro cutscenes | ✅ | ✅ |
| Social | Fake players with avatars, trading table, leaderboard | ✅ | ✅ |
| Looks | Avatar customization + cosmetics shop, third-person view | ✅ | ✅ |
| Economy | Fruit shop rarity-weighted rotating stock; island drops + special trader | ✅ | ✅ |
| Fishing | Rod in hands, 30 species, cooler, chests, rare fruit catch | ✅ | ✅ |
| Stats | Stats page, leaderboard | ✅ | ✅ |
| Stats | Charts, achievements, export | ❌ | ✅ |
| Platform | PC (WASD/mouse/keys), iPhone portrait + landscape, rotation, safe areas, quality auto | ✅ | ✅ |
| Saves | localStorage + cloud profiles (name+race+PIN) | ✅ | ✅ |
| Multiplayer | 5-player crews, ships/trading/styles synced, crew codes + reconnect | ✅ | ✅ |
| UI bug | Portrait rotate hint overlapping quest hints | ❌ | ✅ moved + auto-dismiss |

## Added this round
1. **Day/night cycle**: 16-minute day on a shared wall clock, so crewmates see the same time. Dusk tint, stars + moon, darker sea and light at night, HUD clock, and **+20% Berries/XP at night**.
2. **Storm weather**: rain streaks, darker sky, lightning flashes and telegraphed lightning strikes. Rare fish bite more during a storm.
3. **Random event director**: a new event every ~2.5–4 min on an island, with an event bar showing objective + timer and an ✕ to quit.
   - Sea King Ambush: a serpent rises at the nearest shore, does telegraphed water beams/volleys, and drops a Sea King Fang.
   - Treasure Dig: follow the gold beam to the X, dig, get a chest.
   - Buster Call (island Lv25+ or player Lv40+): survive 40 s of cannon bombardment.
   - Escort: walk a traveler to the dock. Ambushes come every 13 s and the traveler has HP.
   - Stealth: reach a supply crate past 3 rotating guard vision cones. Getting spotted raises the alarm and you have to fight.
   - Davy Back Fight (Lv8+): Donut Race buoys → Groggy Ring (defeat 4) → Combat vs Silver Fox Foxy. Best of 3, with a trophy.
   - Sudden Storm: survive the lightning.
4. **Voyage events**: Ship Race against a rival crew (35% of voyages, shows a progress comparison, pays a Berry prize). Knock Up Stream on the way to Skypiea, where a water pillar launches the ship into the sky.
5. **Faction progression**: Pirates climb 7 bounty titles (Rookie → Emperor of the Sea) and Marines climb 9 merit ranks (Seaman Recruit → Fleet Admiral). Pirate tier perks: damage + Berries. Marine tier perks: defense + XP + shop discount. You get a promotion banner and a Berry reward, the title shows next to your name on the HUD, and Stats has a Wanted poster / Service record.
6. **Achievements**: 36 trophies, each with progress bars and Berry rewards (🏆 Trophies tab).
7. **Stats charts + export**: bar charts for kills, mastery and activity. Stats CSV export and save backup (JSON) download.
8. **Crew recruitment**: hire 2 of 6 roles: Swordsman, Sharpshooter, Cook (cooked fish heal +50%), Doctor (heals you), Navigator (voyages 25% shorter), Musician (+8% damage). They follow you and fight (🤝 Crew tab).
9. **Fix**: the portrait rotate hint now sits below the quest/travel hints and fades out after 7 s. The faction title shrinks to an icon on narrow phones.

## Remaining / known limits
- Random events and recruited crewmates are local to each player. They are not synced to the 5-player crew session.
- The night sky is stylised, with no real-time shadows.
