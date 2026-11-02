// All content lives here. Every name, club, number and story below is a placeholder:
// swap in your own squad, artists and copy before publishing.

export const BRAND = {
  name: 'LOKER',
  event: 'GARUDA 2026',
  cup: 'Regional Cup 2026',
  title: 'Champions',
  tagline: 'A tribute in 23 shirts, 24 posters and one trophy',
  instagram: '#',
  behance: '#',
};

export const POS = {
  GK: { short: 'GK', long: 'Goalkeeper', group: 'Goalkeepers' },
  DEF: { short: 'DEF', long: 'Defender', group: 'Defenders' },
  MID: { short: 'MID', long: 'Midfielder', group: 'Midfielders' },
  FWD: { short: 'FWD', long: 'Forward', group: 'Forwards' },
};

// The cup run (fictional opponents)
export const RUN = [
  { vs: 'LUM', name: 'Lumora', date: '25 Sep', score: '2–0', stage: 'Group' },
  { vs: 'KES', name: 'Kesta', date: '28 Sep', score: '1–1', stage: 'Group' },
  { vs: 'TIR', name: 'Tirai', date: '02 Oct', score: '4–1', stage: 'Group' },
  { vs: 'VAR', name: 'Varunda', date: '08 Oct', score: '2–1', stage: 'Semi' },
  { vs: 'SOL', name: 'Solen', date: '11 Oct', score: '1–0', stage: 'Semi' },
  { vs: 'ARK', name: 'Arkan', date: '18 Oct', score: '2–2 (5–4p)', stage: 'Final' },
];

const P = (no, first, last, pos, club, born, place, h, caps, goals, mins, story) => ({
  no, first, last, name: `${first} ${last}`, pos, club, born, place, height: h, caps, goals, mins, story,
});

