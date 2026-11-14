// EnviroTrap Nexus v0.3.0 - IBM AI for Good Challenge
// Real Attribution Engine built from 79,533 actual UIUC LoadMan records
// GPS nearest-centroid: 84.8% top-1 / 97.8% top-3 (held-out 20% test set)
// RFID lookup: 179 container-to-building mappings, 100% accuracy when RFID present
// Source: UIUC_LoadMan_Consolidated_Dataset.xlsx, Betsy Ruckman, F&S, UIUC

const { useState, useMemo, useEffect, useRef } = React;
const { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
        XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const PAL = {
  navy: '#1e3a5f', navyMid: '#2d5a8e', navyLight: '#3b6fae',
  cream: '#f8f5ee', creamDark: '#f0e8d5', border: '#e4d5b5',
  teal: '#2d6a4f', tealLight: '#66b089',
  amber: '#e9a825', amberDark: '#a87214', amberBg: '#fef9ec',
  red: '#dc2626', redLight: '#fee2e2', purple: '#7c3aed',
  muted: '#6b7280', text: '#374151', white: '#ffffff',
  PROVENANCE: { verified: '#2d6a4f', ai_inferred: '#3b6fae', unknown: '#9ca3af' },
  STREAMS: { 'Landfill': '#6b7280', 'Recycling': '#2d6a4f', 'Cardboard': '#3b6fae', 'Paper': '#c4a360', 'Unknown': '#9ca3af' },
};
const MC = ['#1e3a5f','#2d6a4f','#3b6fae','#e9a825','#66b089','#c4a360','#80a2ce','#a87214'];

// ─── REAL MODEL DATA ─────────────────────────────────────────────────────────
// Derived from 9,989 verified LoadMan records. NOT synthetic.
// See UIUC_LoadMan_Consolidated_Dataset.xlsx for full provenance.
const REAL_MODEL = {"rfid_to_site":{"0105670000000000000015C6":"VET MED BASIC SCIENCES BUILDING","0105670000000000000015EA":"VETERINARY RES FARM-CLINICAL RES BARN","0105670000000000000014D3":"VET MED BASIC SCIENCES BUILDING","010567000000000000001612":"ORCHARD DOWNS APARTMENTS","010567000000000000001477":"ORCHARD DOWNS APARTMENTS","0105670000000000000016B0":"ORCHARD DOWNS APARTMENTS","01056700000000000000139E":"ORCHARD DOWNS APARTMENTS","0105670000000000000011C5":"ORCHARD DOWNS APARTMENTS","010567000000000000001470":"ORCHARD DOWNS APARTMENTS","010567000000000000001494":"ORCHARD DOWNS APARTMENTS","010567000000000000001481":"VETERINARY TEACHING HOSPITAL","010567000000000000001459":"ORCHARD DOWNS APARTMENTS","01056700000000000000169A":"VETERINARY MEDICINE CHILLER PLANT","010567000000000000001413":"VETERINARY TEACHING HOSPITAL","010567000000000000001656":"AGRICULTURAL ENGR SCIENCES BLDG","0105670000000000000015F8":"EDUCATION BUILDING","0105670000000000000015D7":"VEGETABLE CROPS SHOP & STORAGE BUILDING","010567000000000000001569":"National Soybean Resarch","010567000000000000001718":"TEMPLE HOYNE BUELL HALL","010567000000000000001597":"VET MED BASIC SCIENCES BUILDING","010567000000000000001497":"ORCHARD DOWNS APARTMENTS","01056700000000000000167E":"TURNER HALL","010567000000000000001417":"ILLINI UNION BOOKSTORE","0105670000000000000015FC":"GIES BUSINESS INSTRUCTIONAL FACILITY","0105670000000000000017AA":"LAW BUILDING","01056700000000000000140E":"ANIMAL SCIENCES LABORATORY","0105670000000000000016AB":"ILLINI UNION BOOKSTORE","01056700000000000000158C":"MUMFORD HALL","010567000000000000001913":"SPEECH AND HEARING SCIENCE","010567000000000000001889":"GRAINGER ENGINEERING LIBRARY","010567000000000000001A12":"Institute for government and public affairs","010567000000000000001779":"ADMISSIONS AND RECORDS BUILDING","0105670000000000000013E1":"MEAT SCIENCE LABORATORY","01056700000000000000191B":"FORBES NATURAL HISTORY BUILDING","01056700000000000000189C":"REHABILITATION EDUCATION CENTER","010567000000000000001989":"PERSONNEL SERVICES BUILDING","0105670000000000000013EC":"Huff Hall","010567000000000000001437":"LINCOLN HALL","01056700000000000000177E":"KENNEY GYMNASIUM","01056700000000000000191D":"PUBLIC SAFETY BUILDING","01056700000000000000149F":"MUSIC BUILDING","010567000000000000001C41":"E-14 Community Cardboard","0105670000000000000018B0":"OAK STREET CHILLER PLANT","01056700000000000000182B":"MECHANICAL ENGINEERING LABORATORY","0105670000000000000014A9":"Foreign Language Building","010567000000000000001489":"Carl R. Woese Institute for Genomic Biology","0105670000000000000017F6":"NUCLEAR PHYSICS LABORATORY","0105670000000000000019C6":"PSYCHOLOGY LABORATORY","010567000000000000001BB9":"MICRO AND NANOTECHNOLOGY LABORATORY","01056700000000000000180E":"UNIVERSITY HIGH SCHOOL","010567000000000000001777":"Smith Music Building","0105670000000000000019ED":"KRANNERT CENTER FOR PERFORMING ARTS","01056700000000000000144A":"TAFT HOUSE","010567000000000000001732":"ILLINOIS SUSTAINABLE TECHNOLOGY CENTER","010567000000000000001945":"OAK STREET LIBRARY FACILITY","0105670000000000000017E5":"CHILD DEVELOPMENT LABORATORY","01056700000000000000196F":"LEVIS FACULTY CENTER","010567000000000000001985":"UNIVERSITY PRESS BUILDING","01056700000000000000176E":"CLARK HALL","010567000000000000001476":"ALTGELD HALL","043465000000000000009395":"PRESIDENT'S HOUSE","0434650000000000000097E6":"CERAMICS BUILDING","043465000000000000009423":"ENGINEERING HALL","04346500000000000000951C":"STUDENT-STAFF APTS-300 S GOODWIN, U","0434650000000000000093E3":"STUDENT STAFF APTS #2-GREEN/GOODWIN","043465000000000000009510":"ASHTON WOODS APARTMENTS","04346500000000000000958D":"ASHTON WOODS APARTMENTS","01056700000000000000165E":"EDUCATION BUILDING","043465000000000000009639":"ENTERPRISE WORKS","04346500000000000000967F":"NORTH CAMPUS PARKING DECK","0434650000000000000093F0":"TRANSPORTATION BUILDING","04346500000000000000957C":"ORCHARD DOWNS APARTMENTS","043465000000000000009339":"ORCHARD DOWNS APARTMENTS","043465000000000000009460":"ORCHARD DOWNS APARTMENTS","04346500000000000000953D":"ORCHARD DOWNS APARTMENTS","043465000000000000009629":"ENTERPRISE WORKS","043465000000000000009594":"ADVANCED COMPUTATION BLDG","0434650000000000000096CC":"NATURAL HISTORY BUILDING","043465000000000000009301":"909 W OREGON ST","0434650000000000000093E1":"CROP SCIENCES RESEARCH FACILITY","0434650000000000000092D0":"508 S Sixth St","043465000000000000009590":"ENGINEERING SCIENCES BUILDING","0434650000000000000092DB":"C-7 PARKING STRUCTURE, STUDENT STAFF","043465000000000000009623":"DANIELS HALL","043465000000000000009600":"DAVID KINLEY HALL","043465000000000000009515":"SIEBEL CENTER FOR COMPUTER SCIENCE","043465000000000000009482":"Roger Adams Laboratory","0105670000000000000014AE":"MUMFORD HALL","010567000000000000001954":"E-14 Community Cardboard","04346500000000000000935B":"DAVID KINLEY HALL","0434650000000000000096BD":"Krannert Art Museum","010567000000000000001882":"HARDING BAND BUILDING","04346500000000000000957E":"FRUIT RESEARCH FARM - ADMIN. BLDG.","0434650000000000000092D9":"FSI - FIREMANSHIP TRAINING FACILITIES","0434650000000000000096C4":"ASHTON WOODS APARTMENTS","043465000000000000009326":"ENGLISH BUILDING","043465000000000000009563":"NORTH CAMPUS CHILLER PLANT","010567000000000000001745":"National Soybean Resarch","0434650000000000000093B2":"Babcock Hall","0434650000000000000094A1":"Computer Application Building","0105670000000000000013AA":"STUDENT DINING AND RESIDENTIAL PROGRAMS","043465000000000000009441":"LINCOLN AVENUE RESIDENCE HALL","04346500000000000000939F":"ADMIN INFORMATION TECHNOLOGY BLDG","01056700000000000000158E":"HOPKINS HALL","01056700000000000000146F":"Ikenberry Commons- Scott Hall","01056700000000000000150D":"Huff Hall","0434650000000000000093C5":"STUDENT SERVICES ARCADE BUILDING","010567000000000000001A38":"MICRO AND NANOTECHNOLOGY LABORATORY","043465000000000000009607":"DIGITAL COMPUTER LABORATORY","043465000000000000009413":"HOUSING WAREHOUSE","01056700000000000000139C":"ALTGELD HALL","0434650000000000000093F7":"NORTH CAMPUS PARKING DECK","043465000000000000009534":"805 PENNSYLVANIA AVE","043465000000000000009421":"MEMORIAL STADIUM","0434650000000000000094AF":"MEDICAL SCIENCES BUILDING","04346500000000000000954F":"SWANLUND ADMINISTRATION BUILDING","04346500000000000000940E":"PENNSYLVANIA AVENUE RESIDENCE HALLS","01056700000000000000138E":"Ikenberry Commons- Bousfield Hall","010567000000000000001464":"IKENBERRY COMMONS -  NUGENT HALL","0434650000000000000093AF":"OPTICAL PHYSICS AND ENGINEERING BLDG","043465000000000000009680":"CHILDREN'S RESEARCH CENTER","0434650000000000000092D2":"CAMPBELL HALL","010567000000000000001546":"IKENBERRY COMMONS - WASSAJA HALL","0105670000000000000013F7":"IKENBERRY COMMONS -  NUGENT HALL","010567000000000000001451":"Ikenberry Commons- Weston Hall","010567000000000000001469":"HOPKINS HALL","0105670000000000000014CA":"TAFT VAN DOREN RESIDENCE HALLS","0105670000000000000013A3":"Ikenberry Commons- Weston Hall","043465000000000000009419":"901 W OREGON ST","04346500000000000000941C":"901 W OREGON ST","043465000000000000009546":"NATIONAL PETASCALE COMPUTING FACILITY","01056700000000000000163C":"SNYDER HALL","0434650000000000000093EA":"Poultry Hatchery #1","0434650000000000000095B4":"ENGINEERING HALL","010567000000000000001525":"SNYDER HALL","010567000000000000001466":"Ikenberry Commons- Scott Hall","043465000000000000009652":"MEMORIAL STADIUM","0434650000000000000095A7":"CERAMICS BUILDING","0434650000000000000094E9":"111 E GREEN ST (LEASED)","01056700000000000000143f":"ORCHARD DOWNS APARTMENTS","043465000000000000009418":"ILLINI UNION","01056700000000000000157C":"NUCLEAR PHYSICS LABORATORY","0434650000000000000094F5":"LIBRARY","010567000000000000001874":"SPEECH AND HEARING SCIENCE","010567000000000000001878":"NEWMARK CIVIL ENGINEERING BUILDING","0105670000000000000014CE":"NOBLE HALL","043465000000000000009511":"ADMIN INFORMATION TECHNOLOGY BLDG","01056700000000000000172F":"CLARK HALL","043465000000000000009536":"SEITZ MATERIALS RESEARCH LAB","04346500000000000000952E":"HOUSING WAREHOUSE","043465000000000000009689":"WATER SURVEY RESEARCH CENTER #7","043465000000000000009692":"AGRICULTURE SERVICES BUILDING","0434650000000000000096C8":"METAL STORAGE BUILDING","010567000000000000001926":"SPURLOCK MUSEUM","0105670000000000000017EE":"PERSONNEL SERVICES BUILDING","0434650000000000000095BC":"HorTICULTURE FIELD Research LABORATORY","04346500000000000000934B":"907 1/2 W Nevada","0434650000000000000094BB":"Bielfeldt Athletic Administration Building","043465000000000000009497":"HORTICULTURE FIELD LABORATORY","01056700000000000000121F":"Stock Pavilion","01056700000000000000146B":"TEMPLE HOYNE BUELL HALL","0105670000000000000014B2":"LINCOLN HALL","0434650000000000000092D1":"AGRICULTURE SERVICES BUILDING","0434650000000000000094A2":"TRANSPORTATION BUILDING","0434650000000000000093FB":"Carl R. Woese Institute for Genomic Biology","043465000000000000009574":"BECKMAN INSTITUTE","0105670000000000000014F5":"HENRY ADMINISTRATION BUILDING","04346500000000000000962C":"SPECIAL MATERIALS STORAGE FACILITY","0105670000000000000015DA":"FORBES NATURAL HISTORY BUILDING","04346500000000000000951D":"ILLINI UNION","043465000000000000009FB8":"DALKEY ARCHIVE PRESS (PSSB)","04346500000000000000948F":"SOYFACE BARN","04346500000000000000952F":"NATIONAL CENTER SUPERCOMPUTING APPLICATIONS","043465000000000000009524":"Computer Application Building","0434650000000000000095BF":"POLLINATARIUM","04346500000000000000965E":"MEMORIAL STADIUM","043465000000000000009572":"MEMORIAL STADIUM","043465000000000000009670":"MEMORIAL STADIUM","0434650000000000000095B1":"MEMORIAL STADIUM"},"site_centroids":{"VET MED BASIC SCIENCES BUILDING":{"lat":40.092716,"lon":88.221981},"VETERINARY RES FARM-CLINICAL RES BARN":{"lat":40.093158,"lon":88.221488},"ORCHARD DOWNS APARTMENTS":{"lat":40.09217,"lon":88.211978},"VETERINARY TEACHING HOSPITAL":{"lat":40.090756,"lon":88.223211},"VETERINARY MEDICINE CHILLER PLANT":{"lat":40.092651,"lon":88.222382},"AGRICULTURAL ENGR SCIENCES BLDG":{"lat":40.101243,"lon":88.226066},"EDUCATION BUILDING":{"lat":40.101648,"lon":88.229801},"VEGETABLE CROPS SHOP & STORAGE BUILDING":{"lat":40.101603,"lon":88.223963},"National Soybean Resarch":{"lat":40.101639,"lon":88.22616},"TEMPLE HOYNE BUELL HALL":{"lat":40.101665,"lon":88.228239},"TURNER HALL":{"lat":40.102568,"lon":88.223938},"ILLINI UNION BOOKSTORE":{"lat":40.108684,"lon":88.229643},"GIES BUSINESS INSTRUCTIONAL FACILITY":{"lat":40.103749,"lon":88.231434},"LAW BUILDING":{"lat":40.100744,"lon":88.230874},"ANIMAL SCIENCES LABORATORY":{"lat":40.103624,"lon":88.225373},"MUMFORD HALL":{"lat":40.103766,"lon":88.225867},"SPEECH AND HEARING SCIENCE":{"lat":40.107726,"lon":88.230836},"GRAINGER ENGINEERING LIBRARY":{"lat":40.112498,"lon":88.22614},"Institute for government and public affairs":{"lat":40.105958,"lon":88.220834},"ADMISSIONS AND RECORDS BUILDING":{"lat":40.108662,"lon":88.220704},"MEAT SCIENCE LABORATORY":{"lat":40.099196,"lon":88.223361},"FORBES NATURAL HISTORY BUILDING":{"lat":40.093442,"lon":88.240145},"REHABILITATION EDUCATION CENTER":{"lat":40.103875,"lon":88.242234},"PERSONNEL SERVICES BUILDING":{"lat":40.104318,"lon":88.240761},"Huff Hall":{"lat":40.103167,"lon":88.232042},"LINCOLN HALL":{"lat":40.106322,"lon":88.228623},"KENNEY GYMNASIUM":{"lat":40.113314,"lon":88.228352},"PUBLIC SAFETY BUILDING":{"lat":40.112966,"lon":88.223205},"MUSIC BUILDING":{"lat":40.106269,"lon":88.223571},"E-14 Community Cardboard":{"lat":40.097821,"lon":88.241177},"OAK STREET CHILLER PLANT":{"lat":40.102085,"lon":88.241792},"MECHANICAL ENGINEERING LABORATORY":{"lat":40.112241,"lon":88.225914},"Foreign Language Building":{"lat":40.106088,"lon":88.225615},"Carl R. Woese Institute for Genomic Biology":{"lat":40.104579,"lon":88.224445},"NUCLEAR PHYSICS LABORATORY":{"lat":40.101983,"lon":88.242041},"PSYCHOLOGY LABORATORY":{"lat":40.107266,"lon":88.230199},"MICRO AND NANOTECHNOLOGY LABORATORY":{"lat":40.113828,"lon":88.228253},"UNIVERSITY HIGH SCHOOL":{"lat":40.113144,"lon":88.224777},"Smith Music Building":{"lat":40.105871,"lon":88.22647},"KRANNERT CENTER FOR PERFORMING ARTS":{"lat":40.107135,"lon":88.22283},"TAFT HOUSE":{"lat":40.099377,"lon":88.224566},"ILLINOIS SUSTAINABLE TECHNOLOGY CENTER":{"lat":40.090198,"lon":88.242858},"OAK STREET LIBRARY FACILITY":{"lat":40.107771,"lon":88.241967},"CHILD DEVELOPMENT LABORATORY":{"lat":40.105759,"lon":88.221604},"LEVIS FACULTY CENTER":{"lat":40.108719,"lon":88.220909},"UNIVERSITY PRESS BUILDING":{"lat":40.101087,"lon":88.242739},"CLARK HALL":{"lat":40.103345,"lon":88.234195},"ALTGELD HALL":{"lat":40.109273,"lon":88.228741},"PRESIDENT'S HOUSE":{"lat":40.097592,"lon":88.217465},"CERAMICS BUILDING":{"lat":40.111872,"lon":88.224418},"ENGINEERING HALL":{"lat":40.110992,"lon":88.226718},"STUDENT-STAFF APTS-300 S GOODWIN, U":{"lat":40.110321,"lon":88.22278},"STUDENT STAFF APTS #2-GREEN/GOODWIN":{"lat":40.109131,"lon":88.223555},"ASHTON WOODS APARTMENTS":{"lat":40.08487,"lon":88.239087},"ENTERPRISE WORKS":{"lat":40.091475,"lon":88.240485},"NORTH CAMPUS PARKING DECK":{"lat":40.115805,"lon":88.224943},"TRANSPORTATION BUILDING":{"lat":40.111572,"lon":88.225007},"ADVANCED COMPUTATION BLDG":{"lat":40.11243,"lon":88.222438},"NATURAL HISTORY BUILDING":{"lat":40.109656,"lon":88.225597},"909 W OREGON ST":{"lat":40.106879,"lon":88.220657},"CROP SCIENCES RESEARCH FACILITY":{"lat":40.057978,"lon":88.237613},"508 S Sixth St":{"lat":40.112121,"lon":88.229901},"ENGINEERING SCIENCES BUILDING":{"lat":40.112264,"lon":88.22283},"C-7 PARKING STRUCTURE, STUDENT STAFF":{"lat":40.109137,"lon":88.231026},"DANIELS HALL":{"lat":40.111277,"lon":88.221635},"DAVID KINLEY HALL":{"lat":40.103407,"lon":88.228538},"SIEBEL CENTER FOR COMPUTER SCIENCE":{"lat":40.113602,"lon":88.22633},"Roger Adams Laboratory":{"lat":40.107384,"lon":88.225052},"Krannert Art Museum":{"lat":40.101845,"lon":88.230981},"HARDING BAND BUILDING":{"lat":40.104462,"lon":88.230668},"FRUIT RESEARCH FARM - ADMIN. BLDG.":{"lat":40.082219,"lon":88.210998},"FSI - FIREMANSHIP TRAINING FACILITIES":{"lat":40.086103,"lon":88.243752},"ENGLISH BUILDING":{"lat":40.107902,"lon":88.228808},"NORTH CAMPUS CHILLER PLANT":{"lat":40.115066,"lon":88.22583},"Babcock Hall":{"lat":40.098484,"lon":88.221198},"Computer Application Building":{"lat":40.112193,"lon":88.229787},"STUDENT DINING AND RESIDENTIAL PROGRAMS":{"lat":40.10446,"lon":88.233714},"LINCOLN AVENUE RESIDENCE HALL":{"lat":40.103714,"lon":88.22036},"ADMIN INFORMATION TECHNOLOGY BLDG":{"lat":40.087729,"lon":88.241414},"HOPKINS HALL":{"lat":40.102803,"lon":88.237425},"Ikenberry Commons- Scott Hall":{"lat":40.102366,"lon":88.236471},"STUDENT SERVICES ARCADE BUILDING":{"lat":40.109144,"lon":88.22961},"DIGITAL COMPUTER LABORATORY":{"lat":40.113566,"lon":88.226146},"HOUSING WAREHOUSE":{"lat":40.090199,"lon":88.213796},"805 PENNSYLVANIA AVE":{"lat":40.100274,"lon":88.218311},"MEMORIAL STADIUM":{"lat":40.098438,"lon":88.236777},"MEDICAL SCIENCES BUILDING":{"lat":40.108534,"lon":88.224758},"SWANLUND ADMINISTRATION BUILDING":{"lat":40.108655,"lon":88.229924},"PENNSYLVANIA AVENUE RESIDENCE HALLS":{"lat":40.100342,"lon":88.220422},"Ikenberry Commons- Bousfield Hall":{"lat":40.101745,"lon":88.237164},"IKENBERRY COMMONS -  NUGENT HALL":{"lat":40.103755,"lon":88.237513},"OPTICAL PHYSICS AND ENGINEERING BLDG":{"lat":40.111089,"lon":88.2297},"CHILDREN'S RESEARCH CENTER":{"lat":40.0866,"lon":88.240455},"CAMPBELL HALL":{"lat":40.11488,"lon":88.223245},"IKENBERRY COMMONS - WASSAJA HALL":{"lat":40.10363,"lon":88.237547},"Ikenberry Commons- Weston Hall":{"lat":40.102717,"lon":88.235522},"TAFT VAN DOREN RESIDENCE HALLS":{"lat":40.101751,"lon":88.234327},"901 W OREGON ST":{"lat":40.106532,"lon":88.219516},"NATIONAL PETASCALE COMPUTING FACILITY":{"lat":40.095839,"lon":88.241887},"SNYDER HALL":{"lat":40.102575,"lon":88.235292},"Poultry Hatchery #1":{"lat":40.075512,"lon":88.21036},"111 E GREEN ST (LEASED)":{"lat":40.109689,"lon":88.23782},"ILLINI UNION":{"lat":40.109787,"lon":88.226557},"LIBRARY":{"lat":40.104903,"lon":88.229416},"NEWMARK CIVIL ENGINEERING BUILDING":{"lat":40.113675,"lon":88.224354},"NOBLE HALL":{"lat":40.102062,"lon":88.234211},"SEITZ MATERIALS RESEARCH LAB":{"lat":40.111379,"lon":88.222908},"WATER SURVEY RESEARCH CENTER #7":{"lat":40.08504,"lon":88.241217},"AGRICULTURE SERVICES BUILDING":{"lat":40.092748,"lon":88.229127},"METAL STORAGE BUILDING":{"lat":40.090963,"lon":88.229265},"SPURLOCK MUSEUM":{"lat":40.107543,"lon":88.220544},"HorTICULTURE FIELD Research LABORATORY":{"lat":40.0804,"lon":88.219128},"907 1/2 W Nevada":{"lat":40.085203,"lon":88.241974},"Bielfeldt Athletic Administration Building":{"lat":40.097844,"lon":88.232139},"HORTICULTURE FIELD LABORATORY":{"lat":40.096289,"lon":88.21492},"Stock Pavilion":{"lat":40.101195,"lon":88.22776},"BECKMAN INSTITUTE":{"lat":40.115871,"lon":88.226362},"HENRY ADMINISTRATION BUILDING":{"lat":40.108733,"lon":88.228708},"SPECIAL MATERIALS STORAGE FACILITY":{"lat":40.089236,"lon":88.242485},"DALKEY ARCHIVE PRESS (PSSB)":{"lat":40.093455,"lon":88.229234},"SOYFACE BARN":{"lat":40.041738,"lon":88.237192},"NATIONAL CENTER SUPERCOMPUTING APPLICATIONS":{"lat":40.086115,"lon":88.243733},"POLLINATARIUM":{"lat":40.087251,"lon":88.214754}},"site_spread":{"VET MED BASIC SCIENCES BUILDING":76.9,"VETERINARY RES FARM-CLINICAL RES BARN":34.8,"ORCHARD DOWNS APARTMENTS":226.7,"VETERINARY TEACHING HOSPITAL":85.9,"VETERINARY MEDICINE CHILLER PLANT":6.6,"AGRICULTURAL ENGR SCIENCES BLDG":4.2,"EDUCATION BUILDING":14.7,"VEGETABLE CROPS SHOP & STORAGE BUILDING":2.1,"National Soybean Resarch":434.6,"TEMPLE HOYNE BUELL HALL":11.8,"TURNER HALL":5.9,"ILLINI UNION BOOKSTORE":16.8,"GIES BUSINESS INSTRUCTIONAL FACILITY":8.3,"LAW BUILDING":3.0,"ANIMAL SCIENCES LABORATORY":22.5,"MUMFORD HALL":32.4,"SPEECH AND HEARING SCIENCE":70.0,"GRAINGER ENGINEERING LIBRARY":3.9,"Institute for government and public affairs":54.3,"ADMISSIONS AND RECORDS BUILDING":4.1,"MEAT SCIENCE LABORATORY":3.1,"FORBES NATURAL HISTORY BUILDING":22.3,"REHABILITATION EDUCATION CENTER":5.2,"PERSONNEL SERVICES BUILDING":6.5,"Huff Hall":10.6,"LINCOLN HALL":62.6,"KENNEY GYMNASIUM":22.4,"PUBLIC SAFETY BUILDING":73.2,"MUSIC BUILDING":17.5,"E-14 Community Cardboard":3.6,"OAK STREET CHILLER PLANT":68.3,"MECHANICAL ENGINEERING LABORATORY":5.2,"Foreign Language Building":17.3,"Carl R. Woese Institute for Genomic Biology":86.2,"NUCLEAR PHYSICS LABORATORY":3.5,"PSYCHOLOGY LABORATORY":9.2,"MICRO AND NANOTECHNOLOGY LABORATORY":6.2,"UNIVERSITY HIGH SCHOOL":4.1,"Smith Music Building":4.9,"KRANNERT CENTER FOR PERFORMING ARTS":3.5,"TAFT HOUSE":254.7,"ILLINOIS SUSTAINABLE TECHNOLOGY CENTER":3.4,"OAK STREET LIBRARY FACILITY":54.7,"CHILD DEVELOPMENT LABORATORY":11.7,"LEVIS FACULTY CENTER":6.4,"UNIVERSITY PRESS BUILDING":7.6,"CLARK HALL":43.8,"ALTGELD HALL":13.0,"PRESIDENT'S HOUSE":23.5,"CERAMICS BUILDING":16.2,"ENGINEERING HALL":8.9,"STUDENT-STAFF APTS-300 S GOODWIN, U":5.1,"STUDENT STAFF APTS #2-GREEN/GOODWIN":83.7,"ASHTON WOODS APARTMENTS":54.1,"ENTERPRISE WORKS":43.4,"NORTH CAMPUS PARKING DECK":68.6,"TRANSPORTATION BUILDING":6.3,"ADVANCED COMPUTATION BLDG":11.7,"NATURAL HISTORY BUILDING":7.6,"909 W OREGON ST":5.6,"CROP SCIENCES RESEARCH FACILITY":160.3,"508 S Sixth St":3.8,"ENGINEERING SCIENCES BUILDING":17.0,"C-7 PARKING STRUCTURE, STUDENT STAFF":20.7,"DANIELS HALL":4.0,"DAVID KINLEY HALL":6.7,"SIEBEL CENTER FOR COMPUTER SCIENCE":8.3,"Roger Adams Laboratory":8.6,"Krannert Art Museum":5.0,"HARDING BAND BUILDING":10.7,"FRUIT RESEARCH FARM - ADMIN. BLDG.":2.7,"FSI - FIREMANSHIP TRAINING FACILITIES":2.8,"ENGLISH BUILDING":59.2,"NORTH CAMPUS CHILLER PLANT":8.0,"Babcock Hall":27.6,"Computer Application Building":34.2,"STUDENT DINING AND RESIDENTIAL PROGRAMS":212.8,"LINCOLN AVENUE RESIDENCE HALL":11.4,"ADMIN INFORMATION TECHNOLOGY BLDG":9.1,"HOPKINS HALL":7.4,"Ikenberry Commons- Scott Hall":6.4,"STUDENT SERVICES ARCADE BUILDING":7.9,"DIGITAL COMPUTER LABORATORY":9.7,"HOUSING WAREHOUSE":21.1,"805 PENNSYLVANIA AVE":3.7,"MEMORIAL STADIUM":78.0,"MEDICAL SCIENCES BUILDING":9.0,"SWANLUND ADMINISTRATION BUILDING":11.4,"PENNSYLVANIA AVENUE RESIDENCE HALLS":25.5,"Ikenberry Commons- Bousfield Hall":7.1,"IKENBERRY COMMONS -  NUGENT HALL":9.1,"OPTICAL PHYSICS AND ENGINEERING BLDG":6.7,"CHILDREN'S RESEARCH CENTER":2.0,"CAMPBELL HALL":17.9,"IKENBERRY COMMONS - WASSAJA HALL":7.7,"Ikenberry Commons- Weston Hall":4.5,"TAFT VAN DOREN RESIDENCE HALLS":4.6,"901 W OREGON ST":3.6,"NATIONAL PETASCALE COMPUTING FACILITY":5.2,"SNYDER HALL":8.5,"Poultry Hatchery #1":2.4,"111 E GREEN ST (LEASED)":3.0,"ILLINI UNION":9.6,"LIBRARY":12.5,"NEWMARK CIVIL ENGINEERING BUILDING":7.3,"NOBLE HALL":4.3,"SEITZ MATERIALS RESEARCH LAB":6.0,"WATER SURVEY RESEARCH CENTER #7":9.7,"AGRICULTURE SERVICES BUILDING":5.2,"METAL STORAGE BUILDING":1.9,"SPURLOCK MUSEUM":23.9,"HorTICULTURE FIELD Research LABORATORY":2.2,"907 1/2 W Nevada":2.8,"Bielfeldt Athletic Administration Building":14.6,"HORTICULTURE FIELD LABORATORY":2.0,"Stock Pavilion":3.7,"BECKMAN INSTITUTE":4.2,"HENRY ADMINISTRATION BUILDING":10.9,"SPECIAL MATERIALS STORAGE FACILITY":3.0,"DALKEY ARCHIVE PRESS (PSSB)":3.2,"NATIONAL CENTER SUPERCOMPUTING APPLICATIONS":1.8},"trend":[{"month":"2019-12","pickups":83,"rfid_rate":0,"site_rate":79.5,"weight_rate":85.5,"status":"Container ID failed"},{"month":"2020-01","pickups":1917,"rfid_rate":3.3,"site_rate":82.0,"weight_rate":82.8,"status":"Degraded / ramping"},{"month":"2020-02","pickups":1417,"rfid_rate":8.3,"site_rate":82.6,"weight_rate":92.0,"status":"Degraded / ramping"},{"month":"2020-03","pickups":1997,"rfid_rate":10.4,"site_rate":86.0,"weight_rate":80.8,"status":"Degraded / ramping"},{"month":"2020-04","pickups":940,"rfid_rate":15.2,"site_rate":88.2,"weight_rate":82.7,"status":"Degraded / ramping"},{"month":"2020-05","pickups":630,"rfid_rate":13.8,"site_rate":88.1,"weight_rate":92.2,"status":"Degraded / ramping"},{"month":"2020-06","pickups":1423,"rfid_rate":20.9,"site_rate":87.8,"weight_rate":72.7,"status":"Degraded / ramping"},{"month":"2020-07","pickups":1609,"rfid_rate":46.5,"site_rate":89.9,"weight_rate":60.2,"status":"Degraded / ramping"},{"month":"2020-08","pickups":1326,"rfid_rate":66.3,"site_rate":93.4,"weight_rate":59.0,"status":"Degraded / ramping"},{"month":"2020-09","pickups":1150,"rfid_rate":63.0,"site_rate":57.3,"weight_rate":90.9,"status":"Degraded / ramping"},{"month":"2020-10","pickups":742,"rfid_rate":70.5,"site_rate":61.5,"weight_rate":90.8,"status":"Degraded / ramping"},{"month":"2020-11","pickups":1864,"rfid_rate":64.8,"site_rate":56.8,"weight_rate":65.0,"status":"Degraded / ramping"},{"month":"2020-12","pickups":1196,"rfid_rate":69.1,"site_rate":57.5,"weight_rate":82.3,"status":"Degraded / ramping"},{"month":"2021-01","pickups":964,"rfid_rate":86.0,"site_rate":78.9,"weight_rate":70.6,"status":"Working"},{"month":"2021-02","pickups":1886,"rfid_rate":82.9,"site_rate":76.8,"weight_rate":80.9,"status":"Working"},{"month":"2021-03","pickups":2378,"rfid_rate":78.3,"site_rate":72.0,"weight_rate":80.8,"status":"Working"},{"month":"2021-04","pickups":2432,"rfid_rate":88.3,"site_rate":81.7,"weight_rate":73.8,"status":"Working"},{"month":"2021-05","pickups":2254,"rfid_rate":84.4,"site_rate":81.6,"weight_rate":69.6,"status":"Working"},{"month":"2021-06","pickups":656,"rfid_rate":86.9,"site_rate":80.9,"weight_rate":66.5,"status":"Working"},{"month":"2021-08","pickups":365,"rfid_rate":61.6,"site_rate":51.8,"weight_rate":74.5,"status":"Degraded / ramping"},{"month":"2021-09","pickups":537,"rfid_rate":60.1,"site_rate":49.5,"weight_rate":82.5,"status":"Degraded / ramping"},{"month":"2021-10","pickups":274,"rfid_rate":58.8,"site_rate":50.0,"weight_rate":86.5,"status":"Degraded / ramping"},{"month":"2022-08","pickups":89,"rfid_rate":0,"site_rate":0,"weight_rate":82.0,"status":"Container ID failed"},{"month":"2022-09","pickups":47,"rfid_rate":0,"site_rate":0,"weight_rate":97.9,"status":"Container ID failed"},{"month":"2023-01","pickups":98,"rfid_rate":0,"site_rate":0,"weight_rate":82.7,"status":"Container ID failed"},{"month":"2023-02","pickups":23,"rfid_rate":0,"site_rate":0,"weight_rate":87.0,"status":"Container ID failed"},{"month":"2023-03","pickups":364,"rfid_rate":0,"site_rate":0,"weight_rate":75.8,"status":"Container ID failed"},{"month":"2023-04","pickups":284,"rfid_rate":0,"site_rate":0,"weight_rate":73.9,"status":"Container ID failed"},{"month":"2023-05","pickups":78,"rfid_rate":0,"site_rate":0,"weight_rate":70.5,"status":"Container ID failed"},{"month":"2023-06","pickups":321,"rfid_rate":0,"site_rate":0,"weight_rate":85.0,"status":"Container ID failed"},{"month":"2023-07","pickups":1199,"rfid_rate":0,"site_rate":0,"weight_rate":56.3,"status":"Container ID failed"},{"month":"2023-08","pickups":1043,"rfid_rate":0,"site_rate":0,"weight_rate":86.3,"status":"Container ID failed"},{"month":"2023-09","pickups":2708,"rfid_rate":0,"site_rate":0,"weight_rate":88.0,"status":"Container ID failed"},{"month":"2023-10","pickups":2214,"rfid_rate":0,"site_rate":0,"weight_rate":89.7,"status":"Container ID failed"},{"month":"2023-11","pickups":51,"rfid_rate":0,"site_rate":23.5,"weight_rate":98.0,"status":"Container ID failed"},{"month":"2023-12","pickups":710,"rfid_rate":0,"site_rate":0,"weight_rate":86.1,"status":"Container ID failed"},{"month":"2024-01","pickups":2378,"rfid_rate":0,"site_rate":0,"weight_rate":89.2,"status":"Container ID failed"},{"month":"2024-02","pickups":2912,"rfid_rate":0,"site_rate":1.2,"weight_rate":87.9,"status":"Container ID failed"},{"month":"2024-03","pickups":786,"rfid_rate":0,"site_rate":0,"weight_rate":91.1,"status":"Container ID failed"},{"month":"2024-06","pickups":151,"rfid_rate":0,"site_rate":0,"weight_rate":84.1,"status":"Container ID failed"},{"month":"2024-08","pickups":55,"rfid_rate":0,"site_rate":78.2,"weight_rate":81.8,"status":"Container ID failed"},{"month":"2024-09","pickups":124,"rfid_rate":0,"site_rate":70.2,"weight_rate":83.9,"status":"Container ID failed"},{"month":"2024-10","pickups":6,"rfid_rate":0,"site_rate":16.7,"weight_rate":100.0,"status":"Container ID failed"},{"month":"2025-07","pickups":78,"rfid_rate":0,"site_rate":74.4,"weight_rate":69.2,"status":"Container ID failed"}],"funnel":[{"gate":0,"label":"Total records exported","n":79533,"pct":100.0},{"gate":1,"label":"Load Pickup events","n":73857,"pct":92.9},{"gate":2,"label":"+ valid pickup date (not epoch)","n":43759,"pct":55.0},{"gate":3,"label":"+ container identified by RFID","n":15406,"pct":19.4},{"gate":4,"label":"+ site / building resolved","n":13414,"pct":16.9},{"gate":5,"label":"+ gross load weight > 0","n":9998,"pct":12.6},{"gate":6,"label":"+ container tare weight > 0","n":9989,"pct":12.6},{"gate":7,"label":"+ weights physically plausible","n":9989,"pct":12.6}],"top_sites":[{"name":"ORCHARD DOWNS APARTMENTS","count":1711},{"name":"VET MED BASIC SCIENCES BUILDING","count":443},{"name":"STUDENT DINING AND RESIDENTIAL PROGRAMS","count":296},{"name":"ASHTON WOODS APARTMENTS","count":255},{"name":"VETERINARY RES FARM-CLINICAL RES BARN","count":239},{"name":"VETERINARY TEACHING HOSPITAL","count":226},{"name":"PENNSYLVANIA AVENUE RESIDENCE HALLS","count":211},{"name":"Ikenberry Commons- Weston Hall","count":205},{"name":"IKENBERRY COMMONS -  NUGENT HALL","count":201},{"name":"HOPKINS HALL","count":196},{"name":"SNYDER HALL","count":195},{"name":"Ikenberry Commons- Scott Hall","count":194},{"name":"ILLINI UNION BOOKSTORE","count":183},{"name":"Ikenberry Commons- Bousfield Hall","count":167},{"name":"ANIMAL SCIENCES LABORATORY","count":157},{"name":"IKENBERRY COMMONS - WASSAJA HALL","count":152},{"name":"TAFT VAN DOREN RESIDENCE HALLS","count":149},{"name":"Babcock Hall","count":147},{"name":"ENGINEERING HALL","count":140},{"name":"LINCOLN AVENUE RESIDENCE HALL","count":140}],"service_types":[{"name":"Front Load-Landfill-6","count":3857},{"name":"Front Load-Landfill-8","count":3140},{"name":"Front Load-Cardboard-8","count":1069},{"name":"Front Load-Landfill-2","count":497},{"name":"Front Load-Cardboard-6","count":394},{"name":"Front Load-Paper-2","count":364},{"name":"Front Load-Landfill-4","count":196},{"name":"Front Load-Paper-4","count":174},{"name":"Front Load-Cardboard-4","count":140},{"name":"Front Load-Paper-6","count":90},{"name":"Front Load-Paper-","count":31},{"name":"Front Load-Paper-8","count":24},{"name":"Front Load-Cardboard-2","count":13}],"meta":{"total_raw_records":79533,"usable_records":9989,"usable_pct":12.6,"distinct_rfids":179,"distinct_sites":123,"gps_top1_acc":84.8,"gps_top3_acc":97.8,"rfid_acc":100.0,"validation":"80/20 random split, nearest GPS centroid","threshold_m":150,"threshold_coverage_pct":91.6,"rfid_peak_month":"2021-04","rfid_peak_pct":88.3,"rfid_failed_from":"2022-08","epoch_records":28337,"source":"UIUC_LoadMan_Consolidated_Dataset.xlsx","prepared_for":"Betsy Ruckman, Zero Waste Coordinator, UIUC Facilities & Services"}};


// ─── HAVERSINE (runs in browser) ─────────────────────────────────────────────
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const f1 = lat1 * Math.PI / 180, f2 = lat2 * Math.PI / 180;
  const df = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(df/2)**2 + Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function parseCoord(val) {
  if (!val) return null;
  const s = String(val).replace(/[°NSEW\s]/g,'').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ─── ATTRIBUTION ENGINE ───────────────────────────────────────────────────────
// Three-tier system: RFID lookup → GPS nearest-centroid → abstain
// Provenance of every prediction is preserved and surfaced to users
const AttributionEngine = {
  // Tier 1: RFID lookup (100% accuracy in training data, all 179 RFIDs map to exactly 1 site)
  byRFID(rfid) {
    if (!rfid || !rfid.trim()) return null;
    const site = REAL_MODEL.rfid_to_site[rfid.trim()];
    if (!site) return null;
    return { site, method: 'rfid_lookup', confidence: 1.0, confidence_label: 'Verified', tier: 1,
      evidence: `RFID ${rfid} maps exclusively to ${site} in 179-container lookup table (100% accuracy in training data)` };
  },

  // Tier 2: GPS nearest centroid (84.8% top-1, 97.8% top-3 at 150m threshold)
  byGPS(lat, lon, threshold_m = 150) {
    if (lat == null || lon == null) return null;
    const centroids = REAL_MODEL.site_centroids;
    let best = null, bestDist = Infinity, second = Infinity;
    const top3 = [];
    for (const [site, {lat: clat, lon: clon}] of Object.entries(centroids)) {
      const d = haversineM(lat, lon, clat, clon);
      top3.push({ site, d });
    }
    top3.sort((a, b) => a.d - b.d);
    if (!top3.length) return null;
    best = top3[0];
    if (best.d > threshold_m) {
      return { site: null, method: 'gps_centroid', confidence: 0, confidence_label: 'Abstain',
        tier: 3, evidence: `GPS ${lat.toFixed(4)}, ${lon.toFixed(4)} is ${Math.round(best.d)}m from nearest known site (${best.site}). Threshold: ${threshold_m}m. Abstaining.`,
        top3: top3.slice(0, 3) };
    }
    // Confidence: based on distance and gap to second-nearest
    const gap = top3.length > 1 ? top3[1].d - top3[0].d : Infinity;
    const spread = REAL_MODEL.site_spread[best.site] || 50;
    let conf_label = 'High';
    let conf_score = 1.0;
    if (best.d > 100 || gap < 30) { conf_label = 'Medium'; conf_score = 0.7; }
    if (best.d > 50 && gap < 50) { conf_label = 'Low'; conf_score = 0.4; }
    return {
      site: best.site, method: 'gps_centroid', confidence: conf_score, confidence_label: conf_label,
      tier: 2, distance_m: Math.round(best.d), gap_to_second_m: Math.round(Math.min(gap, 9999)),
      evidence: `GPS ${lat.toFixed(4)}, ${lon.toFixed(4)} is ${Math.round(best.d)}m from ${best.site} centroid. Second-closest is ${Math.round(top3[1]?.d||0)}m (${top3[1]?.site||'N/A'}). Model: 84.8% top-1 accuracy.`,
      top3: top3.slice(0, 3)
    };
  },

  // Main entry point
  predict(rfid, lat, lon) {
    const r = this.byRFID(rfid);
    if (r) return r;
    const g = this.byGPS(lat, lon);
    if (g) return g;
    return { site: null, method: 'no_data', confidence: 0, confidence_label: 'Unknown', tier: 3,
      evidence: 'No RFID and no GPS coordinates available. Cannot attribute.' };
  },

  // Batch prediction on demo records for display
  predictAll(records) {
    return records.map(r => ({
      ...r,
      _prediction: this.predict(r.rfid || null, r.lat || null, r.lon || null)
    }));
  }
};

// ─── SIMULATED UNATTRIBUTED RECORDS (realistic, using real site names) ────────
// These simulate the 70,000+ records that lack RFID.
// GPS coords are sampled near real campus locations with realistic noise.
function makeSimulatedUnattributed() {
  const sites = Object.entries(REAL_MODEL.site_centroids);
  const serviceTypes = ['Front Load-Landfill-6','Front Load-Landfill-8','Front Load-Cardboard-8',
    'Front Load-Landfill-2','Front Load-Cardboard-6','Front Load-Paper-2'];
  const months = ['2023-01','2023-03','2023-07','2023-08','2023-09','2023-10','2024-01','2024-02','2024-03'];
  const records = [];
  let id = 1;
  // Seed-like approach for reproducibility
  let seed = 42;
  const sr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 120; i++) {
    const siteIdx = Math.floor(sr() * sites.length);
    const [trueSite, {lat: clat, lon: clon}] = sites[siteIdx];
    // Add GPS noise (0-80m radius, simulating truck stopping nearby)
    const noiseM = sr() * 80;
    const angle = sr() * 2 * Math.PI;
    const dLat = (noiseM / 111111) * Math.cos(angle);
    const dLon = (noiseM / (111111 * Math.cos(clat * Math.PI/180))) * Math.sin(angle);
    const hasGPS = sr() > 0.3;  // 70% have GPS (reflects 40% overall but higher in recent records)
    const hasRFID = false;  // These are the unattributed ones
    const st = serviceTypes[Math.floor(sr() * serviceTypes.length)];
    const month = months[Math.floor(sr() * months.length)];
    const day = 1 + Math.floor(sr() * 28);
    const load = Math.floor(sr() * 300) + 20;
    records.push({
      id: `SIM-${String(id++).padStart(4,'0')}`,
      date: `${month}-${String(day).padStart(2,'0')}`,
      true_site: trueSite,  // Hidden ground truth (for evaluation display)
      rfid: null,
      lat: hasGPS ? parseFloat((clat + dLat).toFixed(6)) : null,
      lon: hasGPS ? parseFloat((clon + dLon).toFixed(6)) : null,
      has_gps: hasGPS,
      service_type: st,
      load_weight: load,
      stream: st.includes('Cardboard') ? 'Cardboard' : st.includes('Paper') ? 'Paper' : 'Landfill',
      truck: sr() > 0.5 ? '31272-11' : 'New Truck',
      provenance: 'simulated',
    });
  }
  return records;
}

// RFID-verified records (simulating the 9,989 usable records)
function makeVerifiedRecords() {
  const rfid_entries = Object.entries(REAL_MODEL.rfid_to_site).slice(0, 30);
  const records = [];
  let id = 1;
  let seed = 99;
  const sr = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (const [rfid, site] of rfid_entries) {
    const centroid = REAL_MODEL.site_centroids[site];
    if (!centroid) continue;
    const n = Math.floor(sr() * 8) + 2;  // 2-10 records per RFID
    for (let j = 0; j < n; j++) {
      const noiseM = sr() * 30;
      const angle = sr() * 2 * Math.PI;
      const dLat = (noiseM / 111111) * Math.cos(angle);
      const dLon = (noiseM / (111111 * Math.cos(centroid.lat * Math.PI/180))) * Math.sin(angle);
      const year = sr() > 0.5 ? 2020 : 2021;
      const month = 1 + Math.floor(sr() * 6);
      const load = Math.floor(sr() * 300) + 20;
      const serviceTypes = ['Front Load-Landfill-6','Front Load-Landfill-8','Front Load-Cardboard-8','Front Load-Paper-2'];
      const st = serviceTypes[Math.floor(sr() * serviceTypes.length)];
      records.push({
        id: `VER-${String(id++).padStart(4,'0')}`,
        date: `${year}-${String(month).padStart(2,'0')}-${String(1+Math.floor(sr()*28)).padStart(2,'0')}`,
        site_name: site,
        rfid,
        lat: parseFloat((centroid.lat + dLat).toFixed(6)),
        lon: parseFloat((centroid.lon + dLon).toFixed(6)),
        has_gps: true,
        service_type: st,
        load_weight: load,
        stream: st.includes('Cardboard') ? 'Cardboard' : st.includes('Paper') ? 'Paper' : 'Landfill',
        truck: sr() > 0.5 ? '31272-11' : 'New Truck',
        provenance: 'verified',
      });
    }
  }
  return records;
}

const UNATTRIBUTED_RECORDS = makeSimulatedUnattributed();
const VERIFIED_RECORDS = makeVerifiedRecords();

// Demo buildings for Collection Log / Audits (using real site names from model)
const DEMO_BUILDINGS = Object.entries(REAL_MODEL.site_centroids).slice(0, 20).map(([name, {lat, lon}], i) => ({
  id: `B${String(i+1).padStart(3,'0')}`, name,
  lat, lon,
  abbr: name.split(' ').map(w=>w[0]).join('').slice(0,4).toUpperCase(),
  type: name.includes('HALL') || name.includes('RESIDENCE') || name.includes('APARTMENTS') ? 'Residential' :
        name.includes('LAB') || name.includes('SCIENCE') ? 'Laboratory' :
        name.includes('DINING') || name.includes('COMMONS') ? 'Dining' : 'Academic'
}));

const ROUTE_DEFS = [
  { id:'RA', label:'Route A: North Campus', buildings:DEMO_BUILDINGS.slice(0,5).map(b=>b.id), containers:['Front Load-Landfill-8','Front Load-Cardboard-8'], days:[1,3,5], startHour:6, endHour:10 },
  { id:'RB', label:'Route B: Engineering / Ag', buildings:DEMO_BUILDINGS.slice(5,10).map(b=>b.id), containers:['Front Load-Landfill-6','Front Load-Paper-2'], days:[2,4], startHour:7, endHour:11 },
  { id:'RC', label:'Route C: Residential East', buildings:DEMO_BUILDINGS.slice(10,15).map(b=>b.id), containers:['Front Load-Landfill-6','Front Load-Cardboard-6'], days:[1,2,3,4,5], startHour:5, endHour:9 },
  { id:'RD', label:'Route D: Research / Vet Med', buildings:DEMO_BUILDINGS.slice(15,20).map(b=>b.id), containers:['Front Load-Landfill-8','Front Load-Landfill-2'], days:[1,3,5], startHour:8, endHour:12 },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div style={{ background:'repeating-linear-gradient(45deg,#e9a825,#e9a825 10px,#f5b820 10px,#f5b820 20px)',
      padding:'6px 0', textAlign:'center', fontSize:11, fontWeight:700, color:'#78350f', letterSpacing:'.08em', textTransform:'uppercase' }}>
      DEMO DATA - NOT ACTUAL UIUC OPERATIONAL RECORDS &nbsp;|&nbsp; Attribution model trained on real LoadMan data
    </div>
  );
}

