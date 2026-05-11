-- Generated from -NW- World Database (2).xlsx and S2 Base (3).xlsx.
-- Run after the main Supabase schema setup.

insert into nations (name, slug, government, population, gdp_usd, land_km2, army_rank, hdi, economy, diplomatic_status, bloc, bio) values
('Primis', 'primis', 'Colony - Military Govt', 25000000, null, 500000, 5, null, 'Tech & Oil', 'Colony of Moravia', 'Defence Accords', 'Source: Season 1 world database
Spin: #1
Military: Large 5 / 11
Phase 2: + 1 Army'),
('Melandia', 'melandia', 'Monarchy', 750000000, null, 6000000, 7, null, 'Geothermal / Gems', 'War (vs Lithuania)', null, 'Source: Season 1 world database
Spin: #2
Military: Air Superpower 7 / 11'),
('Isma', 'isma', 'Fallen Empire', 1000000, null, 500000, 0, null, 'Finance / Gems', 'War (vs Vladaria)', null, 'Source: Season 1 world database
Spin: #3
Military: None 0 /11'),
('Yoggy', 'yoggy', 'Junta', 60000000, null, 900000, 7, null, 'Textiles / Minerals', 'Hostile (vs Zandoro)', null, 'Source: Season 1 world database
Spin: #4
Military: Naval Superpower 7 / 11'),
('Liberterra (Ourterra)', 'liberterra-ourterra', 'Democracy now Communist', 150000000, null, 100000, 2, null, 'Freshwater', 'Freeze (vs Imeria)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #5
Military: Small Defensive 2 / 11'),
('Belvion', 'belvion', 'Republic', 80000000, null, 600000, 9, null, 'Energy / Textiles', 'War (vs Freelandia)', null, 'Source: Season 1 world database
Spin: #6
Military: Continental Power 9 / 11'),
('Fredya', 'fredya', 'Technocracy', 400000000, 2500000000000, 400000, 4, null, '$2.5T Manuf. / Fire god', 'Techno-Magic', null, 'Source: Season 1 world database
Spin: #7
Military: Medium 4 / 11'),
('Nordmere', 'nordmere', 'Constitutional Monarchy', 30000000, 150000000000, 400000, 2, null, '$150B Green Economy', 'Rival (Shadow Conf.)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #8
Military: Small 2 / 11'),
('Catomane', 'catomane', 'Stratocracy', 50000000, 5000000000000, 400000, 7, null, '$5T Innovation / Fire god', 'Tension (vs Omaleko)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #9
Military: Special Forces 7 / 11
Phase 2: No more / Border Tension'),
('Dalgaristan', 'dalgaristan', 'Socialist Republic', 175000000, 2000000000000, 900000, 6, null, '$2T Surveillance', 'Former War (vs URHNB)', 'POF Alliance', 'Source: Season 1 world database
Spin: #10
Military: Advanced 6 / 11
Phase 2: WAR OVER'),
('N. Lights', 'n-lights', 'Ritualistic Kingdom', 40000000, 100000000000, 800000, 9, null, '$100B Pharma', 'Dual Rituals', null, 'Source: Season 1 world database
Spin: #11
Military: Continental Power 9 / 11'),
('Moradior', 'moradior', 'Robotic Dominion', 175000000, 2500000000000, 750000, 8, null, '$2.5T Robotics', 'War (vs Rei-Kai)', 'Defence Accords', 'Source: Season 1 world database
Spin: #12
Military: Regional Power 8 / 11
Phase 2: Prepare for Sabrayana Invasion'),
('Great Lithuania', 'great-lithuania', 'Expansionist Republic', 60000000, 50000000000, 1000000, 10, null, '$50B Healthcare', 'War (vs Melandia)', null, 'Source: Season 1 world database
Spin: #13
Military: Expansionist 10 / 11'),
('Maronia', 'maronia', 'Traditional Kingdom', 100000000, 700000000000, 9000000, 7, null, '$700B Agriculture / Mythology', 'Freeze (vs Belvion)', null, 'Source: Season 1 world database
Spin: #14
Military: Air Superpower 7 / 11'),
('Daroille', 'daroille', 'Corporate Confederation', 15000000, 3000000000000, 100000, 4, null, '$3T Casinos', 'Allied (Qashira)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #15
Military: Medium 4 / 11'),
('Torenza', 'torenza', 'Authoritarian Republic', 50000000, 6000000000000, 600000, 10, null, '$6T Space / Human', 'Allied (Primis)', 'Defence Accords', 'Source: Season 1 world database
Spin: #16
Military: Expansionist 10 / 11'),
('Imeria', 'imeria', 'Colony - Feudal Warlords', 5000000, 400000000000, 10000, 3, null, '$400B Warlords', 'Colony of Vienzerna', null, 'Source: Season 1 world database
Spin: #17
Military: Standard 3 / 11'),
('Wonderia', 'wonderia', 'Colony - Cybernetic Regency', 80000000, 400000000000, 750000, 11, null, '$400B Cybernetics', 'Prot. of Yoggy', null, 'Source: Season 1 world database
Spin: #18
Military: Cyber Hegemony / Cyberwarfare 11 / 11'),
('B. Obrero', 'b-obrero', 'Progressive Union', 750000, 500000000, 50000, 3, null, '$500M Church Tax', 'PARIAH', 'HATED BY ALL', 'Source: Season 1 world database
Spin: #19
Military: Standard 3 / 11'),
('Vienzerna', 'vienzerna', 'Trade Empire', 125000000, 3500000000000, 750000, 10, null, '$3.5T Guilds', 'Colonizer', null, 'Source: Season 1 world database
Spin: #20
Military: Expansionist 10 / 11'),
('Vladaria', 'vladaria', 'Theocratic Kingdom', 5000000, 1000000000, 200000, 3, null, '$1B AI - / Ditopism', 'War (vs Isma)', 'Royal Wedding alliance', 'Source: Season 1 world database
Spin: #21
Military: Standard 3 / 11'),
('Bernaland', 'bernaland', 'Federal Republic', 5000000, 1000000000, 200000, 3, null, '$1B Robotics', 'Allied (Scopeople)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #22
Military: Standard 3 / 11'),
('Plesshurye', 'plesshurye', 'Democratic Republic', 500000000, 6000000000000, 800000, 7, null, '$6T Finance / Space', 'Exploration Culture', null, 'Source: Season 1 world database
Spin: #23
Military: Spatial Superpower 7 / 11'),
('Rei-Kai', 'rei-kai', 'Fascist Empire', 70000000, 7000000000000, 500000, 6, null, '$7T Biotech', 'War (vs Moradior)', 'POF Alliance', 'Source: Season 1 world database
Spin: #24
Military: Advanced 6 / 11'),
('Zharak-Ten', 'zharak-ten', 'Maritime Democracy', 200000000, 500000000000, 900000, 6, null, '$500B Fish / Ent. / / Shamanic', 'Allied (Navatonia)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #25
Military: Advanced 6 / 11'),
('Zottegem', 'zottegem', 'Financial Oligarchy', 30000000, 40000000000, 400000, 2, null, '$40B Shadow Bank', 'Allied (Moradior)', 'Defence Accords', 'Source: Season 1 world database
Spin: #26
Military: Small Defensive 2 / 11'),
('Fish State', 'fish-state', 'Naval Junta', 25000000, 400000000000, 300000, 5, null, '$400B Maritime', 'War (vs Imeria)', null, 'Source: Season 1 world database
Spin: #27
Military: Large 5 / 11'),
('Anuruthor', 'anuruthor', 'Protectorate', 40000000, 1000000000000, 500000, 2, null, '$1T Heavy Industry', 'Rival (vs Rei-Kai)', null, 'Source: Season 1 world database
Spin: #28
Military: Small Defensive 2 / 11'),
('Shadow Conf.', 'shadow-conf', 'Pirate Confederation', 175000000, 1500000000000, 500000, 5, null, '$1.5T Piracy', 'Rival (vs Nordmere)', null, 'Source: Season 1 world database
Spin: #29
Military: Large 5 / 11'),
('Tunguska', 'tunguska', 'Colony - Clan Council', 750000, 200000000000, 175000, 2, null, '$200B Ritual Tour.', 'Colony of U. Tribes', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #30
Military: Small Defensive 2 / 11'),
('C. Ranchers', 'c-ranchers', 'Anarchist Commune', 10000000, 5000000000, 100000, 8, null, '$5B Ranching', 'Anarchist', 'Royal Wedding alliance', 'Source: Season 1 world database
Spin: #31
Military: Regional Influence Army 8 / 11'),
('Solaria', 'solaria', 'Federal Empire', 100000000, 9000000000000, 60000, 5, null, '$9T Shadow Banking', 'Defense Pact (Dalgaristan)', 'POF Alliance', 'Source: Season 1 world database
Spin: #32
Military: Large 5 / 11
Phase 2: 1 HDI / +1 GDP'),
('Skressia', 'skressia', 'Drone Republic', 15000000, 50000000000, 1000, 3, null, '$50B Drones', 'War (vs Azur Axis)', null, 'Source: Season 1 world database
Spin: #33
Military: Standard 3 / 11'),
('Moravia', 'moravia', 'Cyber-Dictatorship', 900000000, 8000000000000, 3000000, 11, null, '$8T Cyber / Loans', 'War (vs Golden Land)', 'Defence Accords)', 'Source: Season 1 world database
Spin: #34
Military: WORLD MENACE 11 /11
Phase 2: Next turn can attack Zubrossya'),
('ABOC', 'aboc', 'Decentralized Union', 700000000, 1000000000000, 90000, 0, null, '$1T Waste Mgt', 'Trade (Rei-Kai)', null, 'Source: Season 1 world database
Spin: #35
Military: None 0 / 11'),
('Voidia', 'voidia', 'Agrarian Monarchy', 40000000, 500000000000, 200000, 9, null, '$500B Agriculture - Alien Cult', 'Freeze (vs Maronia)', null, 'Source: Season 1 world database
Spin: #36
Military: Continental Power 9 / 11'),
('Runonno', 'runonno', 'Military Superstate', 25000000, 1000000000000, 800000, 7, null, '$1T Security', 'VS EVERYONE', null, 'Source: Season 1 world database
Spin: #37
Military: Land Superpower 7 / 11'),
('Azur Axis', 'azur-axis', 'AI Corporatocracy', 40000000, 900000000000, 500000, 2, null, '$900B Shell / AI', 'War (vs Skressia)', null, 'Source: Season 1 world database
Spin: #38
Military: Small Defensive 2 / 11'),
('Freelandia', 'freelandia', 'Industrial Republic', 15000000, 900000000000, 350000, 8, null, '$900B Heavy Ind.', 'War (vs Belvion)', null, 'Source: Season 1 world database
Spin: #39
Military: Regional Power 8 / 11'),
('Aragon', 'aragon', 'Media Monarchy', 80000000, 3000000000000, 350000, 9, null, '$3T Entertainment', 'Allied (Whiterun)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #40
Military: Continental Power 9 / 11'),
('Scopeople', 'scopeople', 'Tribal Kingdom', 30000000, 1000000000, 175000, 0, null, '$1B Local Trade', 'Allied (Bernaland)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #41
Military: None 0 / 11'),
('Aura Sancta', 'aura-sancta', 'Empire', 500000000, 10000000000000, 12000000, 11, null, '$10T Tourism', 'World Peace Doctrine', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #42
Military: WORLD POLICE 11 / 11'),
('Navatonia', 'navatonia', 'Shamanic Republic', 300000000, 3000000000000, 750000, 8, null, '$3T Mining / Shaman', 'Allied (Zharak-Ten)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #43
Military: Regional Power 8 / 11'),
('Abolitionist G.', 'abolitionist-g', 'Guild Republic', 200000000, 9000000000000, 75000, 9, null, '$9T Black Market', 'PARIAH', 'HATED BY ALL', 'Source: Season 1 world database
Spin: #44
Military: Continental Power 9 / 11
Phase 2: Supports Moravia'),
('Golden Land', 'golden-land', 'Mercantile Democracy', 25000000, 3000000000000, 125000, 9, null, '$3T Grey Market', 'War (vs Moravia)', null, 'Source: Season 1 world database
Spin: #45
Military: Continental Power 9 / 11'),
('Whiterun', 'whiterun', 'Academic Republic', 30000000, 600000000000, 300000, 4, null, '$600B Education', 'Allied (Aragon)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #46
Military: Medium Army 4 / 11'),
('United Tribes', 'united-tribes', 'Tribal Confederation', 10000000, 400000000000, 200000, 4, null, '$400B Green Econ', 'Parent of Tunguska', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #47
Military: Medium Army 4 / 11'),
('Icelania', 'icelania', 'Pharma Republic', 125000000, 14000000000000, 400000, 6, null, '$14T Pharma / Manuf', 'Rival (Catomane)', null, 'Source: Season 1 world database
Spin: #48
Military: Advanced Army 6 / 11'),
('Omaleko', 'omaleko', 'Social Commonwealth', 400000000, 12000000000000, 1000000, 3, null, '$12T Oil / Auto', 'Tension (Catomane)', 'Defence Accords', 'Source: Season 1 world database
Spin: #49
Military: Standard 3 / 11
Phase 2: No more / Border Tension'),
('Rootbeerism', 'rootbeerism', 'Corporate State', 80000000, 1000000000000, 200000, 7, null, '$1T Call Centers', 'Trade (Runonno)', null, 'Source: Season 1 world database
Spin: #50
Military: Special Forces 7 / 11'),
('Dowenia', 'dowenia', 'Crypto-Anarchy', 1200000000, 5000000000000, 1000000, 0, null, '$5T Crypto / Bank', 'Underground Networks', null, 'Source: Season 1 world database
Spin: #51
Military: None 0 / 11'),
('Schizolandia', 'schizolandia', 'People''s Union', 100000, 50000000, 40000, 2, null, '$50M Cultural / Druidic', 'Hostile (Moravia)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #52
Military: Small Defensive 2 / 11'),
('Lumenie', 'lumenie', 'Colony - Nomadics', 5000000, 100000000, 125000, 3, null, '$100M AI / Robots', 'Prot. of B. Obrero', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #53
Military: Standard 3 / 11'),
('URHNB', 'urhnb', 'United Republics', 15000000, 100000000000, 900000, 9, null, '$100B Defense', 'Former War (vs Dalgaristan)', null, 'Source: Season 1 world database
Spin: #54
Military: Continental Power 9 / 11
Phase 2: WAR OVER'),
('Black Cult', 'black-cult', 'Expansionist Theocracy', 250000000, 7000000000000, 500000, 10, null, '$7T Energy / Manuf', 'PARIAH', 'HATED BY ALL', 'Source: Season 1 world database
Spin: #55
Military: Expansionist 10 / 11'),
('G. Celtia', 'g-celtia', 'Clan Empire', 90000000, 30000000000000, 400000, 7, null, '$30T Cloning', 'Rival (Solaria)', null, 'Source: Season 1 world database
Spin: #56
Military: Air Superpower 7 / 11'),
('Sabrayana', 'sabrayana', 'Magical Empire', 2500000000, 12000000000000, 12000000, null, null, '$12T Magic Cards - Shamanic', 'Allied (Melandia)', null, 'Source: Season 1 world database
Spin: #57
Military: Expansionist Power'),
('Aesyl', 'aesyl', 'Independent Commune', 7000000, 150000000000, 40000, 6, null, '$150B Wooden Chairs', 'Guaranteed by ALL', 'Global Arbiter (HQ)', 'Source: Season 1 world database
Spin: #58
Military: Advanced Army 6 / 11'),
('Techlandia', 'techlandia', 'Technocratic State', 60000000, 8000000000000, 500000, 7, null, '$8T Space / Nuclear', 'Allied (Navatonia)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #59
Military: Spatial Superpower 7 / 11'),
('Black League', 'black-league', 'Forced Labor Union', 150000000, 5000000000000, 800000, 7, null, '$5T Forced Labor', 'War (vs Belvion)', null, 'Source: Season 1 world database
Spin: #60
Military: Land Superpower 7 / 11'),
('Norasia', 'norasia', 'Republic', 250000, 20000000000, 75000, 2, null, '$20B Salt Monopoly', 'Allied (Dalgaristan)', null, 'Source: Season 1 world database
Spin: #61
Military: Small Defensive 2 / 11
Phase 2: Inflige - 10 GDP si attack zubrosya'),
('Rootberia', 'rootberia', 'Gambling State', 3000000, 30000000000, 40000, 2, null, '$30B Gambling', 'Trade (Voidia)', null, 'Source: Season 1 world database
Spin: #62
Military: Small Defensive 2 / 11'),
('Solandria', 'solandria', 'Colony', 15000000, 700000000000, 250000, 3, null, '$700B Cybernetics / Fire god', 'Colony of Sabrayana', null, 'Source: Season 1 world database
Spin: #63
Military: Standard 3 / 11'),
('Traguera', 'traguera', 'Auth, Republic', 5000000, 15000000000, 400000, 3, null, '$15B Addiction Food', 'Allied (Golden Land)', null, 'Source: Season 1 world database
Spin: #64
Military: Standard 3 / 11'),
('Dravencia', 'dravencia', 'Fascism', 150000000, 12000000000000, 3000000, 5, null, '$12T Rare Wood', 'Allied (Anuruthor)', null, 'Source: Season 1 world database
Spin: #65
Military: Large Army 5 / 11'),
('Zhiva-Zarina', 'zhiva-zarina', 'Confederation', 5000000, 90000000000, 450000, 2, null, '$90B Health / Auto', 'Trade (Belvion)', null, 'Source: Season 1 world database
Spin: #66
Military: Small Defensive 2 / 11'),
('Qashira', 'qashira', 'Parliamentary Democracy', 10000000, 900000000000, 400000, 8, null, '$900B Education', 'Allied (Daroille)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #67
Military: Regional Power 8 / 11
Phase 2: 10 milions refugees'),
('Karakum', 'karakum', 'Communist Republic', 3000000, 4000000000, 300000, 0, null, '$4B Hydropower', 'Prot. (B. Obrero)', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #68
Military: None 0 / 11'),
('Zandoro', 'zandoro', 'Military Dictatorship', 4000000, 110000000000, 175000, 5, null, '$110B Art / Bananas', 'Hostile (Yoggy)', null, 'Source: Season 1 world database
Spin: #69
Military: Large Army 5 / 11
Phase 2: No more art +1 gdp + 1 army'),
('Zubrossya', 'zubrossya', 'Communist Social Republic', 15000000, 500000000000, 450000, 6, null, '$500B Global Data', 'Tension (Moravia)', null, 'Source: Season 1 world database
Spin: #70
Military: Advanced Army 6 / 11'),
('Yerna', 'yerna', 'Fascist Republic', 250000000, 9000000000000, 1000000, 7, null, '$9T Lit. / Subscriptions', 'Influence (Moradior)', 'Defence Accords', 'Source: Season 1 world database
Spin: #71
Military: Land Superpower 7 / 11'),
('Katzash', 'katzash', 'Federal Democracy', 50000000, 1000000000000, 800000, 10, null, '$1T Paper / Innov.', 'Allied (Moravia)', 'Defence Accords', 'Source: Season 1 world database
Spin: #72
Military: Expansionist 10 / 11
Phase 2: Expend 1 M km2'),
('Syrenthia', 'syrenthia', 'Colony - Warrior Council', 250000, 40000000000, 60000, 7, null, '$40B Mercenaries', 'Prot. of Moravia', 'Defence Accords', 'Source: Season 1 world database
Spin: #73
Military: Special Forces 7 / 11'),
('Xentael', 'xentael', 'Communist State', 7000000, 150000000000, 150000, 4, null, '$150B Nuc. Waste', 'Trade (Rei-Kai)', null, 'Source: Season 1 world database
Spin: #74
Military: Medium Army 4 / 11'),
('Ditopia', 'ditopia', 'Theocracy', 1000000, 90000000000, 20000, 6, null, '$90B Rails / Holy - / Ditopism', 'Non-Aligned', 'Global Arbiter', 'Source: Season 1 world database
Spin: #75
Military: Advanced Army 6 / 11'),
('Veltaris', 'veltaris', 'Absolute Monarchy', 125000000, 18000000000000, 1000000, 11, null, '$18T Monopolies', 'Non-Aligned', 'Global Arbiter', 'Source: Season 1 world database
Spin: #76
Military: WORLD ARBITER 11 / 11'),
('Santa Kova', 'santa-kova', 'Confederation', 115000000, 2000000000000, 1000000, 7, null, '$2T - Literrature and Voice acting', 'South Defence Accords', 'Defence Accords', 'Source: Season 1 world database
Spin: #77
Military: Naval Superpower 7 / 11'),
('ShieldHolm', 'shieldholm', 'Auth, Republic', 10000000, 500000000000, 750000, 4, null, '$500B - Troll farm - Cloning', 'Non-Aligned', null, 'Source: Season 1 world database
Spin: #78
Military: Medium Army 4 / 11'),
('Kingdom of Maple', 'kingdom-of-maple', 'Monarchy', 30000000, 900000000000, 900000, 7, null, '$900B - Oil / Gas and Anime', 'POF Alliance', 'POF Alliance', 'Source: Season 1 world database
Spin: #79
Military: Army Alliances 7 / 11'),
('Britonia', 'britonia', 'Military Dictatorship', 5000000, 90000000000, 3000000, 3, null, '$90B - Corruption', null, 'Defence Accords', 'Source: Season 1 world database
Spin: #80
Military: Standard 3 / 11'),
('Chungun Republic', 'chungun-republic', 'Presidential Republic', 50000000, 900000000000, 500000, 4, null, '$900B - Healthcare', null, 'Defence Accords', 'Source: Season 1 world database
Spin: #81
Military: Medium Army 4 / 11'),
('Cordolia', 'cordolia', 'Communism', 30000000, 1000000000000, 3000000, 7, null, '$1 T - Cybernetics and Shadow trade', 'Non-Aligned', null, 'Source: Season 1 world database
Spin: #82
Military: Cybernetics Army 7 / 11'),
('Golden River', 'golden-river', 'Confederation', 7000000, 8000000000000, 450000, 7, null, '$8 T - Bananas and Maritime trade', 'POF Alliance', 'POF Alliance', 'Source: Season 1 world database
Spin: #83
Military: Naval Superpower 7 / 11'),
('Great Valoria', 'great-valoria', 'Shamanic Council', 25000000, 500000000000, 600000, 4, null, '$500 B - Church tax', 'Non-Aligned', null, 'Source: Season 1 world database
Spin: #84
Military: Medium Army 4 / 11'),
('Royal Guild of Jamland', 'royal-guild-of-jamland', 'Merchant guild Kingdom', 7000000, 300000000000, 300000, 2, null, '$300 B - Manufacturing', 'South Defence Accords', 'Defence Accords', 'Source: Season 1 world database
Spin: #85
Military: Small Defensive 2 / 11'),
('United Geats', 'united-geats', 'Democracy', 200000000, 10000000000000, 6000000, 5, null, '$10T - Agriculture & Textile', 'Non-Aligned', null, 'Source: Season 1 world database
Spin: #86
Military: Large Army 5 / 11'),
('Geometrizan', 'geometrizan', 'Democracy', 2000000, 100000000000, 60000, 3, null, '$100 B - Tourist Exploitation', null, 'POF Alliance', 'Source: Season 1 world database
Spin: #87
Military: Standard 3 / 11'),
('Union Of Man and Nature', 'union-of-man-and-nature', 'Colony', 7000000, 300000000000, 900000, 4, null, '$300 B - Hydropower', 'Colony - Plesshurye', 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #88
Military: Medium Army 4 / 11'),
('New Eldia', 'new-eldia', 'Auth, Republic', 40000000, 4000000000000, 450000, 8, null, '$4 T -Social Credit / Voice Acting', null, null, 'Source: Season 1 world database
Spin: #89
Military: Regional Power 8 / 11'),
('Rep, of the Sun', 'rep-of-the-sun', 'Theocracy (Fire God)', 30000000, 10000000000000, 300000, 6, null, '$10 T - Tax Haven / Shadow banking', null, null, 'Source: Season 1 world database
Spin: #90
Military: Advanced Army 6 / 11'),
('Autrian Empire', 'autrian-empire', 'Empire', 90000000, 14000000000000, 1000000, 10, null, '$14 T - Heavy Industry / Private Security', null, null, 'Source: Season 1 world database
Spin: #91
Military: Expansionist 10 / 11'),
('Bobak', 'bobak', 'Republic', 6000000, 25000000000000, 250000, 3, null, '$25 T - Crypto (bobakoins)', null, null, 'Source: Season 1 world database
Spin: #92
Military: Standard 3 / 11'),
('Xonisia', 'xonisia', 'Constitutional Monarchy', 40000000, 3000000000000, 350000, 5, null, '$3 T - Sub Sea Cable', null, 'POF Alliance', 'Source: Season 1 world database
Spin: #93
Military: Large Army 5 / 11'),
('Calradia', 'calradia', 'Communist', 500000, 40000000000, 500000, 3, null, '$40 B - Corruption', null, null, 'Source: Season 1 world database
Spin: #94
Military: Standard 3 / 11'),
('Altergrad', 'altergrad', 'Federal Republic', 30000000, 700000000000, 200000, 5, null, '$700 B - Publishing / Pure Water', null, 'Novus Ordo Mundi', 'Source: Season 1 world database
Spin: #95
Military: Large Army 5 / 11'),
('Grand Norvask', 'grand-norvask', 'Absolute Monarchy', 5000000, 50000000000, 350000, 5, null, '$50 B - Agriculture', null, null, 'Source: Season 1 world database
Spin: #96
Military: Large Army 5 / 11'),
('Makara', 'makara', 'Clan Council', 25000000, 40000000000, 800000, 0, null, '$40 B - Caravan routes', null, null, 'Source: Season 1 world database
Spin: #97
Military: None 0 / 11'),
('Nervella', 'nervella', 'Military Dictatorship', 500000, 75000000000, 250000, 4, null, '$75B - Tax Haven', null, null, 'Source: Season 1 world database
Spin: #98
Military: Medium Army 4 / 11'),
('Wondrak', 'wondrak', 'City State', 2000000, 120000000000, 10000, 4, null, '$120B - Casino', null, null, 'Source: Season 1 world database
Spin: #99
Military: Medium Army 4 / 11'),
('Urium', 'urium', 'Shamanic Council', 80000000, 4500000000000, 600000, 9, null, '$4,5 T - Drone / Agriculture', null, null, 'Source: Season 1 world database
Spin: #100
Military: Continental Power 9 / 11'),
('Krakos Landia', 'krakos-landia', 'Theocracy (Shaman)', 2000000, 60000000000, 50000, 4, null, '$60 B - Tourism', null, null, 'Source: Season 1 world database
Spin: #101
Military: Medium Army 4 / 11'),
('Wurland', 'wurland', 'Guild State', 15000000, 200000000000, 200000, 3, null, '$200 B - Entertainment', null, null, 'Source: Season 1 world database
Spin: #102
Military: Standard 3 / 11'),
('Harl', 'harl', 'Military Dictatorship', 50000000, 7000000000000, 750000, 10, null, '$7 T - Off Shore shell / Exorcism', null, null, 'Source: Season 1 world database
Spin: #103
Military: Expansionist 10 / 11'),
('North Xonisia', 'north-xonisia', null, null, null, 500000, null, null, null, null, null, 'Source: Season 1 world database
Spin: #104'),
('South Isma', 'south-isma', null, null, null, 300000, null, null, null, null, null, 'Source: Season 1 world database
Spin: #105'),
('Aagyr', 'aagyr', 'Presidential Republic', 250000004, 500000000000, 3000005, 5, 0.84, 'Jewelry craft', 'Diplo Isolation', 'Demonbound', 'Source: Season 2 base
Spin: #1
Leader traits: Vengeful +2 Mil
Military: Basic Army 5/10
Cultures: Never Smiling
Allegiance: Demonbound
Blessing / Curse: Diplo Isolation
Localisation: South Fang
Influence: 5.0
Note: 5.5'),
('Grunewald', 'grunewald', 'Auth. Republic', 2500000008, 2500000000000, 10000007, 5, 0.8, 'Hydropower / Cows', 'Long peace', 'Demonbound', 'Source: Season 2 base
Spin: #2
Leader traits: Leper -2 HDI
Military: Basic Army 5/10
Cultures: Nap / Guild order
Allegiance: Demonbound
Blessing / Curse: Long peace
Localisation: North Fang
Influence: 6.0
Note: 7'),
('Weak Empire', 'weak-empire', 'High Tribal Kingdom', 500000005, 900000000000, 9000007, 6, 0.62, 'Manuf / Desalinisation', 'Ember Industry', 'Demonbound', 'Source: Season 2 base
Spin: #3
Leader traits: Beautiful +1 HDI
Military: Organized Army 6/10
Cultures: Elder Respect / Shaming
Allegiance: Demonbound
Blessing / Curse: Ember Industry
Localisation: Red Ear
Influence: 5.0
Note: 6'),
('Rōzurando shū', 'r-zurando-sh', 'Presidential Republic', 800000006, 9000000000000, 6000006, 6, 0.93, 'Critical Ress / Bananas', 'Iron Stability', 'Resilient', 'Source: Season 2 base
Spin: #4
Leader traits: Naive -2 Military
Military: Organized Army 6/10
Cultures: Matriarchal
Allegiance: Resilient
Blessing / Curse: Iron Stability
Localisation: Feastwater
Influence: 8.0
Note: 7.333333333'),
('Vulcan', 'vulcan', 'Plutocracy', 1100000006, 9000000000000, 600002, 9, 0.92, 'Mining', 'Strategic Hesitation', 'Resilient', 'Source: Season 2 base
Spin: #5
Leader traits: Zealous +2 Mil
Military: Global Military (Land/Air) 9/10
Cultures: Underground
Allegiance: Resilient
Blessing / Curse: Strategic Hesitation
Localisation: Red Ear
Influence: 8.0
Note: 7.166666667'),
('Autronia', 'autronia', 'Constitutional Monarchy', 90000003, 600000000000, 400002, 0, 0.6, 'Heavy Industry', 'Economic Collapse', 'Demonbound', 'Source: Season 2 base
Spin: #6
Leader traits: Quick +1 GDP
Military: No Army 0/10
Cultures: Cybernetic
Allegiance: Demonbound
Blessing / Curse: Economic Collapse
Localisation: Seas of tears
Influence: 3.0
Note: 3.5'),
('Invictus Realm', 'invictus-realm', 'Absolute Monarchy', 600000005, 1000000000000, 5000006, 7, 0.96, 'Scientific Res / Coffee', 'Steady Growth', 'Resilient', 'Source: Season 2 base
Spin: #7
Leader traits: Imbecile -3 GDP
Military: Elite Army 7/10
Cultures: Authorit. / Scientific
Allegiance: Resilient
Blessing / Curse: Steady Growth
Localisation: North Fang
Influence: 6.0
Note: 6.833333333'),
('Yoyleland', 'yoyleland', 'City- State', 20000002, 15000000000, 200001, 1, 0.75, 'Beers', 'Infernal Surge', 'Demonbound', 'Source: Season 2 base
Spin: #8
Leader traits: Fecund +2 Pop
Military: Civil Guard 1/10
Cultures: Hedonistic
Allegiance: Demonbound
Blessing / Curse: Infernal Surge
Localisation: Nosecrest
Influence: 2.0
Note: 2.5'),
('Intdocryn', 'intdocryn', 'Technocracy', 40000003, 500000000000, 1500004, 5, 0.76, 'Financial Services +1 GDP', 'Internal Revolt', 'Demonbound', 'Source: Season 2 base
Spin: #9
Leader traits: Quick +1 GDP
Military: Basic Army 5/10
Cultures: Ultra Surveillance
Allegiance: Demonbound
Blessing / Curse: Internal Revolt
Localisation: Seas of tears
Influence: 4.0
Note: 5'),
('Belvaria', 'belvaria', 'Communism', 600000005, 600000000000, 8000007, 8, 0.62, 'Paper / Heavy Ind', 'Blood Economy', 'Demonbound', 'Source: Season 2 base
Spin: #10
Leader traits: Deceitful -2 HDI
Military: Regional Military (Land) 8/10
Cultures: Shaman / Storytell, Oral
Allegiance: Demonbound
Blessing / Curse: Blood Economy
Localisation: Twin Diadems
Influence: 7.0
Note: 6.666666667'),
('Trivarya', 'trivarya', 'Communism', 100000003, 700000000000, 4500005, 7, 0.65, 'Yogurt Flavoring', 'Ressource Burn', 'Demonbound', 'Source: Season 2 base
Spin: #11
Leader traits: Schemer +1 GDP
Military: Elite Army 7/10
Cultures: Leader Worshipping
Allegiance: Demonbound
Blessing / Curse: Ressource Burn
Localisation: Seas of tears
Influence: 3.0
Note: 5.166666667'),
('Atomicmixiz', 'atomicmixiz', 'Fed. Republic', 20000002, 500000000, 1000003, 6, 0.91, 'Road Construction', 'Hellfleet Naval Sup. Feastwater', 'Demonbound', 'Source: Season 2 base
Spin: #12
Leader traits: Bastard - No Malus Republic
Military: Organized Army 6/10
Cultures: Ascetic
Allegiance: Demonbound
Blessing / Curse: Hellfleet Naval Sup. Feastwater
Localisation: Feastwater
Influence: 3.0
Note: 4'),
('Ayyutit', 'ayyutit', 'Council of 100 Clans', 6000000009, 9000000000000, 6000006, 7, 0.42, 'Security / Pharma / Hairstylist', 'Dark Pact Trade', 'Demonbound', 'Source: Season 2 base
Spin: #13
Leader traits: Calm +1 HDI
Military: Elite Army 7/10
Cultures: Desert / Superstitious / Utopian
Allegiance: Demonbound
Blessing / Curse: Dark Pact Trade
Localisation: Red Ear
Influence: 7.0
Note: 7'),
('Federal', 'federal', 'Fascism', 170000000010, 20000000000000, 60000009, 9, 0.92, 'Agri / Lobby / Lux. Cruise', 'Ember Industry', 'Demonbound', 'Source: Season 2 base
Spin: #14
Leader traits: Strategist +3 Military
Military: Global Military (Naval/Air) 9/10
Cultures: Medicine / Scholars / Fraternity
Allegiance: Demonbound
Blessing / Curse: Ember Industry
Localisation: Twin Diadems
Influence: 9.0
Note: 9.333333333'),
('Aurizhan', 'aurizhan', 'Communism', 5000001, 750000000, 1250003, 5, 0.96, 'Golden Rice', 'Crimson Mobilization', 'Demonbound', 'Source: Season 2 base
Spin: #15
Leader traits: Just +2 HDI
Military: Basic Army 5/10
Cultures: Vegan
Allegiance: Demonbound
Blessing / Curse: Crimson Mobilization
Localisation: South Fang
Influence: 3.0
Note: 3.833333333'),
('Qamilandia', 'qamilandia', 'Presidential Republic', 70000003, 1000000000000, 9000007, 7, 0.59, 'Elder''s Care', 'Infernal Surge', 'Demonbound', 'Source: Season 2 base
Spin: #16
Leader traits: Temperate +1 GDP
Military: Elite Army 7/10
Cultures: Anti Science -1 HDI
Allegiance: Demonbound
Blessing / Curse: Infernal Surge
Localisation: Quiet Reach
Influence: 5.0
Note: 5.666666667'),
('Bennia', 'bennia', 'Corporate State', 10000002, 10000000000, 600002, 3, 0.55, 'Gambling', 'Hellmouth Risk', 'Demonbound', 'Source: Season 2 base
Spin: #17
Leader traits: Dwarf -1 HDI
Military: Local Militia 3/10
Cultures: Pacifist
Allegiance: Demonbound
Blessing / Curse: Hellmouth Risk
Localisation: Quiet Reach
Influence: 2.0
Note: 2.666666667'),
('Arcinia', 'arcinia', 'Auth. Republic', 1150000006, 150000000000, 9000007, 0, 0.28, 'Garbage / Street Food', 'Moral Unity', 'Resilient', 'Source: Season 2 base
Spin: #18
Leader traits: Murderer -3 HDI
Military: No Army 0/10
Cultures: Forest / Mountain clans
Allegiance: Resilient
Blessing / Curse: Moral Unity
Localisation: Red Ear
Influence: 3.0
Note: 3.833333333'),
('Forgovia', 'forgovia', 'Absolute Monarchy', 1000001, 15000000000, 100001, 1, 0.98, 'Top University', 'Population Drain', 'Demonbound', 'Source: Season 2 base
Spin: #19
Leader traits: Generous +2 HDI
Military: Civil Guard 1/10
Cultures: Road Rage
Allegiance: Demonbound
Blessing / Curse: Population Drain
Localisation: Nosecrest
Influence: 5.0
Note: 3.333333333'),
('Ranak', 'ranak', 'Absolute Monarchy', 800000006, 1000000000000, 3000005, 6, 0.87, 'Weeding Venues / Mercenaries', 'Mountain Shield', 'Resilient', 'Source: Season 2 base
Spin: #20
Leader traits: Generous +2 HDI
Military: Organized Army 6/10
Cultures: Militaristic / Ancestor respect
Allegiance: Resilient
Blessing / Curse: Mountain Shield
Localisation: Nosecrest
Influence: 5.0
Note: 6.166666667'),
('Silker', 'silker', 'Military Dictatorship', 250000004, 700000000000, 9000007, 5, 0.31, 'Eco Toilets / Mercenaries', 'Population Drain', 'Demonbound', 'Source: Season 2 base
Spin: #21
Leader traits: Architect +2 GDP
Military: Basic Army 5/10
Cultures: Melting pot / Substance Free
Allegiance: Demonbound
Blessing / Curse: Population Drain
Localisation: Feastwater
Influence: 4.0
Note: 5'),
('Kytom', 'kytom', 'Corporate State', 5000001, 50000000, 900003, 1, 0.38, 'Grey Market', 'Demonic Fear', 'Demonbound', 'Source: Season 2 base
Spin: #22
Leader traits: Poet +1 HDI
Military: Civil Guard 1/10
Cultures: Futuristic Utopian
Allegiance: Demonbound
Blessing / Curse: Demonic Fear
Localisation: North Fang
Influence: 1.0
Note: 1.5'),
('Kaelvyr', 'kaelvyr', 'Empire', 900000006, 4000000000000, 7500006, 8, 0.87, 'Forced labor / Warlord trade', 'Demon Dependancy', 'Demonbound', 'Source: Season 2 base
Spin: #23
Leader traits: Berseker +2 Military
Military: Regional Military (Land) 8/10
Cultures: Name changing / Muscle
Allegiance: Demonbound
Blessing / Curse: Demon Dependancy
Localisation: Twin Diadems
Influence: 6.0
Note: 7'),
('Pentara', 'pentara', 'Confederation', 700000006, 3000000000000, 40000009, 10, 0.94, 'Motocycle / Best Architect', 'Steady Growth', 'Resilient', 'Source: Season 2 base
Spin: #24
Leader traits: Genius +3 GDP
Military: SUPERPOWER (All Spe) 10/10
Cultures: Pride being late / Authoritarian
Allegiance: Resilient
Blessing / Curse: Steady Growth
Localisation: South Fang
Influence: 9.0
Note: 8.5'),
('Novaterra', 'novaterra', 'Confederation', 1000000006, 4000000000000, 5000006, 6, 0.63, 'Manufacture / Exorcism', 'Civil Fear', 'Demonbound', 'Source: Season 2 base
Spin: #25
Leader traits: Amateur plotter -1 GDP
Military: Organized Army 6/10
Cultures: Dog Sacral, / Doomer
Allegiance: Demonbound
Blessing / Curse: Civil Fear
Localisation: Nosecrest
Influence: 5.0
Note: 6.166666667'),
('Aethelgard', 'aethelgard', 'Military Dictatorship +1 Military', 170000000010, 8000000000000, 30000008, 8, 0.79, 'Tourism / Construction / Music', 'Crimson Mobilization', 'Demonbound', 'Source: Season 2 base
Spin: #26
Leader traits: Seducer +1 Influence
Military: Regional Military (Land) 8/10
Cultures: Dream / Minimalist / Sky
Allegiance: Demonbound
Blessing / Curse: Crimson Mobilization
Localisation: Twin Diadems
Influence: 7.0
Note: 8.166666667'),
('Union', 'union', 'Communism', 800000006, 900000000000, 3000005, 6, 0.72, 'Archeology / Tax Haven', 'Ressources Scarcity', 'Resilient', 'Source: Season 2 base
Spin: #27
Leader traits: Born Purple +2 HDI
Military: Organized Army 6/10
Cultures: Guild Order / Commercial
Allegiance: Resilient
Blessing / Curse: Ressources Scarcity
Localisation: Quiet Reach
Influence: 5.0
Note: 6'),
('Bellville', 'bellville', 'Fed. Republic', 500000005, 400000000000, 6000006, 3, 0.91, 'Hidropower / Real Estate', 'Diplo Isolation', 'Demonbound', 'Source: Season 2 base
Spin: #28
Leader traits: Callous -2 HDI
Military: Local Militia 3/10
Cultures: Underground / Spiritual
Allegiance: Demonbound
Blessing / Curse: Diplo Isolation
Localisation: Feastwater
Influence: 3.0
Note: 5.333333333'),
('Hope', 'hope', 'Presidential Republic', 110000003, 25000000000000, 300001, 7, 0.99, 'Critical Ressource (Uranium)', 'Ember Industry', 'Demonbound', 'Source: Season 2 base
Spin: #29
Leader traits: Fecund +2 Pop
Military: Elite Army 7/10
Cultures: Dance
Allegiance: Demonbound
Blessing / Curse: Ember Industry
Localisation: Feastwater
Influence: 8.0
Note: 6.5'),
('Vungor', 'vungor', 'Merchant Guild State', 150000004, 400000000000, 10000007, 3, 0.85, 'Anime', 'Infernal Surge', 'Demonbound', 'Source: Season 2 base
Spin: #30
Leader traits: Pure Blooded +1 HDI
Military: Local Militia 3/10
Cultures: Silence / Meditation
Allegiance: Demonbound
Blessing / Curse: Infernal Surge
Localisation: North Fang
Influence: 5.0
Note: 5.5'),
('Werre', 'werre', 'Constitutional Monarchy', 10000002, 5000000000, 1000003, 3, 0.36, 'Human Testing', 'Internal Revolt', 'Demonbound', 'Source: Season 2 base
Spin: #31
Leader traits: Ugly -1 HDI
Military: Local Militia 3/10
Cultures: Bicycle
Allegiance: Demonbound
Blessing / Curse: Internal Revolt
Localisation: Seas of tears
Influence: 2.0
Note: 2.5'),
('Hellios', 'hellios', 'Confederation', 12000000009, 14000000000000, 4000005, 7, 0.82, 'Whales / Traffic / Rice', 'Mountain Shield', 'Resilient', 'Source: Season 2 base
Spin: #32
Leader traits: BladeMaster +2 Military
Military: Elite Army 7/10
Cultures: Cybernetics / Maritime / Loterry Mariages
Allegiance: Resilient
Blessing / Curse: Mountain Shield
Localisation: Nosecrest
Influence: 7.0
Note: 7.5'),
('Doolandia', 'doolandia', 'Communism', 70000003, 800000000000, 7500006, 8, 0.86, 'Addiction-Based', 'Demon Dependancy', 'Demonbound', 'Source: Season 2 base
Spin: #33
Leader traits: Renowned Physician +3 HDI
Military: Regional Military (Air) 8/10
Cultures: Cleanliness Obssesion
Allegiance: Demonbound
Blessing / Curse: Demon Dependancy
Localisation: Feastwater
Influence: 7.0
Note: 6.5'),
('Tornavia', 'tornavia', 'Auth. Republic', 500000, 50000000000, 1000, 3, 0.95, 'Quantum Computing', 'Patient Strategy', 'Resilient', 'Source: Season 2 base
Spin: #34
Leader traits: Skilled Tactician +2 Military
Military: Local Militia 3/10
Cultures: One Child Policy
Allegiance: Resilient
Blessing / Curse: Patient Strategy
Localisation: Nosecrest
Influence: 5.0
Note: 3.333333333'),
('Imperial Dominion', 'imperial-dominion', 'Empire', 1000000006, 3500000000000, 30000008, 6, 0.98, 'Mining / Cybernetics Augmentation', 'Crimson Mobilization', 'Demonbound', 'Source: Season 2 base
Spin: #35
Leader traits: Imbecile -3 GDP
Military: Organized Army 6/10
Cultures: Royal / AI Guided
Allegiance: Demonbound
Blessing / Curse: Crimson Mobilization
Localisation: North Fang
Influence: 6.0
Note: 7.333333333'),
('Avarthon Dominion', 'avarthon-dominion', 'Confederation', 900000006, 5000000000000, 9000007, 7, 0.88, 'Vaccin / Processed food', 'Economic Collapse', 'Demonbound', 'Source: Season 2 base
Spin: #36
Leader traits: Irritable -1 HDI
Military: Elite Army 7/10
Cultures: Medicine / Scientific
Allegiance: Demonbound
Blessing / Curse: Economic Collapse
Localisation: North Fang
Influence: 6.0
Note: 7.166666667'),
('Dokikalan', 'dokikalan', 'Parlementary Democracy', 10000002, 120000000000, 1250003, 7, 0.72, 'Grey Market', 'Lower Prestige', 'Resilient', 'Source: Season 2 base
Spin: #37
Leader traits: Melancholic -2 GDP
Military: Elite Army 7/10
Cultures: Artisan
Allegiance: Resilient
Blessing / Curse: Lower Prestige
Localisation: Seas of tears
Influence: 3.0
Note: 4.5'),
('Helios', 'helios', 'Colony #35 Imp. Dominion', 70000003, 2000000000000, 7500006, 8, 0.53, 'Video Games', 'Ashen Resilience', 'Demonbound', 'Source: Season 2 base
Spin: #38
Leader traits: Berseker +2 Military
Military: Regional Military (Air) 8/10
Cultures: Matriarchal
Allegiance: Demonbound
Blessing / Curse: Ashen Resilience
Localisation: Feastwater
Influence: 5.0
Note: 5.833333333'),
('1000 suns', '1000-suns', 'Constitutional Monarchy', 1250000007, 1000000000000, 900000010, 6, 0.74, 'Religious Text / Caravan Trades', 'Slow Expansion', 'Resilient', 'Source: Season 2 base
Spin: #39
Leader traits: Theologian +1 HDI
Military: Organized Army 6/10
Cultures: Leader Worshipping / Cosmoplitan
Allegiance: Resilient
Blessing / Curse: Slow Expansion
Localisation: Feastwater
Influence: 7.0
Note: 7.333333333')
on conflict (slug) do update set
  name = excluded.name,
  government = excluded.government,
  population = excluded.population,
  gdp_usd = excluded.gdp_usd,
  land_km2 = excluded.land_km2,
  army_rank = excluded.army_rank,
  hdi = excluded.hdi,
  economy = excluded.economy,
  diplomatic_status = excluded.diplomatic_status,
  bloc = excluded.bloc,
  bio = excluded.bio;