// mins: minutes played in each RUN match (0 = unused)
export const SQUAD = [
  P(1, 'Arya', 'Wicaksana', 'GK', 'Rajawali United', '04 Feb 1996', 'Bandung', 191, 41, 0, [90, 90, 0, 90, 90, 120], 'Kept goal through the whole knockout run and saved two in the final shoot-out.'),
  P(12, 'Bima', 'Prasetyo', 'GK', 'Persada FC', '19 Jul 1999', 'Surabaya', 189, 9, 0, [0, 0, 90, 0, 0, 0], 'Stepped in for the third group game and kept the dressing room loud all month.'),
  P(13, 'Dimas', 'Santoso', 'GK', 'Bintang Timur', '30 Nov 2002', 'Malang', 193, 2, 0, [0, 0, 0, 0, 0, 0], 'The youngest keeper in camp, first call-up, first medal.'),
  P(2, 'Rangga', 'Putra', 'DEF', 'Samudra FC', '12 Mar 1997', 'Medan', 182, 33, 1, [90, 90, 45, 90, 90, 120], 'Overlapping full-back whose late header sealed the opening win.'),
  P(3, 'Fajar', 'Nugroho', 'DEF', 'Nusantara SC', '08 Aug 1995', 'Semarang', 186, 52, 2, [90, 90, 0, 90, 90, 120], 'Captain on the pitch, organiser at the back, last man to leave training.'),
  P(4, 'Galih', 'Ramadhan', 'DEF', 'Merapi Athletic', '21 Jan 1998', 'Yogyakarta', 188, 27, 0, [90, 0, 90, 90, 90, 120], 'Won every aerial duel in the semi-final second leg.'),
  P(5, 'Yoga', 'Saputra', 'DEF', 'Rajawali United', '02 Jun 2000', 'Makassar', 184, 18, 0, [0, 90, 90, 0, 0, 0], 'Rotated in for the group stage and never put a foot wrong.'),
  P(6, 'Hendra', 'Kusuma', 'DEF', 'Persada FC', '17 Oct 1994', 'Palembang', 180, 60, 1, [90, 90, 0, 90, 90, 104], 'The most capped player in the squad, cramped off in extra time of the final.'),
  P(14, 'Ilham', 'Maulana', 'DEF', 'Garuda Muda', '25 Dec 2001', 'Padang', 179, 11, 0, [0, 0, 90, 0, 12, 16], 'Came on to see out the final and scored his penalty.'),
  P(15, 'Rizal', 'Hakim', 'DEF', 'Samudra FC', '06 Apr 1999', 'Pontianak', 183, 14, 0, [0, 0, 90, 0, 0, 0], 'Reliable cover across the back line.'),
  P(20, 'Teguh', 'Wijaya', 'DEF', 'Bintang Timur', '13 Sep 1997', 'Solo', 190, 22, 1, [90, 90, 0, 90, 90, 120], 'Scored from a corner against Varunda; tallest outfield player.'),
  P(21, 'Bayu', 'Firmansyah', 'DEF', 'Nusantara SC', '29 May 2003', 'Denpasar', 177, 6, 0, [0, 0, 0, 0, 0, 0], 'Training-ground standout, ready every single day.'),
  P(22, 'Andika', 'Pratama', 'DEF', 'Merapi Athletic', '15 Feb 1998', 'Balikpapan', 181, 19, 0, [45, 0, 90, 0, 0, 0], 'Left-footed, calm, played wherever he was asked.'),
  P(7, 'Satria', 'Gunawan', 'MID', 'Rajawali United', '11 Nov 1996', 'Jakarta', 172, 44, 6, [90, 90, 60, 90, 90, 120], 'Creative heartbeat; two assists in the semi and the cup-winning cross.'),
  P(8, 'Reza', 'Hidayat', 'MID', 'Persada FC', '03 Mar 1998', 'Bogor', 176, 29, 2, [90, 72, 90, 90, 90, 120], 'Covered more ground than anyone in the final.'),
  P(11, 'Wahyu', 'Setiawan', 'MID', 'Garuda Muda', '22 Jul 2000', 'Cirebon', 170, 15, 3, [70, 90, 90, 25, 30, 45], 'Impact sub with a habit of scoring from distance.'),
  P(16, 'Adit', 'Kurniawan', 'MID', 'Samudra FC', '09 Jan 1999', 'Manado', 178, 20, 1, [0, 18, 90, 0, 0, 0], 'Holding midfielder who shields the back four.'),
  P(17, 'Eko', 'Suryadi', 'MID', 'Bintang Timur', '14 Aug 1995', 'Kediri', 174, 48, 4, [90, 90, 0, 90, 90, 120], 'Set-piece specialist; free kick winner against Solen.'),
  P(18, 'Gilang', 'Mahendra', 'MID', 'Nusantara SC', '27 Apr 2001', 'Jember', 175, 8, 0, [20, 0, 90, 0, 0, 0], 'Tidy, two-footed, a starter in waiting.'),
  P(19, 'Rio', 'Anggara', 'MID', 'Merapi Athletic', '05 Dec 1997', 'Ambon', 173, 26, 2, [0, 0, 30, 65, 60, 75], 'Brought pace off the bench in every knockout game.'),
  P(9, 'Dewa', 'Saputro', 'FWD', 'Rajawali United', '18 Jun 1996', 'Malang', 183, 39, 17, [90, 90, 45, 90, 90, 98], 'Top scorer of the tournament with five goals.'),
  P(10, 'Raka', 'Aditya', 'FWD', 'Persada FC', '01 Oct 1998', 'Surabaya', 179, 35, 12, [90, 90, 90, 90, 90, 120], 'The number ten; scored in the final and the winning penalty.'),
  P(23, 'Johan', 'Siregar', 'FWD', 'Garuda Muda', '20 Mar 2002', 'Medan', 186, 7, 2, [0, 20, 90, 0, 0, 22], 'Target man who scored twice in his first start.'),
];

export const COACH = { name: 'Budi Hartono', role: 'Head coach' };