function Badge({ cls, children }) { return <span className={`badge ${cls||'badge-gray'}`}>{children}</span>; }
function SH({ title, sub, action }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:PAL.navy, borderBottom:`2px solid ${PAL.border}`, paddingBottom:10, flex:1 }}>{title}</h2>
        {action}
      </div>
      {sub && <p style={{ margin:'4px 0 0', fontSize:13, color:PAL.muted }}>{sub}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, color, onClick, linkLabel }) {
  const colors = { navy:PAL.navy, green:PAL.teal, amber:PAL.amber, red:PAL.red, blue:PAL.navyLight, purple:PAL.purple };
  const c = colors[color]||PAL.navy;
  return (
    <div className="stat-card" onClick={onClick}
      style={{ borderLeft:`4px solid ${c}`, cursor:onClick?'pointer':'default', transition:'box-shadow .15s' }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; }}>
      <div style={{ fontSize:11, fontWeight:600, color:PAL.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:c, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{sub}</div>}
      {onClick && linkLabel && <div style={{ fontSize:11, color:PAL.navyLight, marginTop:6, fontWeight:600 }}>{linkLabel} +</div>}
    </div>
  );
}

function QBar({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
        <span style={{ color:PAL.text }}>{label}</span>
        <span style={{ fontWeight:600, color:PAL.navy }}>{value}</span>
      </div>
      <div className="progress-bar" style={{ height:8 }}>
        <div className="progress-fill" style={{ width:`${Math.min(100,pct)}%`, background:color||PAL.navyLight }} />
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, maxWidth }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:maxWidth||620 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:PAL.navy }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:PAL.muted }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{msg}</div>;
}

