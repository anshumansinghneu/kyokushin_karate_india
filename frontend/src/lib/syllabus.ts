/*
 * The KKFI belt syllabus: one source for /syllabus, /belt-system and anything else that
 * lists belts or kata. Typical training times are deliberately absent until KKFI confirms
 * them (docs/superpowers/specs/2026-10-19-full-site-redesign-design.md, authenticity ledger).
 */

export interface KataInfo {
    name: string;
    japanese?: string;
    description?: string;
    /** Floor pattern in kata steps (y toward the front), only where it is well documented. */
    embusen?: [number, number][];
}

/** The Taikyoku kata share one I-shaped (工) floor pattern: the bottom bar, up the centre, the top bar, back down. */
const TAIKYOKU_EMBUSEN: [number, number][] = [
    [0, 0], [-1, 0], [1, 0], [0, 0], [0, -2], [-1, -2], [1, -2], [0, -2], [0, 0],
];

export interface SyllabusEntry {
    belt: string;
    color: string;
    bgColor: string;
    borderColor: string;
    overview: string;
    kihon: string[];
    kata: KataInfo[];
    kumite: string[];
    fitness: string[];
    additional: string[];
}

export const SYLLABUS: SyllabusEntry[] = [
    {
        belt: 'White',
        color: 'text-gray-200',
        bgColor: 'bg-white/10',
        borderColor: 'border-gray-300/30',
        overview: 'Foundation of Kyokushin — learn basic stances, strikes, and etiquette.',
        kihon: [
            'Seiken Chudan Tsuki (Middle punch)',
            'Seiken Jodan Tsuki (Upper punch)',
            'Seiken Ago Uchi (Jaw strike)',
            'Shuto Ganmen Uchi (Knife-hand strike)',
            'Mae Geri (Front kick)',
            'Hiza Geri (Knee kick)',
            'Kin Geri (Groin kick)',
        ],
        kata: [
            { name: 'Taikyoku Sono Ichi', japanese: '太極その一', description: 'First basic kata — straight punches in Zenkutsu Dachi', embusen: TAIKYOKU_EMBUSEN },
            { name: 'Taikyoku Sono Ni', japanese: '太極その二', description: 'Second basic kata — upper blocks and punches', embusen: TAIKYOKU_EMBUSEN },
        ],
        kumite: ['Basic 3-step sparring (Sanbon Kumite)', 'Distance and timing basics'],
        fitness: ['50 push-ups', '30 sit-ups', '20 squats', '1-minute plank'],
        additional: ['Dojo etiquette and bowing', 'Japanese counting (Ichi to Ju)', 'Mokuso (meditation basics)', 'Understanding OSU'],
    },
    {
        belt: 'Orange',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        overview: 'Build on basics with combination techniques and first sparring experience.',
        kihon: [
            'All White belt techniques +',
            'Uraken Shomen Ganmen Uchi (Backfist strike)',
            'Shuto Sakotsu Uchi (Collarbone strike)',
            'Yoko Geri (Side kick)',
            'Mawashi Geri (Roundhouse kick)',
            'Chudan Soto Uke (Outside block)',
            'Chudan Uchi Uke (Inside block)',
            'Gedan Barai (Low sweep block)',
        ],
        kata: [
            { name: 'Taikyoku Sono San', japanese: '太極その三', description: 'Third basic kata — inside blocks', embusen: TAIKYOKU_EMBUSEN },
            { name: 'Pinan Sono Ichi', japanese: 'ピナンその一', description: 'First Pinan kata — introduces turning and combinations' },
        ],
        kumite: ['5-step sparring', 'Introduction to free sparring (Jiyu Kumite)', 'Basic combinations'],
        fitness: ['70 push-ups', '50 sit-ups', '30 squats', '2-minute plank'],
        additional: ['History of Mas Oyama', 'Kyokushin Kaikan meaning', 'Basic Japanese terminology'],
    },
    {
        belt: 'Blue',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        overview: 'Develop kicking power and begin advanced kata patterns.',
        kihon: [
            'All previous techniques +',
            'Ushiro Geri (Back kick)',
            'Jodan Mawashi Geri (High roundhouse)',
            'Shuto Jodan Uke (Knife-hand upper block)',
            'Morote Tsuki (Double punch)',
            'Tobi Mae Geri (Jumping front kick)',
        ],
        kata: [
            { name: 'Pinan Sono Ni', japanese: 'ピナンその二', description: 'Second Pinan — more complex stance transitions' },
            { name: 'Pinan Sono San', japanese: 'ピナンその三', description: 'Third Pinan — introduces elbow strikes' },
            { name: 'Sanchin', japanese: '三戦', description: 'Breathing kata — develops internal power and rooting' },
        ],
        kumite: ['Free sparring (1 round)', 'Combination counters', 'Distance management'],
        fitness: ['80 push-ups', '60 sit-ups', '40 squats', '3 x 1-min plank'],
        additional: ['Dojo Kun (Training oath)', 'Basic tournament rules'],
    },
    {
        belt: 'Yellow',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        overview: 'Intermediate level — refine technique and develop fighting strategy.',
        kihon: [
            'All previous techniques +',
            'Ura Mawashi Geri (Reverse roundhouse)',
            'Kakato Geri (Axe kick)',
            'Chudan Morote Uke (Augmented block)',
            'Gyaku Tsuki combinations',
        ],
        kata: [
            { name: 'Pinan Sono Yon', japanese: 'ピナンその四', description: 'Fourth Pinan — open-hand techniques' },
            { name: 'Pinan Sono Go', japanese: 'ピナンその五', description: 'Fifth Pinan — jumping techniques' },
        ],
        kumite: ['Free sparring (2 rounds)', 'Counter-attack strategies', 'Clinch techniques'],
        fitness: ['100 push-ups', '80 sit-ups', '50 squats', '5-minute plank'],
        additional: ['Judging criteria awareness', 'Senpai/Kohai etiquette', 'Understanding Zanshin'],
    },
    {
        belt: 'Green',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        overview: 'Advanced intermediate — demonstrate power, precision, and fighting spirit.',
        kihon: [
            'All previous techniques +',
            'Tobi Yoko Geri (Jumping side kick)',
            'Tobi Mawashi Geri (Jumping roundhouse)',
            'Ushiro Mawashi Geri (Spinning hook kick)',
            'Advanced combination sequences',
        ],
        kata: [
            { name: 'Gekisai Dai', japanese: '撃砕大', description: 'Attack and destroy — powerful techniques' },
            { name: 'Yantsu', japanese: 'ヤンツー', description: 'Balance and stability focus' },
        ],
        kumite: ['3-round free sparring', 'Multiple opponent defense concepts', 'Tournament-level sparring'],
        fitness: ['100+ push-ups', '100 sit-ups', '60 squats', 'Running 3km'],
        additional: ['Teaching basics to juniors', 'Tameshiwari (board breaking) intro'],
    },
    {
        belt: 'Brown',
        color: 'text-amber-600',
        bgColor: 'bg-amber-700/10',
        borderColor: 'border-amber-600/30',
        overview: 'Pre-black belt — master all fundamentals and develop leadership.',
        kihon: [
            'All techniques with full power and precision',
            'Complex combination sequences (10+ move chains)',
            'Both side execution of all techniques',
        ],
        kata: [
            { name: 'Tsuki No Kata', japanese: '突きの型', description: 'Punching kata — rapid technique execution' },
            { name: 'Tensho', japanese: '転掌', description: 'Rotating palms — soft/hard contrast' },
            { name: 'Saifa', japanese: '砕破', description: 'Destroy and defeat — close-range combat' },
        ],
        kumite: ['5-round sparring', 'Continuous sparring against fresh opponents', 'Self-defense scenarios'],
        fitness: ['150 push-ups', '100 sit-ups', '100 squats', 'Running 5km'],
        additional: ['Tameshiwari (breaking boards/tiles)', 'Referee qualifications', 'Teaching certification fundamentals'],
    },
    {
        belt: 'Black',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        overview: 'Shodan — the true beginning. Mastery of all fundamentals and fighting spirit.',
        kihon: [
            'Perfect execution of all Kyokushin techniques',
            'Demonstration of power, speed, and accuracy',
            'Teaching ability for all levels',
        ],
        kata: [
            { name: 'Kanku Dai', japanese: '観空大', description: 'Looking at the sky — the most important Kyokushin kata' },
            { name: 'Garyu', japanese: '臥竜', description: 'Reclining dragon — ground techniques' },
            { name: 'Seienchin', japanese: '征遠鎮', description: 'Control and calm in the storm' },
        ],
        kumite: ['Consecutive full-contact fights at the grading', 'Full-contact tournament experience'],
        fitness: ['200 push-ups', '150 sit-ups', '150 squats', 'Running 10km'],
        additional: ['Written exam on Kyokushin history and philosophy', 'Tameshiwari demonstration', 'Spirit of OSU — perseverance essay'],
    },
];
