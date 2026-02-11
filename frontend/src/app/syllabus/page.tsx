'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronRight, Shield, Award, Swords, Dumbbell, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const BELT_ORDER = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];

interface KataInfo {
    name: string;
    japanese?: string;
    description?: string;
}

interface SyllabusEntry {
    belt: string;
    color: string;
    bgColor: string;
    borderColor: string;
    timeRequired: string;
    overview: string;
    kihon: string[];
    kata: KataInfo[];
    kumite: string[];
    fitness: string[];
    additional: string[];
}

const SYLLABUS: SyllabusEntry[] = [
    {
        belt: 'White',
        color: 'text-gray-200',
        bgColor: 'bg-white/10',
        borderColor: 'border-gray-300/30',
        timeRequired: 'Beginner',
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
            { name: 'Taikyoku Sono Ichi', japanese: '太極その一', description: 'First basic kata — straight punches in Zenkutsu Dachi' },
            { name: 'Taikyoku Sono Ni', japanese: '太極その二', description: 'Second basic kata — upper blocks and punches' },
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
        timeRequired: '3-6 months',
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
            { name: 'Taikyoku Sono San', japanese: '太極その三', description: 'Third basic kata — inside blocks' },
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
        timeRequired: '6-9 months',
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
        timeRequired: '9-12 months',
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
        timeRequired: '1.5-2 years',
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
        timeRequired: '2-3 years',
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
        kumite: ['5-round sparring', 'Continuous sparring (20 opponents)', 'Self-defense scenarios'],
        fitness: ['150 push-ups', '100 sit-ups', '100 squats', 'Running 5km'],
        additional: ['Tameshiwari (breaking boards/tiles)', 'Referee qualifications', 'Teaching certification fundamentals'],
    },
    {
        belt: 'Black',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        timeRequired: '3-5+ years total',
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
        kumite: ['50-man kumite (Hyakunin Kumite path)', '10+ consecutive fights', 'Full-contact tournament experience required'],
        fitness: ['200 push-ups', '150 sit-ups', '150 squats', 'Running 10km'],
        additional: ['Written exam on Kyokushin history and philosophy', 'Tameshiwari demonstration', 'Spirit of OSU — perseverance essay'],
    },
];

const SECTION_ICONS = {
    kihon: Target,
    kata: BookOpen,
    kumite: Swords,
    fitness: Dumbbell,
    additional: Award,
};

export default function SyllabusPage() {
    const [expandedBelt, setExpandedBelt] = useState<string | null>('White');
    const [expandedSection, setExpandedSection] = useState<Record<string, string | null>>({});

    const toggleBelt = (belt: string) => {
        setExpandedBelt(prev => prev === belt ? null : belt);
    };

    const toggleSection = (belt: string, section: string) => {
        setExpandedSection(prev => ({
            ...prev,
            [belt]: prev[belt] === section ? null : section,
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
                <div className="max-w-5xl mx-auto px-4 py-20 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                            <BookOpen className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Training Curriculum</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight">Belt Syllabus</h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Your complete guide to the Kyokushin Karate belt progression — from White to Black belt.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Belt Progression Visual */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-12 overflow-x-auto pb-2">
                    {SYLLABUS.map((entry, i) => (
                        <button
                            key={entry.belt}
                            onClick={() => setExpandedBelt(entry.belt)}
                            className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-all ${
                                expandedBelt === entry.belt ? `${entry.bgColor} ${entry.borderColor} border scale-110` : 'hover:bg-white/5'
                            }`}
                        >
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${
                                entry.belt === 'White' ? 'bg-white border-gray-300' :
                                entry.belt === 'Orange' ? 'bg-orange-500 border-orange-600' :
                                entry.belt === 'Blue' ? 'bg-blue-500 border-blue-600' :
                                entry.belt === 'Yellow' ? 'bg-yellow-500 border-yellow-600' :
                                entry.belt === 'Green' ? 'bg-green-500 border-green-600' :
                                entry.belt === 'Brown' ? 'bg-amber-700 border-amber-800' :
                                'bg-black border-red-500'
                            }`} />
                            <span className={`text-[9px] sm:text-[10px] font-bold ${expandedBelt === entry.belt ? entry.color : 'text-gray-500'}`}>
                                {entry.belt}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Syllabus Accordion */}
                <div className="space-y-4">
                    {SYLLABUS.map((entry, beltIndex) => (
                        <motion.div
                            key={entry.belt}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: beltIndex * 0.05 }}
                            className={`rounded-2xl border overflow-hidden transition-all ${
                                expandedBelt === entry.belt ? `${entry.borderColor} ${entry.bgColor}` : 'border-white/5 bg-white/[0.02]'
                            }`}
                        >
                            <button
                                onClick={() => toggleBelt(entry.belt)}
                                className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                                        entry.belt === 'White' ? 'bg-white text-black' :
                                        entry.belt === 'Orange' ? 'bg-orange-500 text-white' :
                                        entry.belt === 'Blue' ? 'bg-blue-500 text-white' :
                                        entry.belt === 'Yellow' ? 'bg-yellow-500 text-white' :
                                        entry.belt === 'Green' ? 'bg-green-500 text-white' :
                                        entry.belt === 'Brown' ? 'bg-amber-700 text-white' :
                                        'bg-black text-red-500 border border-red-500/50'
                                    }`}>
                                        {beltIndex + 1}
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black ${entry.color}`}>{entry.belt} Belt</h3>
                                        <p className="text-xs text-gray-500 font-semibold">{entry.timeRequired} • {entry.kata.length} Kata</p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedBelt === entry.belt ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {expandedBelt === entry.belt && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 sm:px-6 pb-6 space-y-4">
                                            <p className="text-sm text-gray-400 leading-relaxed">{entry.overview}</p>

                                            {(['kihon', 'kata', 'kumite', 'fitness', 'additional'] as const).map(section => {
                                                const Icon = SECTION_ICONS[section];
                                                const items = section === 'kata'
                                                    ? entry.kata.map(k => `${k.name}${k.japanese ? ` (${k.japanese})` : ''}${k.description ? ` — ${k.description}` : ''}`)
                                                    : entry[section];
                                                const isExpanded = expandedSection[entry.belt] === section;
                                                const sectionLabel = section === 'kihon' ? 'Kihon (Basics)' :
                                                    section === 'kata' ? 'Kata (Forms)' :
                                                    section === 'kumite' ? 'Kumite (Sparring)' :
                                                    section === 'fitness' ? 'Fitness Requirements' :
                                                    'Additional';

                                                return (
                                                    <div key={section} className="rounded-xl border border-white/5 overflow-hidden">
                                                        <button
                                                            onClick={() => toggleSection(entry.belt, section)}
                                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Icon className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm font-bold text-white">{sectionLabel}</span>
                                                                <span className="text-[10px] text-gray-500 font-semibold bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                                                            </div>
                                                            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: 'auto' }}
                                                                    exit={{ height: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-4 pb-4 space-y-2">
                                                                        {items.map((item, idx) => (
                                                                            <div key={idx} className="flex items-start gap-2">
                                                                                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                                                                <span className="text-sm text-gray-300">{item}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