// 24 fictional illustrators. Each gets an original procedurally drawn poster style.
export const ARTISTS = [
  ['Nara Pertiwi', 'narapertiwi'], ['Kevin Halim', 'kevhalim.draws'], ['Sari Lestari', 'sarilestari.ink'],
  ['Damar Wulan', 'damarwulan'], ['Putri Ayu', 'putriayu.studio'], ['Agus Salim', 'agus.salim.art'],
  ['Laras Sekar', 'larassekar'], ['Tomi Wirawan', 'tomiwirawan'], ['Indah Permata', 'indah.permata'],
  ['Yusuf Akbar', 'yusufakbar.co'], ['Citra Dewi', 'citradewi.png'], ['Bagas Arif', 'bagasarif'],
  ['Mega Utami', 'megautami.ill'], ['Fikri Rahman', 'fikrirahman'], ['Ayu Kirana', 'ayukirana'],
  ['Hadi Susanto', 'hadi.susanto'], ['Rina Marlina', 'rinamarlina.art'], ['Joko Purnomo', 'jokopurnomo'],
  ['Dina Safitri', 'dinasafitri'], ['Arif Budiman', 'arifbudiman.ink'], ['Wulan Sari', 'wulansari.draws'],
  ['Eka Saputra', 'ekasaputra'], ['Lina Hartati', 'linahartati'], ['Rudi Gunadi', 'rudigunadi.studio'],
].map(([name, handle], i) => ({ id: i, name, handle, link: '#' }));

// One poster per player, plus one for the coach (24 total).
export const POSTERS = [
  ...SQUAD.map((p, i) => ({ id: i, kind: 'player', player: p, artist: ARTISTS[i], style: (i * 5 + Math.floor(i / 8) * 3) % 8 })),
  { id: 23, kind: 'coach', player: { no: 0, first: 'Budi', last: 'Hartono', name: COACH.name, pos: 'COACH', club: 'National team', story: 'Built the squad in eighteen months and never stopped smiling on the touchline.' }, artist: ARTISTS[23], style: 6 },
];

// Locker row order: keepers and defence to the left, the cup in the middle, attack to the right.
export function lockerOrder() {
  const by = (n) => SQUAD.find((p) => p.no === n);
  const left = [6, 3, 15, 22, 12, 1, 14, 21, 11, 23, 9].map(by);
  const right = [2, 20, 10, 8, 5, 17, 18, 19, 7, 16, 4, 13].map(by);
  return [
    ...left.map((p) => ({ kind: 'player', player: p })),
    { kind: 'coach', player: POSTERS[23].player },
    { kind: 'cup' },
    ...right.map((p) => ({ kind: 'player', player: p })),
  ];
}

export const posterFor = (no) => POSTERS.find((p) => p.player.no === no && p.kind === 'player');

export const MARQUEE = [
  'Champions of the region',
  '23 shirts · 24 posters · one trophy',
  'A tribute from LOKER & 24 artists',
  'Unofficial fan tribute',
  'Thank you, Garuda',
];

export const MANIFESTO = {
  en: {
    title: 'Why we built a room',
    body: [
      'Some nights deserve more than a highlight reel. When the final whistle went, we wanted somewhere to put the feeling: a place you could walk into, not just scroll past.',
      'So we built a locker room. Every door belongs to a player. Inside: his shirt, a few numbers, and the short story of how he got here.',
      'Then we asked twenty-four illustrators to draw what the run meant to them. No brief beyond the squad list. Twenty-four styles, one shared memory.',
    ],
    pull: 'A room for the win, and a mark of our own.',
    end: 'Walk in, open a door, take a shirt off the rail. Stay as long as you like.',
  },
  id: {
    title: 'Kenapa kami membangun ruangan',
    body: [
      'Ada malam yang layak dikenang lebih dari sekadar cuplikan. Saat peluit akhir berbunyi, kami ingin punya tempat untuk menyimpan rasa itu: tempat yang bisa dimasuki, bukan hanya digulir.',
      'Jadi kami membangun ruang ganti. Setiap pintu milik satu pemain. Di dalamnya: jersey, beberapa angka, dan cerita singkat perjalanannya.',
      'Lalu kami mengajak dua puluh empat ilustrator menggambar arti perjalanan ini bagi mereka. Dua puluh empat gaya, satu kenangan bersama.',
    ],
    pull: 'Ruang untuk kemenangan, dan jejak milik kita.',
    end: 'Masuklah, buka pintunya, ambil jersey dari rak. Tinggallah selama yang kamu mau.',
  },
};