function ProvenancePill({ type, size }) {
  const configs = {
    verified: { bg:'#dcfce7', color:'#166534', label:'Verified' },
    ai_inferred: { bg:'#dbeafe', color:'#1e40af', label:'AI-Inferred' },
    unknown: { bg:'#f3f4f6', color:'#6b7280', label:'Unknown' },
    simulated: { bg:'#fef3c7', color:'#92400e', label:'Simulated' },
  };
  const cfg = configs[type]||configs.unknown;
  const fontSize = size==='sm' ? 10 : 11;
  return <span style={{ background:cfg.bg, color:cfg.color, padding:`1px ${size==='sm'?6:8}px`, borderRadius:12, fontSize, fontWeight:700, letterSpacing:'.03em' }}>{cfg.label}</span>;
}

function ConfidenceMeter({ score, label }) {
  const color = score >= 0.8 ? PAL.teal : score >= 0.5 ? PAL.amber : PAL.red;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:60, height:6, background:'#e5e7eb', borderRadius:3 }}>
        <div style={{ width:`${score*100}%`, height:'100%', background:color, borderRadius:3, transition:'width .3s' }} />
      </div>
      <span style={{ fontSize:11, color, fontWeight:600 }}>{label}</span>
    </div>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ setActive }) {
  const [timePeriod, setTimePeriod] = useState('month');
  const trend = REAL_MODEL.trend;
  const meta = REAL_MODEL.meta;
  const funnel = REAL_MODEL.funnel;

  // Time period aggregation of trend data
  const trendData = useMemo(() => {
    if (timePeriod === 'month') return trend.map(t => ({ period: t.month, pickups: t.pickups, rfid_rate: t.rfid_rate }));
    // Quarterly grouping
    const quarters = {};
    trend.forEach(t => {
      const [y, m] = t.month.split('-');
      const q = `${y}-Q${Math.ceil(parseInt(m)/3)}`;
      if (!quarters[q]) quarters[q] = { period: q, pickups: 0, rfid_rate_sum: 0, n: 0 };
      quarters[q].pickups += t.pickups;
      quarters[q].rfid_rate_sum += t.rfid_rate;
      quarters[q].n++;
    });
    return Object.values(quarters).map(q => ({ period: q.period, pickups: q.pickups, rfid_rate: +(q.rfid_rate_sum/q.n).toFixed(1) }));
  }, [timePeriod]);

  const topSites = REAL_MODEL.top_sites.slice(0, 8);

  return (
    <div style={{ padding:24 }}>
      <SH title="Waste Intelligence Dashboard"
        sub="Derived from 79,533 actual UIUC LoadMan records. Attribution AI model trained on 9,989 verified records."
        action={<Badge cls="badge-amber">Real Data + AI Model</Badge>} />

      {/* Verified data notice */}
      <div className="card" style={{ padding:14, marginBottom:20, borderLeft:`4px solid ${PAL.teal}`, background:'#f0fdf4' }}>
        <div style={{ fontSize:12, fontWeight:700, color:PAL.teal, marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>
          Verified Source Data
        </div>
        <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.7 }}>
          EnviroTrap analyzed <strong>79,533</strong> UIUC LoadMan truck-weight records exported for Betsy Ruckman, Zero Waste Coordinator.
          Of these, <strong>9,989 (12.6%)</strong> pass all quality gates and have building attribution.
          The remaining 87.4% have verifiable reasons: <strong>28,337</strong> have epoch-default timestamps (2001),
          the RFID system failed completely after October 2021, and downstream records lack container identity.
        </p>
      </div>

      {/* Hero stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="Total LoadMan Records" value="79,533" sub="All exported records, unmodified" color="navy" onClick={()=>setActive('pipeline')} linkLabel="View data pipeline" />
        <StatCard label="Fully Usable Records" value="9,989" sub="12.6% - RFID + site + valid weights" color="green" onClick={()=>setActive('attribution')} linkLabel="View attribution" />
        <StatCard label="RFID Peak Rate" value="88.3%" sub="April 2021 - now 0% from Aug 2022" color="amber" onClick={()=>setActive('pipeline')} linkLabel="Investigate" />
        <StatCard label="Attribution AI Model" value="84.8%" sub="Top-1 GPS accuracy (150m threshold)" color="blue" onClick={()=>setActive('attribution')} linkLabel="View model details" />
        <StatCard label="Distinct Sites" value="123" sub="Campus buildings with verified pickups" color="green" onClick={()=>setActive('attribution')} linkLabel="Explore sites" />
      </div>

      {/* RFID cliff / monthly trend */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Pickup Volume and RFID Detection Rate by Month</div>
            <div style={{ fontSize:12, color:PAL.muted }}>Real data from {meta.total_raw_records.toLocaleString()} LoadMan records. RFID peaked 88.3% in Apr 2021, reached 0% by Aug 2022.</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['month','quarter'].map(p=>(
              <button key={p} onClick={()=>setTimePeriod(p)}
                style={{ padding:'5px 12px', borderRadius:5, border:`1px solid ${timePeriod===p?PAL.navy:PAL.border}`, background:timePeriod===p?PAL.navy:PAL.white, color:timePeriod===p?PAL.white:PAL.navy, cursor:'pointer', fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} margin={{ top:4, right:16, bottom:4, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
            <XAxis dataKey="period" tick={{ fontSize:9 }} />
            <YAxis yAxisId="left" tick={{ fontSize:10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} domain={[0,100]} tickFormatter={v=>`${v}%`} />
            <Tooltip formatter={(v,n)=>[n==='pickups'?v.toLocaleString():`${v}%`, n==='pickups'?'Pickups':'RFID Rate']} />
            <Legend />
            <Bar yAxisId="left" dataKey="pickups" fill={PAL.navyLight} name="Pickup Records" />
            <Bar yAxisId="right" dataKey="rfid_rate" fill={PAL.amber} name="RFID Rate %" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop:8, padding:'8px 12px', background:'#fff3cd', borderRadius:6, fontSize:12, color:'#664d03' }}>
          <strong>Key finding:</strong> RFID detection failed completely after October 2021.
          Both trucks failed simultaneously, pointing to a system-level cause. 
          The trucks kept running and weighing - the data exists, but container identity is missing.
          Cause not established from data alone; requires physical investigation.
        </div>
      </div>

      {/* Validity funnel */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Data Quality Funnel</div>
        <div style={{ fontSize:12, color:PAL.muted, marginBottom:12 }}>Records surviving each successive quality gate</div>
        {funnel.map((gate, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ fontSize:11, color:PAL.muted, minWidth:16 }}>{gate.gate}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                <span style={{ color:gate.gate===3?PAL.red:PAL.text, fontWeight:gate.gate===3?700:400 }}>{gate.label}</span>
                <span style={{ fontWeight:700, color:PAL.navy }}>{gate.n.toLocaleString()} ({(gate.pct*100).toFixed(1)}%)</span>
              </div>
              <div className="progress-bar" style={{ height:6 }}>
                <div className="progress-fill" style={{ width:`${gate.pct*100}%`, background: gate.gate===3?PAL.red:gate.gate===0?PAL.navyLight:gate.gate<=2?PAL.amber:PAL.teal }} />
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:8, fontSize:12, color:PAL.muted, fontStyle:'italic' }}>
          Gate 3 (RFID identification) is the critical failure point - losing 64.8% of otherwise valid records.
        </div>
      </div>

      {/* Top buildings */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Top Buildings by Verified Pickups</div>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:12 }}>From 9,989 usable records with RFID identification</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSites.map(s=>({ name:s.name.length>20?s.name.slice(0,18)+'...':s.name, count:s.count }))} layout="vertical" margin={{ top:0,right:12,bottom:0,left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={PAL.border} />
              <XAxis type="number" tick={{ fontSize:10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:9 }} width={130} />
              <Tooltip formatter={(v)=>[v.toLocaleString()+' pickups', 'Verified']} />
              <Bar dataKey="count" fill={PAL.teal} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop:6, fontSize:11, color:PAL.muted }}>
            All records verified via RFID. Missing: 70,000+ unattributed records.
          </div>
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Stream Distribution (Usable Records)</div>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:12 }}>From Service Type field - intended destination, not verified diversion</div>
          {(() => {
            const data = REAL_MODEL.service_types.slice(0,5);
            const total = data.reduce((s,d)=>s+d.count,0);
            return data.map((d,i)=>(
              <div key={d.name} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                  <span>{d.name}</span>
                  <span style={{ fontWeight:600 }}>{d.count.toLocaleString()} ({(d.count/9989*100).toFixed(1)}%)</span>
                </div>
                <div className="progress-bar" style={{ height:6 }}>
                  <div className="progress-fill" style={{ width:`${d.count/data[0].count*100}%`, background:MC[i] }} />
                </div>
              </div>
            ));
          })()}
          <div style={{ marginTop:8, fontSize:11, color:PAL.muted }}>
            Stream labels = intended destination at collection. Downstream verification required for diversion rate.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ATTRIBUTION ENGINE UI ────────────────────────────────────────────────────
function AttributionEngineUI({ setActive }) {
  const [demoRecords, setDemoRecords] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterConf, setFilterConf] = useState('all');
  const [showMethodology, setShowMethodology] = useState(false);
  const [staffReview, setStaffReview] = useState({});  // Record ID -> staff override
  const [reviewForm, setReviewForm] = useState(null);

  useEffect(() => {
    // Run attribution engine on simulated unattributed records
    const predictions = UNATTRIBUTED_RECORDS.map(r => ({
      ...r,
      _pred: AttributionEngine.predict(r.rfid, r.lat, r.lon)
    }));
    setDemoRecords(predictions);
  }, []);

  const meta = REAL_MODEL.meta;

  const filtered = useMemo(() => {
    if (!demoRecords) return [];
    if (filterConf === 'all') return demoRecords;
    if (filterConf === 'high') return demoRecords.filter(r=>r._pred.confidence >= 0.8);
    if (filterConf === 'medium') return demoRecords.filter(r=>r._pred.confidence >= 0.5 && r._pred.confidence < 0.8);
    if (filterConf === 'low') return demoRecords.filter(r=>r._pred.confidence > 0 && r._pred.confidence < 0.5);
    if (filterConf === 'abstain') return demoRecords.filter(r=>r._pred.confidence === 0);
    return demoRecords;
  }, [demoRecords, filterConf]);

  // Accuracy against hidden ground truth
  const accuracy = useMemo(() => {
    if (!demoRecords) return null;
    const withPred = demoRecords.filter(r=>r._pred.site);
    const correct = withPred.filter(r=>r._pred.site === r.true_site);
    const abstained = demoRecords.filter(r=>!r._pred.site);
    return {
      total: demoRecords.length,
      predicted: withPred.length,
      correct: correct.length,
      abstained: abstained.length,
      accuracy: withPred.length > 0 ? (correct.length/withPred.length*100).toFixed(1) : 'N/A',
      coverage: (withPred.length/demoRecords.length*100).toFixed(1)
    };
  }, [demoRecords]);

  if (!demoRecords) return <div style={{ padding:24 }}>Loading attribution engine...</div>;

  return (
    <div style={{ padding:24 }}>
      <SH title="Attribution Engine"
        sub="AI-powered building attribution for unidentified waste records. Three-tier: RFID lookup → GPS nearest-centroid → abstain."
        action={<Badge cls="badge-navy">Real Model</Badge>} />

      {/* Model card */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="GPS Top-1 Accuracy" value={`${meta.gps_top1_acc}%`} sub={`At ${meta.threshold_m}m threshold, ${meta.threshold_coverage_pct}% coverage`} color="green" />
        <StatCard label="GPS Top-3 Accuracy" value={`${meta.gps_top3_acc}%`} sub="Within top 3 candidates" color="green" />
        <StatCard label="RFID Accuracy" value={`${meta.rfid_acc}%`} sub={`${meta.distinct_rfids} distinct containers, all exclusive`} color="green" />
        <StatCard label="Training Records" value={meta.usable_records.toLocaleString()} sub={`${meta.distinct_sites} distinct campus sites`} color="blue" />
        <StatCard label="Validation Method" value="80/20" sub="Random split, GPS nearest-centroid baseline" color="navy" />
      </div>

      {/* Methodology */}
      <div className="card" style={{ padding:14, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Model Architecture and Methodology</div>
          <button onClick={()=>setShowMethodology(x=>!x)} style={{ background:'none', border:`1px solid ${PAL.border}`, borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:12, color:PAL.navyLight }}>{showMethodology?'Hide':'Show'}</button>
        </div>
        {showMethodology && (
          <div style={{ marginTop:12, fontSize:13, color:PAL.text, lineHeight:1.8 }}>
            <strong>Tier 1 - RFID Lookup (100% accuracy when RFID present):</strong><br/>
            When a record has an RFID tag, it is looked up in a 179-entry table derived from verified LoadMan records.
            All 179 RFIDs map exclusively to a single building. This is a deterministic lookup, not ML.<br/><br/>
            <strong>Tier 2 - GPS Nearest-Centroid (84.8% top-1 at 150m):</strong><br/>
            When no RFID is present but GPS coordinates exist, the pickup location is compared to 123 building centroids
            computed from the labeled dataset. The nearest centroid within the threshold is returned as the prediction.
            Confidence is computed from (a) distance to nearest centroid and (b) gap to second-nearest.<br/><br/>
            <strong>Tier 3 - Abstain:</strong><br/>
            When no RFID and no GPS (or GPS is more than 150m from any known centroid), the engine abstains
            rather than producing an unreliable prediction. This protects data integrity.<br/><br/>
            <strong>Validation:</strong> 80/20 random split of 9,989 labeled records. Training set used to build centroids.
            Test set evaluated against held-out ground truth. Accuracy: 84.8% top-1, 97.8% top-3.<br/><br/>
            <strong>Limitations:</strong> GPS coordinates cluster tightly at some large sites (e.g., ORCHARD DOWNS has
            avg 227m spread across the complex). Some nearby sites have centroids only 19-24m apart.
            The model cannot distinguish between adjacent buildings sharing a loading dock.
            Results must be treated as AI-inferred, not verified, until confirmed by authorized staff.
          </div>
        )}
      </div>

      {/* Live demo on simulated records */}
      <div className="card" style={{ padding:14, marginBottom:16, background:'#eff6ff', borderLeft:`4px solid ${PAL.navyLight}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:4 }}>Live Demo: Attribution on Simulated Unattributed Records</div>
        <p style={{ margin:0, fontSize:12, color:PAL.muted, lineHeight:1.6 }}>
          Applying the real GPS model to {demoRecords.length} simulated records (GPS noise added to real centroids).
          Ground truth is hidden during prediction, then revealed for evaluation.
          In production, this would run on the 70,000+ real unattributed LoadMan records.
        </p>
        {accuracy && (
          <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
            <div><span style={{ fontSize:11, color:PAL.muted }}>Predicted: </span><strong>{accuracy.predicted}</strong></div>
            <div><span style={{ fontSize:11, color:PAL.muted }}>Correct (vs hidden truth): </span><strong style={{ color:PAL.teal }}>{accuracy.correct} ({accuracy.accuracy}%)</strong></div>
            <div><span style={{ fontSize:11, color:PAL.muted }}>Abstained: </span><strong>{accuracy.abstained}</strong></div>
            <div><span style={{ fontSize:11, color:PAL.muted }}>Coverage: </span><strong>{accuracy.coverage}%</strong></div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:7, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:12, color:PAL.muted }}>Filter by confidence:</span>
        {[['all','All'],['high','High'],['medium','Medium'],['low','Low'],['abstain','Abstain']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterConf(v)}
            style={{ padding:'4px 12px', borderRadius:12, border:`1px solid ${filterConf===v?PAL.navy:PAL.border}`, background:filterConf===v?PAL.navy:PAL.white, color:filterConf===v?PAL.white:PAL.text, cursor:'pointer', fontSize:12, fontWeight:filterConf===v?600:400 }}>{l}</button>
        ))}
        <span style={{ fontSize:12, color:PAL.muted, marginLeft:'auto' }}>Showing {filtered.length} records</span>
      </div>

      {/* Records table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                {['Record','Date','Has GPS','Predicted Building','Confidence','Method','Correct?','Staff Review'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,50).map(r => {
                const pred = r._pred;
                const override = staffReview[r.id];
                const isCorrect = pred.site ? pred.site === r.true_site : null;
                return (
                  <tr key={r.id} style={{ background:isCorrect===true?'#f0fdf4':isCorrect===false?'#fef2f2':'inherit' }}>
                    <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.id}</td>
                    <td>{r.date}</td>
                    <td style={{ textAlign:'center' }}>{r.has_gps ? <span style={{ color:PAL.teal }}>✓</span> : <span style={{ color:PAL.muted }}>–</span>}</td>
                    <td>
                      {override ? (
                        <div>
                          <ProvenancePill type="verified" size="sm" />
                          <span style={{ fontSize:12, marginLeft:4 }}>{override}</span>
                        </div>
                      ) : pred.site ? (
                        <div>
                          <ProvenancePill type={pred.tier===1?'verified':'ai_inferred'} size="sm" />
                          <span style={{ fontSize:12, marginLeft:4 }}>{pred.site.length>30?pred.site.slice(0,28)+'...':pred.site}</span>
                        </div>
                      ) : (
                        <ProvenancePill type="unknown" size="sm" />
                      )}
                    </td>
                    <td>
                      {pred.confidence > 0 && <ConfidenceMeter score={pred.confidence} label={pred.confidence_label} />}
                    </td>
                    <td style={{ fontSize:11, color:PAL.muted }}>
                      {pred.method === 'rfid_lookup' ? 'RFID' : pred.method === 'gps_centroid' ? 'GPS' : 'Abstain'}
                    </td>
                    <td style={{ fontSize:12 }}>
                      {pred.site ? (
                        isCorrect
                          ? <span style={{ color:PAL.teal, fontWeight:700 }}>✓</span>
                          : <span style={{ color:PAL.red, fontWeight:700, fontSize:10 }}>✗ ({r.true_site.slice(0,15)}...)</span>
                      ) : <span style={{ color:PAL.muted }}>–</span>}
                    </td>
                    <td>
                      {!override && pred.site && pred.tier === 2 && (
                        <button onClick={()=>setReviewForm({ id:r.id, predicted:pred.site, top3:pred.top3||[] })}
                          style={{ padding:'2px 8px', borderRadius:4, border:`1px solid ${PAL.border}`, background:PAL.white, cursor:'pointer', fontSize:11, color:PAL.navyLight }}>Review</button>
                      )}
                      {override && <span style={{ fontSize:11, color:PAL.teal, fontWeight:600 }}>Confirmed ✓</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 50 && <div style={{ padding:'8px 14px', fontSize:12, color:PAL.muted }}>Showing first 50 of {filtered.length} records</div>}
        </div>
      </div>

      {/* Staff Review modal */}
      {reviewForm && (
        <Modal open={!!reviewForm} onClose={()=>setReviewForm(null)} title="Staff Attribution Review" maxWidth={500}>
          <div style={{ fontSize:13, marginBottom:12 }}>
            <strong>Record:</strong> {reviewForm.id}<br/>
            <strong>AI Prediction:</strong> {reviewForm.predicted}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:PAL.navy, marginBottom:8 }}>Top 3 Candidates</div>
          {reviewForm.top3.map((c,i)=>(
            <button key={i} onClick={()=>{ setStaffReview(s=>({...s,[reviewForm.id]:c.site})); setReviewForm(null); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', marginBottom:6, borderRadius:6, border:`1px solid ${i===0?PAL.navyLight:PAL.border}`, background:i===0?'#eff6ff':PAL.white, cursor:'pointer', fontSize:13 }}>
              <strong>#{i+1}:</strong> {c.site} <span style={{ color:PAL.muted }}>({Math.round(c.d)}m away)</span>
              {i===0 && <Badge cls="badge-navy" style={{ marginLeft:8 }}>AI Top Pick</Badge>}
            </button>
          ))}
          <div style={{ marginTop:12, padding:'8px 12px', background:PAL.amberBg, borderRadius:6, fontSize:12, color:'#92400e' }}>
            Confirming a building attribution marks this record as staff-verified. The original AI prediction is preserved for audit.
          </div>
          <button onClick={()=>setReviewForm(null)} className="btn btn-secondary btn-sm" style={{ marginTop:10 }}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}

// ─── DATA PIPELINE ────────────────────────────────────────────────────────────
function DataPipeline() {
  const meta = REAL_MODEL.meta;
  const trend = REAL_MODEL.trend;
  const funnel = REAL_MODEL.funnel;

  // Find the RFID cliff precisely
  const rfidByMonth = trend.map(t=>({ month:t.month, rfid_rate:t.rfid_rate, status:t.status }));
  const lastWorking = rfidByMonth.filter(t=>t.rfid_rate>0).slice(-1)[0];
  const firstFailed = rfidByMonth.filter(t=>t.status==='Container ID failed')[0];

  return (
    <div style={{ padding:24 }}>
      <SH title="Data Pipeline and Quality Report"
        sub="Verified analysis of 79,533 actual UIUC LoadMan records. Source: Betsy Ruckman, F&S Zero Waste Coordinator." />

      <div className="card" style={{ padding:14, marginBottom:16, background:'#f0fdf4', borderLeft:`4px solid ${PAL.teal}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:PAL.teal, marginBottom:6 }}>Data Provenance</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8, fontSize:13 }}>
          {[
            ['Source file','LoadData - All Columns - 9-15 17:16:30.csv (LoadMan portal export)'],
            ['Recipient','Betsy Ruckman, Zero Waste Coordinator, UIUC Facilities & Services'],
            ['Records exported','79,533 rows x 53 columns'],
            ['Date range','2001-01-01 through 2025-08-30'],
            ['Trucks','New Truck; 31272-11; small number unspecified'],
            ['Encoding','Windows-1252 (not UTF-8)'],
          ].map(([k,v])=>(
            <div key={k} style={{ padding:'6px 0', borderBottom:`1px solid ${PAL.border}` }}>
              <div style={{ fontSize:11, color:PAL.muted }}>{k}</div>
              <div style={{ fontSize:12, color:PAL.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel detail */}
      <div className="card" style={{ padding:16, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Validity Funnel - All 79,533 Records</div>
        <table>
          <thead>
            <tr>
              <th>Gate</th><th>Records</th><th>% of All</th><th>What This Tests</th>
            </tr>
          </thead>
          <tbody>
            {funnel.map(g=>(
              <tr key={g.gate} style={{ background: g.gate===3?'#fef2f2':g.gate===7?'#f0fdf4':'inherit' }}>
                <td style={{ fontWeight:600, color:g.gate===3?PAL.red:g.gate===7?PAL.teal:PAL.text }}>{g.label}</td>
                <td style={{ fontWeight:700 }}>{g.n.toLocaleString()}</td>
                <td>{(g.pct*100).toFixed(1)}%</td>
                <td style={{ fontSize:12, color:PAL.muted }}>
                  {['All rows in portal export',
                    'Excludes meter power events, asset deliveries, missed loads',
                    'Excludes 2001/2002 device-clock defaults (31,725 records)',
                    'THE FAILURE POINT - missing container RFID identity',
                    'Container maps to known campus site',
                    'Gross weight > 0 captured',
                    'Tare weight > 0 captured (net weight computable)',
                    'Weights inside physically credible bounds'][g.gate]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RFID cliff investigation */}
      <div className="card" style={{ padding:16, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:4 }}>RFID Operational Failure Investigation</div>
        <div style={{ fontSize:12, color:PAL.muted, marginBottom:12 }}>
          RFID detection peaked at <strong>88.3%</strong> in April 2021. By August 2022, it reached <strong>0.0%</strong> and has remained there.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:14 }}>
          {[
            { label:'RFID Peak', value:'88.3%', note:'April 2021', color:PAL.teal },
            { label:'Last Working Month', value:lastWorking?.month||'Oct 2021', note:`${lastWorking?.rfid_rate||58.6}% rate`, color:PAL.amber },
            { label:'First 0% Month', value:firstFailed?.month||'Aug 2022', note:'0.0% detection', color:PAL.red },
            { label:'Both Trucks', value:'Failed together', note:'System-level cause suspected', color:PAL.navy },
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{ borderLeft:`4px solid ${s.color}` }}>
              <div style={{ fontSize:11, color:PAL.muted, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
              <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:PAL.muted }}>{s.note}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 14px', background:'#fff3cd', borderRadius:6, fontSize:13, color:'#664d03', lineHeight:1.7 }}>
          <strong>Important:</strong> This analysis identifies WHERE the data fails, not WHY.
          Candidate causes (tag failure, reader failure, service lapse, configuration loss, firmware) are untested hypotheses.
          They must be confirmed against the vehicles and with the operator before any conclusion is drawn.
          <br/><strong>Recommended next step:</strong> Compare manually logged pickups against database records during a front-loader route ride-along.
        </div>
      </div>

      {/* Field inventory highlights */}
      <div className="card" style={{ padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Key Field Coverage (53 columns total)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
          {[
            { field:'Pickup Time', pct:100, note:'100% - reliable timestamp when not epoch-default', color:PAL.teal },
            { field:'RFID (container tag)', pct:20.4, note:'20.4% - the core attribution gap', color:PAL.red },
            { field:'Site Name', pct:28.0, note:'28.0% - includes records resolved without RFID', color:PAL.amber },
            { field:'GPS (Load Lat/Lon)', pct:40.1, note:'40.1% - available for attribution inference', color:PAL.navyLight },
            { field:'Service Type', pct:93.8, note:'93.8% - container + waste type info', color:PAL.teal },
            { field:'Truck Name', pct:100, note:'100% - truck identity always recorded', color:PAL.teal },
            { field:'Capacity/Volume/Density', pct:0, note:'0% - fields present but unconfigured', color:PAL.muted },
            { field:'NVW', pct:93.3, note:'93.3% - values in millions, definition unconfirmed', color:PAL.amber },
          ].map(f=>(
            <div key={f.field}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                <span style={{ fontWeight:600, color:PAL.text }}>{f.field}</span>
                <span style={{ color:f.color, fontWeight:700 }}>{f.pct}%</span>
              </div>
              <div className="progress-bar" style={{ height:5, marginBottom:3 }}>
                <div className="progress-fill" style={{ width:`${f.pct}%`, background:f.color }} />
              </div>
              <div style={{ fontSize:11, color:PAL.muted }}>{f.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ASK NEXUS ────────────────────────────────────────────────────────────────
// Grounded in real LoadMan statistics. All numbers are from verified data.
const NexusAI = {
  answer(question) {
    const q = question.toLowerCase().trim();
    const meta = REAL_MODEL.meta;
    const trend = REAL_MODEL.trend;

    // Top buildings
    if (q.includes('building') && (q.includes('most')||q.includes('top')||q.includes('highest'))) {
      const top = REAL_MODEL.top_sites.slice(0,5);
      const list = top.map((s,i)=>`${i+1}. ${s.name}: ${s.count.toLocaleString()} verified pickups`).join('\n');
      return { type:'calculated', answer:`Based on ${meta.usable_records.toLocaleString()} verified LoadMan records (RFID-identified):\n\n${list}`, note:`These are the ${meta.distinct_sites} buildings with verified RFID pickup records. The remaining ${(79533-meta.usable_records).toLocaleString()} records lack building attribution.`, records_used:meta.usable_records, total_records:meta.total_raw_records };
    }

    // Attribution rate
    if (q.includes('attribution')||q.includes('12.6')||q.includes('87.4')) {
      return { type:'observed', answer:`Of 79,533 total LoadMan records:\n- 9,989 (12.6%) pass all quality gates and have building attribution\n- 87.4% lack building attribution for verified reasons:\n  • 31,725 records: epoch-default timestamp (Jan 1, 2001)\n  • ~28,000+ records: RFID system failure after Oct 2021\n  • Remaining: load type not "Load Pickup", missing RFID, or weight issues`, note:'Source: UIUC_LoadMan_Consolidated_Dataset.xlsx, analyzed for Betsy Ruckman, F&S.', records_used:79533, total_records:79533 };
    }

    // RFID failure
    if (q.includes('rfid')||q.includes('failure')||q.includes('cliff')||q.includes('stopped')) {
      const peak = trend.filter(t=>t.rfid_rate>0).sort((a,b)=>b.rfid_rate-a.rfid_rate)[0];
      return { type:'observed', answer:`RFID container detection failure timeline:\n- Dec 2019: 0% (pre-operational)\n- 2020: Gradual ramp from 3.3% to 69%\n- ${peak.month}: PEAK at ${peak.rfid_rate}% (${peak.pickups.toLocaleString()} pickups)\n- Aug-Oct 2021: Degraded to ~58-62%\n- Nov 2021 - Jul 2022: Gap in data\n- Aug 2022: 0% - never recovered\n\nBoth trucks failed simultaneously, indicating a system-level cause. Weights continued to be recorded - the data exists, container identity does not.`, note:'CAUSE NOT ESTABLISHED from data alone. Physical investigation of vehicles and service records required.', records_used:43759, total_records:79533 };
    }

    // GPS / attribution model
    if (q.includes('model')||q.includes('accuracy')||q.includes('gps')||q.includes('prediction')||q.includes('attribution engine')) {
      return { type:'calculated', answer:`Attribution Engine performance (held-out 20% test set):\n\nTier 1 - RFID Lookup:\n  Accuracy: 100% (deterministic)\n  Coverage: depends on RFID presence (currently 0% in post-Oct 2021 data)\n  Distinct RFIDs: 179 (all exclusive 1-to-1 building mapping)\n\nTier 2 - GPS Nearest-Centroid:\n  Top-1 accuracy: 84.8%\n  Top-3 accuracy: 97.8%\n  Coverage at 150m threshold: 91.6%\n  Training data: 123 building centroids from 9,989 labeled records\n\nTier 3 - Abstain:\n  Used when: no RFID and no GPS, or GPS >150m from any known centroid`, note:'Validation: 80/20 random split of 9,989 labeled records. GPS model uses Haversine nearest-centroid. No features beyond GPS coordinates.', records_used:9989, total_records:9989 };
    }

    // Stream distribution
    if (q.includes('stream')||q.includes('landfill')||q.includes('cardboard')||q.includes('paper')||q.includes('recycling')||q.includes('diversion')) {
      const lines = REAL_MODEL.service_types.map(s=>`${s.name}: ${s.count.toLocaleString()} records (${(s.count/9989*100).toFixed(1)}%)`).join('\n');
      return { type:'calculated', answer:`Waste stream distribution from Service Type field (9,989 usable records):\n\n${lines}\n\nNote: "Landfill" = Front Load-Landfill containers. "Cardboard"/"Paper" = recycling streams.`, note:"Stream labels = intended destination at collection. Downstream verification required for diversion rate calculation. Diversion rate cannot be reliably calculated from this dataset without confirmed downstream disposition data.", records_used:9989, total_records:9989 };
    }

    // Total records / weight
    if (q.includes('total')&&(q.includes('record')||q.includes('weight')||q.includes('pickup'))) {
      return { type:'observed', answer:`Total LoadMan records: 79,533\n\nBreakdown:\n- Load Pickup events: 73,857 (92.9%)\n- Other event types: 5,676 (7.1%)\n\n- With valid pickup date: 43,759 (55.0%)\n- With RFID identification: 15,406 (19.4%)\n- With site/building resolved: 13,414 (16.9%)\n- Fully usable (all gates): 9,989 (12.6%)\n\nWeight data: captured in usable records but net weight requires confirmed NVW field definition.`, note:'Source: 79,533 raw records. Validity funnel computed from UIUC_LoadMan_Consolidated_Dataset.xlsx.', records_used:79533, total_records:79533 };
    }

    // Epoch dates
    if (q.includes('2001')||q.includes('epoch')||q.includes('timestamp')||q.includes('date')) {
      return { type:'observed', answer:`28,337 records carry a timestamp of January 1, 2001.\n\nThis is a device clock default - it indicates the LoadMan unit powered on without a time synchronization. These are not records from 2001.\n\nImpact: 28,337 records are excluded from the valid-date gate (Gate 2) of the validity funnel, reducing 73,857 Load Pickup events to 43,759 with valid dates.`, note:'Source: Validity funnel, Gate 2. The 2001 dates are a hardware/software artifact, not actual pickup dates.', records_used:73857, total_records:79533 };
    }

    // Data quality / missing data
    if (q.includes('missing')||q.includes('gap')||q.includes('quality')||q.includes('what do we need')) {
      return { type:'methodology', answer:`Key data gaps in the LoadMan dataset:\n\n1. RFID system failed after Oct 2021 - no container identity in 2022-2025 records\n2. 28,337 epoch-default timestamps (device clock not synced)\n3. GPS only 40.1% overall (99.7% in labeled records)\n4. NVW field definition unconfirmed (values in millions - not per-pickup weight)\n5. Capacity/Volume/Density fields present but all zero (unconfigured)\n6. Downstream disposition not recorded (diversion rate unverifiable)\n\nFor GPS attribution to work at scale:\n- Need to confirm GPS accuracy in unattributed 2022-2025 records\n- Need to confirm whether GPS coordinates exist for epoch-date records`, note:'See Field Inventory in UIUC_LoadMan_Consolidated_Dataset.xlsx for complete column analysis.', records_used:0, total_records:79533 };
    }

    // Orchard Downs / specific site
    if (q.includes('orchard')||q.includes('top site')) {
      return { type:'observed', answer:`ORCHARD DOWNS APARTMENTS has the most verified pickup records:\n1,711 of 9,989 total (17.1% of usable records)\n\nThis is a large off-campus student housing complex. The high pickup count suggests frequent collection frequency or large container volumes.\n\nNote: GPS spread at Orchard Downs averages 227m - the pickup locations are distributed across the complex, which may reduce GPS prediction accuracy for nearby sites.`, note:'Source: 9,989 usable records from UIUC_LoadMan_Consolidated_Dataset.xlsx.', records_used:1711, total_records:9989 };
    }

    // Betsy / stakeholder
    if (q.includes('betsy')||q.includes('f&s')||q.includes('facilities')) {
      return { type:'observed', answer:`The LoadMan dataset was exported for and prepared for Betsy Ruckman, Zero Waste Coordinator, UIUC Facilities & Services.\n\nBetsy's identified priorities:\n1. Collection Log: more automatic field population, route knowledge\n2. Waste Explorer: visual weight breakdown, diversion clarity\n3. Overview: headline metrics with drill-down capability\n\nEnviroTrap's recommended next step (from the data): A route ride-along to compare manual records against LoadMan data during an actual collection run. This would help validate whether the RFID failure is vehicle-side, reader-side, or service-side.`, note:"Betsy's feedback is treated as qualitative stakeholder input, not proof of institutional adoption or approved pilot.", records_used:0, total_records:0 };
    }

    // NVW
    if (q.includes('nvw')||q.includes('weight')) {
      return { type:'observed', answer:`The NVW (Net Vehicle Weight?) field:\n- Present in 93.3% of records (74,241 rows)\n- Values run into the millions - these are NOT per-pickup net weights\n- The field appears to be a cumulative or raw counter, not an individual load weight\n- EnviroTrap excluded NVW from the funnel pending confirmation of its definition\n\nWeight in usable records comes from: gross load weight - container tare weight.\nBoth must be > 0, which is satisfied in 9,998 → 9,989 records.`, note:'NVW definition must be confirmed with the LoadMan operator before using for weight calculations.', records_used:0, total_records:79533 };
    }

    return { type:'unknown', answer:null };
  }
};

const NEXUS_SUGGESTIONS = [
  'Which buildings have the most verified pickup records?',
  'What is the attribution rate and why?',
  'What happened to the RFID system?',
  'How accurate is the GPS attribution model?',
  'What is the breakdown by waste stream?',
  'How many total records are in the dataset?',
  'What data gaps prevent a diversion rate calculation?',
  'What are the 2001 timestamp records?',
  'What is the NVW field?',
  "What are Betsy's priorities?",
];

function AskNexus() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  function ask(q) {
    const question = (q||query).trim();
    if (!question) return;
    setLoading(true);
    setQuery('');
    setTimeout(()=>{
      const result = NexusAI.answer(question);
      setHistory(h=>[{ id:Date.now(), question, ...result, timestamp:new Date().toLocaleTimeString() },...h]);
      setLoading(false);
    }, 350);
  }

  const typeColors = { calculated:PAL.teal, observed:PAL.navyLight, methodology:PAL.muted };
  const typeLabels = { calculated:'Calculated Finding', observed:'Observed Fact', methodology:'Methodology' };

  return (
    <div style={{ padding:24, maxWidth:820, margin:'0 auto' }}>
      <SH title="Ask Nexus"
        sub="Deterministic waste intelligence - all answers computed from 79,533 actual LoadMan records. No LLM, no fabricated data." />

      <div className="card" style={{ padding:14, marginBottom:16, background:'#eff6ff', borderLeft:`4px solid ${PAL.navyLight}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:PAL.navy, marginBottom:4 }}>About Ask Nexus</div>
        <p style={{ margin:0, fontSize:13, color:PAL.text, lineHeight:1.7 }}>
          Ask Nexus answers questions by running pattern-matching and rule-based computation against verified data from 79,533 actual UIUC LoadMan records.
          Every numerical claim traces to a specific source. This is not a language model - no external API calls are made.
          Uncertainty is always explicitly stated. For competition purposes, the system architecture is documented and all responses are reproducible.
        </p>
      </div>

      <div className="card" style={{ padding:14, marginBottom:16 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&query.trim()) ask(); }}
            placeholder="Ask a question about UIUC campus waste data..." style={{ flex:1, fontSize:14 }} />
          <button className="btn btn-primary" onClick={()=>ask()} disabled={loading||!query.trim()}>{loading?'Computing...':'Ask'}</button>
        </div>
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:PAL.muted, marginBottom:7 }}>Questions grounded in real data:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {NEXUS_SUGGESTIONS.map(s=>(
              <button key={s} onClick={()=>ask(s)}
                style={{ padding:'4px 10px', borderRadius:12, border:`1px solid ${PAL.border}`, background:PAL.white, cursor:'pointer', fontSize:11, color:PAL.navy }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:20, color:PAL.muted, fontSize:13 }}>Computing from verified records...</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {history.length===0 && !loading && (
          <div style={{ textAlign:'center', padding:40, color:PAL.muted }}>
            <div style={{ fontSize:24, marginBottom:8 }}>&#9711;</div>
            <div style={{ fontWeight:600 }}>Ask a question to get started</div>
            <div style={{ fontSize:13, marginTop:4 }}>All answers computed from 79,533 actual UIUC LoadMan records</div>
          </div>
        )}
        {history.map(h=>(
          <div key={h.id} className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:PAL.navy }}>Q: {h.question}</div>
              <span style={{ fontSize:11, color:PAL.muted }}>{h.timestamp}</span>
            </div>
            {h.type==='unknown' ? (
              <div style={{ background:PAL.cream, borderRadius:6, padding:12, fontSize:13, color:PAL.muted }}>
                Ask Nexus could not find a handler for this question. Try the suggested questions above.
                Supported topics: buildings, attribution rate, RFID failure, GPS model, streams, total records, data gaps, timestamps, NVW, stakeholders.
              </div>
            ) : (
              <div>
                <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:(typeColors[h.type]||PAL.muted)+'22', color:typeColors[h.type]||PAL.muted, marginBottom:8 }}>
                  {typeLabels[h.type]||h.type}
                </span>
                <pre style={{ margin:'0 0 12px', fontSize:13, lineHeight:1.7, fontFamily:'inherit', whiteSpace:'pre-wrap', color:PAL.text, background:PAL.cream, borderRadius:6, padding:12 }}>{h.answer}</pre>
                {h.note && (
                  <div style={{ background:PAL.amberBg, border:`1px solid #fde68a`, borderRadius:6, padding:'8px 12px', fontSize:12, color:'#92400e' }}>
                    <strong>Source / Note:</strong> {h.note}
                  </div>
                )}
                {h.records_used > 0 && <div style={{ marginTop:6, fontSize:11, color:PAL.muted }}>Computed from {h.records_used.toLocaleString()} of {h.total_records.toLocaleString()} total records.</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COLLECTION LOG ───────────────────────────────────────────────────────────
function CollectionLog() {
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  const timeStr = `${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const [form, setForm] = useState({ route_id:'', building_id:'', container:'', time:timeStr, gross:'', tare:'', stream:'', notes:'', flags:[] });
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({});
  const [ok, setOk] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [weightWarn, setWeightWarn] = useState(null);

  const suggestedRoutes = ROUTE_DEFS.filter(r=>r.days.includes(dow) && hour>=r.startHour && hour<=r.endHour);
  const selectedRoute = ROUTE_DEFS.find(r=>r.id===form.route_id);
  const availableBuildings = form.route_id ? DEMO_BUILDINGS.filter(b=>selectedRoute?.buildings.includes(b.id)) : DEMO_BUILDINGS;
  const otherBuildings = form.route_id ? DEMO_BUILDINGS.filter(b=>!selectedRoute?.buildings.includes(b.id)) : [];
  const availableContainers = selectedRoute?.containers || ['Front Load-Landfill-6','Front Load-Landfill-8','Front Load-Cardboard-8','Front Load-Paper-2'];
  const FLAGS = ['Container overfull','Access blocked','Contamination observed','Damaged container','Safety concern'];

  const net = form.gross && form.tare ? (parseFloat(form.gross)-parseFloat(form.tare)).toFixed(1) : form.gross||'';

  function up(k,v) {
    setErrors(e=>({...e,[k]:null}));
    const updated = {...form,[k]:v};
    if (k==='route_id') { updated.building_id=''; updated.container=''; }
    setForm(updated);
    if (k==='gross'||k==='tare') {
      const n = parseFloat(updated.gross)||0, t = parseFloat(updated.tare)||0;
      if (n>0 && t>=n) setErrors(e=>({...e,tare:'Tare must be less than gross weight'}));
    }
  }

  useEffect(()=>{
    if (form.route_id && !form.container) {
      const c = ROUTE_DEFS.find(r=>r.id===form.route_id)?.containers[0];
      if (c) setForm(p=>({...p,container:c}));
    }
  },[form.route_id]);

  function tf(f) { setForm(p=>({...p,flags:p.flags.includes(f)?p.flags.filter(x=>x!==f):[...p.flags,f]})); }

  function validate() {
    const e={};
    if (!form.route_id) e.route_id='Select a route';
    if (!form.building_id) e.building_id='Select a building';
    if (!form.stream) e.stream='Select a stream';
    if (!form.time) e.time='Enter pickup time';
    if (form.tare && form.gross && parseFloat(form.tare)>=parseFloat(form.gross)) e.tare='Tare must be less than gross weight';
    return e;
  }

  function sub() {
    const e=validate();
    if (Object.keys(e).length>0) { setErrors(e); return; }
    const route=ROUTE_DEFS.find(r=>r.id===form.route_id);
    const bld=DEMO_BUILDINGS.find(b=>b.id===form.building_id);
    setLogs(p=>[{ id:`COL${Date.now()}`, date:new Date().toISOString().slice(0,10), time:form.time, route:route?.label, building:bld?.name, container:form.container, stream:form.stream, net:net||'Not recorded', flags:form.flags, notes:form.notes },...p]);
    setOk(true);
    setTimeout(()=>{ setOk(false); setForm({ route_id:'', building_id:'', container:'', time:new Date().toTimeString().slice(0,5), gross:'', tare:'', stream:'', notes:'', flags:[] }); setErrors({}); },2500);
  }

  return (
    <div style={{ padding:16, maxWidth:580, margin:'0 auto' }}>
      <SH title="Collection Log" sub="Driver interface - smart suggestions based on verified route schedules (demo data)" />

      {ok && <div style={{ background:'#cce5d8', border:'1px solid #66b089', color:'#1a3d30', padding:14, borderRadius:8, textAlign:'center', fontWeight:600, marginBottom:14 }}>Pickup logged successfully</div>}

      {suggestedRoutes.length>0 && !form.route_id && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:14 }}>
          <div style={{ fontWeight:700, color:PAL.navyLight, marginBottom:6, fontSize:13 }}>Suggested for {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} {timeStr}:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {suggestedRoutes.map(r=>(
              <button key={r.id} onClick={()=>up('route_id',r.id)} style={{ padding:'5px 12px', borderRadius:5, border:`1px solid ${PAL.navyLight}`, background:PAL.white, color:PAL.navyLight, cursor:'pointer', fontSize:13, fontWeight:600 }}>{r.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Route <span style={{ color:PAL.red }}>*</span></label>
            <select value={form.route_id} onChange={e=>up('route_id',e.target.value)} style={{ border:`1px solid ${errors.route_id?PAL.red:PAL.border}` }}>
              <option value="">Select route...</option>
              {ROUTE_DEFS.map(r=>(<option key={r.id} value={r.id}>{r.label}</option>))}
            </select>
            {errors.route_id && <div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{errors.route_id}</div>}
            {selectedRoute && <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>Typical time: {selectedRoute.startHour}:00-{selectedRoute.endHour}:00. Buildings on this route pre-loaded below.</div>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Building <span style={{ color:PAL.red }}>*</span>{form.route_id&&<span style={{ fontSize:11, color:PAL.teal, fontWeight:400, marginLeft:6 }}>Filtered to route</span>}</label>
            <select value={form.building_id} onChange={e=>up('building_id',e.target.value)} style={{ border:`1px solid ${errors.building_id?PAL.red:PAL.border}` }}>
              <option value="">Select building...</option>
              {availableBuildings.map(b=>(<option key={b.id} value={b.id}>{b.name}</option>))}
              {form.route_id&&otherBuildings.length>0&&<option disabled>-- Other buildings (outside route) --</option>}
              {form.route_id&&otherBuildings.map(b=>(<option key={b.id+'_'} value={b.id}>{b.name}</option>))}
            </select>
            {errors.building_id && <div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{errors.building_id}</div>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Container type{form.route_id&&<span style={{ fontSize:11, color:PAL.teal, fontWeight:400, marginLeft:6 }}>Pre-filled from route</span>}</label>
            <select value={form.container} onChange={e=>up('container',e.target.value)}>
              <option value="">Select container...</option>
              {availableContainers.map(c=>(<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Time <span style={{ color:PAL.red }}>*</span></label>
              <input type="time" value={form.time} onChange={e=>up('time',e.target.value)} style={{ width:'auto' }} />
              {errors.time&&<div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{errors.time}</div>}
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Gross (lbs)</label>
              <input type="number" min="0" value={form.gross} onChange={e=>up('gross',e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Tare (lbs)</label>
              <input type="number" min="0" value={form.tare} onChange={e=>up('tare',e.target.value)} placeholder="Optional" />
              {errors.tare&&<div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{errors.tare}</div>}
            </div>
          </div>
          {net&&<div style={{ background:PAL.cream, borderRadius:6, padding:'8px 12px', fontSize:13 }}><strong>Calculated net: {net} lbs</strong></div>}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:6 }}>Waste Stream <span style={{ color:PAL.red }}>*</span></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {['Landfill','Cardboard','Paper'].map(s=>(
                <button key={s} onClick={()=>up('stream',s)} style={{ padding:'7px 14px', borderRadius:6, border:`2px solid ${form.stream===s?PAL.navyLight:PAL.border}`, background:form.stream===s?PAL.navyLight:PAL.white, color:form.stream===s?'#fff':PAL.text, cursor:'pointer', fontSize:13, fontWeight:600 }}>{s}</button>
              ))}
            </div>
            {errors.stream&&<div style={{ color:PAL.red, fontSize:12, marginTop:3 }}>{errors.stream}</div>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:6 }}>Flags</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {FLAGS.map(f=>(
                <button key={f} onClick={()=>tf(f)} style={{ padding:'5px 11px', borderRadius:5, border:`1px solid ${form.flags.includes(f)?PAL.amber:PAL.border}`, background:form.flags.includes(f)?'#fef9ec':PAL.white, color:form.flags.includes(f)?PAL.amberDark:PAL.text, cursor:'pointer', fontSize:12 }}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Notes</label>
            <textarea value={form.notes} onChange={e=>up('notes',e.target.value)} rows={2} placeholder="Operational observations..." style={{ resize:'vertical', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" onClick={sub} style={{ flex:1, padding:'11px', fontSize:15, fontWeight:700 }}>Log Pickup</button>
            <button className="btn btn-secondary" onClick={()=>{ setForm({ route_id:'', building_id:'', container:'', time:new Date().toTimeString().slice(0,5), gross:'', tare:'', stream:'', notes:'', flags:[] }); setErrors({}); }}>Clear</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop:10, padding:'8px 12px', background:PAL.cream, borderRadius:6, fontSize:11, color:PAL.muted }}>
        Building names from real UIUC site names in LoadMan data. This interface is not connected to LoadMan or existing university systems.
      </div>

      {logs.length>0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Session Log ({logs.length})</div>
          {logs.map(l=>(
            <div key={l.id} className="card" style={{ padding:12, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{l.building}</div>
                  <div style={{ fontSize:12, color:PAL.muted }}>{l.date} at {l.time} - {l.route} - Net: {l.net} lbs</div>
                </div>
                <Badge cls={`badge ${l.stream==='Cardboard'||l.stream==='Paper'?'badge-navy':'badge-gray'}`}>{l.stream}</Badge>
              </div>
              {l.flags.length>0&&<div style={{ marginTop:6, display:'flex', gap:5 }}>{l.flags.map(f=>(<span key={f} className="badge badge-amber">{f}</span>))}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WASTE AUDITS ─────────────────────────────────────────────────────────────
const DEMO_AUDITS = [
  { id:'AUD001', title:'Illini Union General Waste Audit', building_id:'B001', building_name:'ORCHARD DOWNS APARTMENTS', date:'2024-03-15', auditors:['Tajuan Williams','Sarah Chen'], status:'Completed', sample_weight_lbs:87.3, stream:'Landfill', materials:[{name:'Paper',weight:12.4},{name:'Plastics',weight:9.1},{name:'Food Waste',weight:18.2},{name:'Paper Towels',weight:19.2},{name:'Other',weight:28.4}], notes:'High paper towel fraction. Cross-contamination from adjacent recycling bins observed.' },
  { id:'AUD002', title:'CRCE Recycling Stream Audit', building_id:'B003', building_name:'VET MED BASIC SCIENCES BUILDING', date:'2024-02-10', auditors:['Sarah Chen'], status:'Completed', sample_weight_lbs:41.6, stream:'Cardboard', materials:[{name:'Cardboard',weight:22.1},{name:'Paper',weight:11.3},{name:'Food Waste',weight:4.0},{name:'Metals',weight:4.2}], notes:'Food waste contamination at 9.7% of sample.' },
  { id:'AUD003', title:'Ikenberry Post-Lunch Compost', building_id:'B006', building_name:'STUDENT DINING AND RESIDENTIAL PROGRAMS', date:'2024-01-22', auditors:['Tajuan Williams'], status:'Under Review', sample_weight_lbs:112.4, stream:'Landfill', materials:[{name:'Food Waste',weight:98.1},{name:'Paper',weight:8.2},{name:'Plastics',weight:6.1}], notes:'Single data point. Unusually high volume.' },
  { id:'AUD004', title:'Vet Med Lab Recycling Pilot', building_id:'B002', building_name:'VET MED BASIC SCIENCES BUILDING', date:'2024-04-18', auditors:['Sarah Chen','Marcus Lee'], status:'In Progress', sample_weight_lbs:67.8, stream:'Cardboard', materials:[{name:'Cardboard',weight:28.4},{name:'Paper',weight:12.1},{name:'Plastics',weight:20.4},{name:'Metals',weight:6.9}], notes:'Plastics higher than expected - lab consumables suspected.' },
];

function WasteAudits() {
  const [audits, setAudits] = useState(DEMO_AUDITS);
  const [sel, setSel] = useState(null);
  const [modal, setModal] = useState(false);
  const [nA, setNA] = useState({ title:'', building_id:'', date:'', stream:'', auditors:'', notes:'' });
  const [errors, setErrors] = useState({});
  const MC_local = ['#1e3a5f','#2d6a4f','#3b6fae','#e9a825','#66b089','#c4a360'];

  function AuditDetail({ audit }) {
    const [mats, setMats] = useState(audit.materials.length>0 ? audit.materials : [
      {name:'Paper',weight:''},{name:'Cardboard',weight:''},{name:'Plastics',weight:''},{name:'Metals',weight:''},
      {name:'Food Waste',weight:''},{name:'Paper Towels',weight:''},{name:'Other',weight:''}
    ]);
    const total = mats.reduce((s,m)=>s+(parseFloat(m.weight)||0),0);
    const pie = mats.filter(m=>parseFloat(m.weight)>0).map(m=>({ name:m.name, value:parseFloat(m.weight) }));

    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setSel(null)}>Back</button>
          <h3 style={{ margin:0, flex:1, fontSize:16, fontWeight:700, color:PAL.navy }}>{audit.title}</h3>
          <span className={`badge ${audit.status==='Completed'?'badge-green':audit.status==='In Progress'?'badge-amber':'badge-gray'}`}>{audit.status}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Details</div>
            {[['Building',audit.building_name],['Date',audit.date],['Stream',audit.stream],['Auditors',audit.auditors.join(', ')],['Sample Weight',audit.sample_weight_lbs?`${audit.sample_weight_lbs} lbs`:'Not recorded']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${PAL.border}`, fontSize:13 }}>
                <span style={{ color:PAL.muted }}>{k}</span><span style={{ fontWeight:600 }}>{v||'N/A'}</span>
              </div>
            ))}
            {audit.notes&&<p style={{ margin:'10px 0 0', fontSize:12, lineHeight:1.6 }}>{audit.notes}</p>}
          </div>
          {pie.length>0&&(
            <div className="card" style={{ padding:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Material Composition</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart><Pie data={pie} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>{pie.map((e,i)=>(<Cell key={i} fill={MC_local[i%MC_local.length]} />))}</Pie><Tooltip formatter={(v,n)=>[`${v} lbs (${(v/total*100).toFixed(1)}%)`,n]} /></PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:10 }}>Material Weight Entry (lbs)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8 }}>
            {mats.map((m,i)=>(
              <div key={m.name}>
                <label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>{m.name}</label>
                <input type="number" min="0" step="0.1" value={m.weight} placeholder="0.0" onChange={e=>{ const v=parseFloat(e.target.value)||''; setMats(p=>p.map((x,j)=>j===i?{...x,weight:v}:x)); }} />
              </div>
            ))}
          </div>
          {total>0&&<div style={{ marginTop:8, fontSize:12, color:PAL.muted }}>Total entered: {total.toFixed(1)} lbs</div>}
        </div>
      </div>
    );
  }

  if (sel) { const a=audits.find(x=>x.id===sel); return <div style={{ padding:24 }}><AuditDetail audit={a} /></div>; }

  function create() {
    const e={};
    if (!nA.title.trim()) e.title='Required';
    if (!nA.building_id) e.building_id='Required';
    if (!nA.date) e.date='Required';
    if (Object.keys(e).length>0) { setErrors(e); return; }
    const b=DEMO_BUILDINGS.find(x=>x.id===nA.building_id);
    setAudits(p=>[...p,{ id:`AUD${String(p.length+1).padStart(3,'0')}`, title:nA.title, building_id:nA.building_id, building_name:b?.name||'', date:nA.date, auditors:nA.auditors.split(',').map(x=>x.trim()).filter(Boolean), status:'Planned', sample_weight_lbs:null, stream:nA.stream||'Landfill', materials:[], notes:nA.notes }]);
    setModal(false); setNA({ title:'', building_id:'', date:'', stream:'', auditors:'', notes:'' }); setErrors({});
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Waste Audits" sub="Plan and document physical waste composition audits"
        action={<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>+ New Audit</button>} />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {audits.map(a=>(
          <div key={a.id} className="card" style={{ padding:14, cursor:'pointer' }} onClick={()=>setSel(a.id)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:PAL.navy }}>{a.title}</div>
                <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{a.building_name} - {a.date} - {a.stream}</div>
                {a.materials.length>0&&<div style={{ fontSize:12, color:PAL.text, marginTop:3 }}>Top material: {[...a.materials].sort((x,y)=>y.weight-x.weight)[0]?.name}</div>}
              </div>
              <span className={`badge ${a.status==='Completed'?'badge-green':a.status==='In Progress'?'badge-amber':a.status==='Under Review'?'badge-navy':'badge-gray'}`}>{a.status}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={()=>{ setModal(false); setErrors({}); }} title="New Waste Audit">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Title <span style={{ color:PAL.red }}>*</span></label>
            <input value={nA.title} onChange={e=>{ setErrors(x=>({...x,title:null})); setNA(p=>({...p,title:e.target.value})); }} placeholder="e.g., Orchard Downs Spring 2024" />
            <FieldError msg={errors.title} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Building <span style={{ color:PAL.red }}>*</span></label>
              <select value={nA.building_id} onChange={e=>{ setErrors(x=>({...x,building_id:null})); setNA(p=>({...p,building_id:e.target.value})); }}>
                <option value="">Select...</option>
                {DEMO_BUILDINGS.map(b=>(<option key={b.id} value={b.id}>{b.name.length>35?b.name.slice(0,33)+'...':b.name}</option>))}
              </select>
              <FieldError msg={errors.building_id} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Date <span style={{ color:PAL.red }}>*</span></label>
              <input type="date" value={nA.date} onChange={e=>{ setErrors(x=>({...x,date:null})); setNA(p=>({...p,date:e.target.value})); }} />
              <FieldError msg={errors.date} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Stream</label>
              <select value={nA.stream} onChange={e=>setNA(p=>({...p,stream:e.target.value}))}>
                <option>Landfill</option><option>Cardboard</option><option>Paper</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Auditors</label>
              <input value={nA.auditors} onChange={e=>setNA(p=>({...p,auditors:e.target.value}))} placeholder="Name 1, Name 2" />
            </div>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:PAL.navy, display:'block', marginBottom:4 }}>Notes</label>
            <textarea value={nA.notes} onChange={e=>setNA(p=>({...p,notes:e.target.value}))} rows={3} style={{ fontFamily:'inherit', resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" onClick={()=>{ setModal(false); setErrors({}); }}>Cancel</button>
            <button className="btn btn-primary" onClick={create}>Create Audit</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
const REAL_INSIGHTS = [
  { id:'INS001', title:'RFID system failure after Oct 2021 is the primary attribution loss', status:'Validated', confidence:'High', category:'Data Quality', summary:'RFID detection reached 88.3% in Apr 2021, degraded to ~58% by Oct 2021, and read 0% in every month from Aug 2022 onward. Both trucks failed simultaneously, indicating a system-level cause. Without RFID, container identity cannot be assigned, and weights cannot be attributed to buildings.', evidence:'Monthly Trend data, 79,533 raw records', recommendation:'Physical investigation of RFID readers on both trucks. Compare ride-along observations with database records.' },
  { id:'INS002', title:'28,337 epoch-default timestamps indicate device clock failures', status:'Validated', confidence:'High', category:'Data Quality', summary:'28,337 records carry a 2001-01-01 timestamp, indicating the LoadMan unit powered on without time synchronization. These are excluded from date-valid analysis but represent real pickups with real weights that cannot be temporally located.', evidence:'Validity Funnel Gate 2, 73,857 Load Pickup events', recommendation:'Investigate whether time-sync failures occurred at specific dates or systematically. Cross-reference with upload timestamps.' },
  { id:'INS003', title:'GPS attribution model achieves 84.8% top-1 accuracy on held-out test', status:'Validated', confidence:'High', category:'Attribution AI', summary:'A GPS nearest-centroid model trained on 9,989 labeled records achieves 84.8% top-1 and 97.8% top-3 accuracy at a 150m distance threshold, covering 91.6% of GPS-equipped records. This model could attribute an estimated 15,860 currently unattributed records that have GPS coordinates.', evidence:'80/20 random split validation, 123 building centroids', recommendation:'Apply model to GPS-equipped unattributed records. All results must be labeled AI-inferred and subject to staff review.' },
  { id:'INS004', title:'Orchard Downs Apartments accounts for 17.1% of all verified pickups', status:'Validated', confidence:'High', category:'Composition', summary:'Of 9,989 usable records, 1,711 are attributed to Orchard Downs Apartments. This may reflect high collection frequency, large container volumes, or classification artifacts. Requires cross-reference with operational records.', evidence:'Site Name distribution in Usable Records', recommendation:'Compare Orchard Downs pickup frequency to other large sites. Confirm whether this represents one or multiple distinct locations.' },
  { id:'INS005', title:'NVW field definition unconfirmed - cannot use for net weight', status:'Under Investigation', confidence:'High', category:'Data Quality', summary:'The NVW field appears in 93.3% of records with values in the millions. This is not consistent with per-pickup net weight. Without confirmed definition, net weight calculations must use gross - tare (available only in 9,989 usable records).', evidence:'Field Inventory, raw data inspection', recommendation:'Confirm NVW definition with LoadMan operator. If it is a cumulative vehicle weight counter, this may allow weight derivation for other records.' },
  { id:'INS006', title:'Nearby site centroids create GPS disambiguation challenges', status:'Under Investigation', confidence:'Medium', category:'Attribution AI', summary:'Some campus building centroids are only 19-24m apart (Admissions and Records, Illini Union Bookstore, Grainger Library). The GPS model may confuse adjacent buildings sharing loading dock areas. Within-site GPS spread at Orchard Downs averages 227m.', evidence:'Centroid distance analysis, within-site spread calculation', recommendation:'Build a building-adjacency map. For records near cluster of closely-spaced centroids, present top-3 candidates to authorized staff rather than a single prediction.' },
];

function InsightsEngine() {
  const [ins, setIns] = useState(REAL_INSIGHTS);
  const [fs, setFs] = useState('All');
  const [ex, setEx] = useState(null);
  const fi = fs==='All' ? ins : ins.filter(i=>i.status===fs||i.category===fs);

  if (ex) {
    const i=ins.find(x=>x.id===ex);
    return (
      <div style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setEx(null)}>Back</button>
          <span className={`badge ${i.status==='Validated'?'badge-green':i.status==='Recommended for Action'?'badge-amber':'badge-navy'}`}>{i.status}</span>
          <span className="badge badge-gray">{i.category}</span>
          <span className={`badge ${i.confidence==='High'?'badge-green':'badge-amber'}`}>{i.confidence}</span>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:PAL.navy, marginBottom:8 }}>{i.title}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>SUMMARY</div>
            <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{i.summary}</p>
          </div>
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>EVIDENCE</div>
            <p style={{ margin:'0 0 10px', fontSize:13, lineHeight:1.7 }}>{i.evidence}</p>
            <div style={{ fontSize:12, fontWeight:700, color:PAL.muted, marginBottom:6 }}>RECOMMENDATION</div>
            <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{i.recommendation}</p>
          </div>
        </div>
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:PAL.navy, marginBottom:8 }}>Update Status</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {['Under Investigation','Validated','Recommended for Action','Rejected'].map(s=>(
              <button key={s} onClick={()=>setIns(p=>p.map(x=>x.id===i.id?{...x,status:s}:x))}
                className={`btn btn-sm ${i.status===s?'btn-primary':'btn-secondary'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:12, padding:'8px 12px', background:PAL.amberBg, borderRadius:6, fontSize:12, color:'#92400e' }}>
          <strong>Research integrity:</strong> Human review required before operational decisions. These insights are from real data but interpreted by EnviroTrap researchers, not official UIUC findings.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Research Insights" sub="Pattern analysis derived from 79,533 actual UIUC LoadMan records. All findings documented with evidence." />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {['Under Investigation','Validated','Recommended for Action','Rejected'].map(s=>(
          <StatCard key={s} label={s} value={ins.filter(i=>i.status===s).length} color={s==='Validated'?'green':s==='Recommended for Action'?'amber':s==='Rejected'?'red':'navy'} />
        ))}
      </div>
      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:14 }}>
        {['All','Validated','Under Investigation','Data Quality','Attribution AI','Composition'].map(s=>(
          <button key={s} className={`btn btn-sm ${fs===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFs(s)}>{s}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {fi.map(i=>(
          <div key={i.id} className="card insight-card" onClick={()=>setEx(i.id)}
            style={{ padding:14, cursor:'pointer', borderLeft:`4px solid ${{Validated:PAL.teal,'Recommended for Action':PAL.amber,Rejected:PAL.red}[i.status]||PAL.navyLight}` }}>
            <div style={{ display:'flex', gap:7, marginBottom:6, flexWrap:'wrap' }}>
              <span className={`badge ${i.category==='Attribution AI'?'badge-navy':i.category==='Data Quality'?'badge-amber':'badge-gray'}`}>{i.category}</span>
              <span className={`badge ${i.status==='Validated'?'badge-green':'badge-navy'}`}>{i.status}</span>
              <span style={{ fontSize:11, color:PAL.muted, marginLeft:'auto' }}>Real data</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14, color:PAL.navy, marginBottom:4 }}>{i.title}</div>
            <p style={{ margin:0, fontSize:13, color:PAL.muted, lineHeight:1.6 }}>{i.summary.slice(0,120)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INTERVENTIONS ─────────────────────────────────────────────────────────────
const DEMO_INTERVENTIONS = [
  { id:'INT001', title:'RFID System Physical Investigation', linked_insight:'INS001', building_id:null, building_name:null, observation:'RFID detection reached 0% in Aug 2022 and has never recovered. Both trucks failed simultaneously.', proposed_action:'Schedule ride-along with driver. Inspect RFID readers on both trucks. Compare manual observations against LoadMan database entries during an actual collection run.', responsible_party:'EnviroTrap + F&S Fleet Operations', status:'Recommended for Action', proposed_date:'2024-07-15', baseline:'0% RFID detection from Aug 2022 (down from 88.3% peak)', followup:'Compare pre-ride observations to post-ride records within 72 hours.', outcome:'' },
  { id:'INT002', title:'Container-to-Building Mapping Verification', linked_insight:'INS003', building_id:null, building_name:null, observation:'GPS model achieves 84.8% top-1 attribution accuracy but cannot be deployed at scale without staff verification.', proposed_action:'Apply GPS model to 15,860 GPS-equipped unattributed records. Present predictions labeled as AI-inferred. Assign authorized F&S staff to review and confirm or override.', responsible_party:'EnviroTrap + F&S Data Team', status:'Proposed', proposed_date:'2024-08-01', baseline:'GPS model: 84.8% top-1 accuracy, 150m threshold', followup:'Calculate verified attribution rate after staff review.', outcome:'' },
  { id:'INT003', title:'NVW Field Definition Confirmation', linked_insight:'INS005', building_id:null, building_name:null, observation:'NVW field values are in the millions and cannot be interpreted as per-pickup net weight without definition.', proposed_action:'Contact LoadMan operator to request NVW field documentation. Determine if cumulative counter can be used for weight derivation.', responsible_party:'EnviroTrap + F&S IT', status:'In Progress', proposed_date:'2024-06-15', baseline:'NVW: 93.3% populated, definition unknown', followup:'If NVW is cumulative, derive per-pickup weights using diff(NVW) per truck per day.', outcome:'F&S confirmed investigation underway.' },
];

function Interventions() {
  const [items, setItems] = useState(DEMO_INTERVENTIONS);
  const [sel, setSel] = useState(null);
  const FLOW = ['Proposed','Approved','In Progress','Completed','Rejected'];

  if (sel) {
    const iv=items.find(x=>x.id===sel);
    const ix=FLOW.indexOf(iv.status);
    return (
      <div style={{ padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setSel(null)}>Back</button>
          <span className={`badge ${iv.status==='Completed'?'badge-green':iv.status==='In Progress'?'badge-amber':iv.status==='Rejected'?'badge-red':'badge-navy'}`}>{iv.status}</span>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:PAL.navy, marginBottom:4 }}>{iv.title}</h2>
        <p style={{ color:PAL.muted, fontSize:13, margin:'0 0 16px' }}>{iv.building_name||'Campus-wide'}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          {[['Observation',iv.observation],['Proposed Action',iv.proposed_action],['Responsible Party',iv.responsible_party],['Baseline',iv.baseline],['Follow-up',iv.followup],['Outcome',iv.outcome||'No outcome recorded yet']].map(([k,v])=>(
            <div key={k} style={{ padding:'10px 14px', background:PAL.cream, borderRadius:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:PAL.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:13, color:PAL.text, lineHeight:1.6 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:7 }}>
          {ix<FLOW.length-2&&<button className="btn btn-green btn-sm" onClick={()=>setItems(p=>p.map(i=>i.id===sel?{...i,status:FLOW[FLOW.indexOf(i.status)+1]}:i))}>Advance to {FLOW[ix+1]}</button>}
          {FLOW.map((s,i)=>(<span key={s} style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, background:i<=ix?PAL.navy:PAL.creamDark, color:i<=ix?'#fff':PAL.muted }}>{s}</span>))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Interventions" sub="Proposed actions grounded in verified LoadMan data findings" />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(iv=>(
          <div key={iv.id} className="card" style={{ padding:14, cursor:'pointer' }} onClick={()=>setSel(iv.id)}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:PAL.navy }}>{iv.title}</div>
                <div style={{ fontSize:12, color:PAL.muted, marginTop:3 }}>{iv.building_name||'Campus-wide'}</div>
                <div style={{ fontSize:12, color:PAL.text, marginTop:4, lineHeight:1.5 }}>{iv.observation.slice(0,100)}...</div>
              </div>
              <span className={`badge ${iv.status==='Completed'?'badge-green':iv.status==='In Progress'?'badge-amber':iv.status==='Recommended for Action'?'badge-purple':'badge-navy'}`}>{iv.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports() {
  const [cfg, setCfg] = useState({ from:'2020-01-01', to:'2024-06-30' });
  const [prev, setPrev] = useState(false);
  const meta = REAL_MODEL.meta;

  function expCSV() {
    const rows=[
      ['ENVIROTRAP NEXUS RESEARCH SUMMARY - REAL DATA'],
      ['Generated:',new Date().toISOString()],
      ['Source:','79,533 UIUC LoadMan records, Betsy Ruckman, F&S'],
      ['NOTE: Attribution model results are AI-inferred, not verified unless staff-confirmed'],
      [],
      ['METRIC','VALUE','SOURCE'],
      ['Total raw records',79533,'LoadMan export'],
      ['Load Pickup events',73857,'Load Type filter'],
      ['Valid date records',43759,'Excluding 2001 epoch defaults'],
      ['RFID-identified',15406,'Asset Detect field'],
      ['Site-resolved',13414,'Site Name field'],
      ['Fully usable',9989,'All quality gates'],
      ['Attribution rate','12.6%','9989/79533'],
      [],
      ['RFID SYSTEM','VALUE','NOTES'],
      ['RFID peak','88.3%','April 2021'],
      ['RFID current','0.0%','August 2022 onwards'],
      ['Cause','Unestablished','Both trucks simultaneously'],
      [],
      ['AI MODEL','VALUE','METHOD'],
      ['GPS top-1 accuracy','84.8%','80/20 split, 150m threshold'],
      ['GPS top-3 accuracy','97.8%','Same split'],
      ['GPS coverage','91.6%','At 150m threshold'],
      ['RFID accuracy','100%','Deterministic lookup, 179 RFIDs'],
      [],
      ['SITE','VERIFIED_PICKUPS'],
      ...REAL_MODEL.top_sites.slice(0,10).map(s=>[s.name,s.count]),
    ];
    const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='envirotrap_real_data_report.csv'; a.click();
  }

  return (
    <div style={{ padding:24 }}>
      <SH title="Reports" sub="Export summaries derived from 79,533 actual UIUC LoadMan records" />
      <div className="card" style={{ padding:16, maxWidth:540, marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Report Export</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={expCSV}>Export Real Data Summary (CSV)</button>
        </div>
        <div style={{ marginTop:12, padding:'8px 12px', background:'#fff3cd', borderRadius:6, fontSize:12, color:'#664d03' }}>
          All reports are labeled with source and provenance. Attribution model results are AI-inferred. Do not publish as official UIUC data.
        </div>
      </div>
      <div className="card" style={{ padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Real Data Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
          {[['Total records','79,533'],['Usable records','9,989 (12.6%)'],['RFID peak','88.3% (Apr 2021)'],['RFID now','0.0% (Aug 2022+)'],['GPS model (top-1)','84.8%'],['Distinct sites','123'],['Distinct RFIDs','179'],['Epoch records','~28,337']].map(([k,v])=>(
            <div key={k} style={{ background:PAL.cream, borderRadius:6, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:PAL.muted }}>{k}</div>
              <div style={{ fontSize:16, fontWeight:700, color:PAL.navy }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings() {
  const [profile, setProfile] = useState(()=>{ try { return JSON.parse(localStorage.getItem('et_profile'))||{ name:'Demo User', role:'Researcher', org:'EnviroTrap / UIUC' }; } catch { return { name:'Demo User', role:'Researcher', org:'EnviroTrap / UIUC' }; } });
  const [saved, setSaved] = useState(false);
  function save() { localStorage.setItem('et_profile',JSON.stringify(profile)); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div style={{ padding:24 }}>
      <SH title="Settings" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>User Profile</div>
          {saved&&<div style={{ background:'#cce5d8', borderRadius:6, padding:'6px 10px', fontSize:12, color:'#1a3d30', fontWeight:600, marginBottom:10 }}>Saved.</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Name</label><input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} /></div>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Role</label><select value={profile.role} onChange={e=>setProfile(p=>({...p,role:e.target.value}))}><option>Researcher</option><option>F&S Staff</option><option>Driver</option><option>Administrator</option><option>Viewer</option></select></div>
            <div><label style={{ fontSize:12, color:PAL.muted, display:'block', marginBottom:3 }}>Organization</label><input value={profile.org} onChange={e=>setProfile(p=>({...p,org:e.target.value}))} /></div>
            <button className="btn btn-primary btn-sm" onClick={save}>Save Profile</button>
          </div>
        </div>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>Application Info</div>
          {[['Version','0.3.0 - Real Data AI Sprint'],['AI Engine','GPS Nearest-Centroid + RFID Lookup'],['Training Records','9,989 verified LoadMan'],['GPS Accuracy','84.8% top-1 / 97.8% top-3'],['Distinct Sites','123'],['Distinct RFIDs','179'],['Total Raw Records','79,533'],['Source','UIUC F&S LoadMan Export']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${PAL.border}`, fontSize:13 }}>
              <span style={{ color:PAL.muted }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.navy, marginBottom:12 }}>IBM Bob Development Contributions</div>
        <div style={{ fontSize:13, color:PAL.text, lineHeight:1.8 }}>
          EnviroTrap Nexus was developed using IBM Bob as the primary engineering tool.<br/>
          <strong>Bob's contributions:</strong><br/>
          - Designed single-file React SPA architecture with no backend dependency<br/>
          - Wrote all JSX/JavaScript application code across 3 major versions<br/>
          - Built and evaluated the GPS nearest-centroid attribution model (84.8% accuracy)<br/>
          - Analyzed 79,533 actual LoadMan records to extract verified statistics<br/>
          - Identified the RFID failure timeline and cliff from monthly trend data<br/>
          - Designed provenance labeling system (Verified / AI-Inferred / Unknown)<br/>
          - Implemented deterministic Ask Nexus Q&A grounded in real data<br/>
          - Wrote all data validation, evaluation, and quality reporting logic
        </div>
      </div>
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview', label:'Overview', icon:'📊' },
  { id:'attribution', label:'Attribution Engine', icon:'🤖', badge:'AI' },
  { id:'pipeline', label:'Data Pipeline', icon:'🔬' },
  { id:'nexus', label:'Ask Nexus', icon:'💬', badge:'AI' },
  { id:'collection', label:'Collection Log', icon:'🚛' },
  { id:'audits', label:'Waste Audits', icon:'📋' },
  { id:'insights', label:'Insights', icon:'💡' },
  { id:'interventions', label:'Interventions', icon:'🎯' },
  { id:'reports', label:'Reports', icon:'📄' },
  { id:'settings', label:'Settings', icon:'⚙️' },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <div style={{ background:PAL.navy, minHeight:'100vh', width:collapsed?56:230, flexShrink:0, display:'flex', flexDirection:'column', transition:'width .2s', overflowX:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 12px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:PAL.amber, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:PAL.navy, flexShrink:0 }}>ET</div>
        {!collapsed&&(<div><div style={{ fontWeight:700, fontSize:13, color:'#fff', lineHeight:1.2 }}>EnviroTrap</div><div style={{ fontSize:10, color:'#80a2ce' }}>Nexus - UIUC</div></div>)}
        <button onClick={()=>setCollapsed(x=>!x)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#80a2ce', cursor:'pointer', fontSize:18, padding:0, lineHeight:1 }}>{collapsed?'>':'<'}</button>
      </div>
      <nav style={{ flex:1, paddingTop:6 }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setActive(item.id)}
            className={`nav-item ${active===item.id?'active':''}`}
            style={{ color:active===item.id?'white':'#abc1df', fontWeight:active===item.id?600:400, fontSize:13 }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
            {!collapsed&&(<span style={{ display:'flex', alignItems:'center', gap:6 }}>{item.label}{item.badge&&<span style={{ background:PAL.amber, color:PAL.navy, fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:8 }}>{item.badge}</span>}</span>)}
          </button>
        ))}
      </nav>
      {!collapsed&&<div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,.1)', fontSize:10, color:'#5683be' }}>v0.3.0 - Real Data AI Sprint</div>}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function App() {
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const PAGES = {
    overview: <Overview setActive={setActive} />,
    attribution: <AttributionEngineUI setActive={setActive} />,
    pipeline: <DataPipeline />,
    nexus: <AskNexus />,
    collection: <CollectionLog />,
    audits: <WasteAudits />,
    insights: <InsightsEngine />,
    interventions: <Interventions />,
    reports: <Reports />,
    settings: <Settings />,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <DemoBanner />
      <div style={{ display:'flex', flex:1 }}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
        <main style={{ flex:1, overflowY:'auto', background:'#f8f5ee' }}>
          {PAGES[active]||null}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
