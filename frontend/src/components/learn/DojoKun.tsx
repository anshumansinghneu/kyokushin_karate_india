"use client";

import { useRef } from "react";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

/**
 * The Dojo Kun, the oath recited at the end of training, written by Sosai Oyama
 * with the novelist Eiji Yoshikawa. Japanese and the established English
 * rendering, line for line.
 */
export const DOJO_KUN = [
    { jp: "一、吾々は心身を錬磨し、確固不抜の心技を極めること", en: "We will train our hearts and bodies for a firm, unshaking spirit." },
    { jp: "一、吾々は武の神髄を極め、機に発し、感に敏なること", en: "We will pursue the true meaning of the Martial Way, so that in time our senses may be alert." },
    { jp: "一、吾々は質実剛健を以て、克己の精神を涵養すること", en: "With true vigour, we will seek to cultivate a spirit of self-denial." },
    { jp: "一、吾々は礼節を重んじ、長上を敬し、粗暴の振舞いを慎むこと", en: "We will observe the rules of courtesy, respect our superiors, and refrain from violence." },
    { jp: "一、吾々は神仏を尊び、謙譲の美徳を忘れざること", en: "We will follow our religious principles, and never forget the true virtue of humility." },
    { jp: "一、吾々は知性と体力とを向上させ、事に臨んで過たざること", en: "We will look upwards to wisdom and strength, not seeking other desires." },
    { jp: "一、吾々は生涯の修行を空手の道に通じ、極真の道を全うすること", en: "All our lives, through the discipline of karate, we will seek to fulfil the true meaning of the Kyokushin Way." },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * One line per scroll beat, each landing like a strike (in large, then
 * settling), ending on 押忍. Reduced motion shows the oath as a plain list.
 */
export default function DojoKun() {
    const reduced = useReduced();
    const section = useRef<HTMLElement>(null);
    const lines = useRef<(HTMLLIElement | null)[]>([]);
    const osu = useRef<HTMLSpanElement>(null);

    useScrollProgress(
        section,
        (p) => {
            lines.current.forEach((li, i) => {
                if (!li) return;
                const t = clamp((p - (0.06 + i * 0.11)) / 0.05);
                li.style.opacity = String(0.14 + 0.86 * t);
                li.style.transform = `scale(${1.06 - 0.06 * t})`;
            });
            if (osu.current) osu.current.style.opacity = String(clamp((p - 0.86) / 0.06));
        },
        { enabled: !reduced },
    );

    const list = (
        <ol className="space-y-6 md:space-y-7">
            {DOJO_KUN.map((line, i) => (
                <li
                    key={line.jp}
                    ref={(el) => {
                        lines.current[i] = el;
                    }}
                    className="max-w-[62ch] origin-left pr-16 md:pr-24"
                    style={reduced ? undefined : { opacity: 0.14 }}
                >
                    <p className="font-mincho text-[clamp(1.25rem,2.4vw,1.953rem)] font-extrabold leading-[1.25] text-canvas">{line.en}</p>
                    <p lang="ja" className="mt-1 font-mincho text-sm text-ash md:text-base">{line.jp}</p>
                </li>
            ))}
        </ol>
    );

    const heading = (
        <div>
            <h2 className="font-mincho text-[clamp(2rem,4vw,3.052rem)] font-extrabold leading-[1.1] text-canvas">The Dojo Kun</h2>
            <p className="mt-3 max-w-[52ch] font-gothic text-ash">
                The dojo oath, recited together at the end of training. Written by Sosai Oyama with the novelist Eiji Yoshikawa.
            </p>
        </div>
    );

    if (reduced) {
        return (
            <section aria-labelledby="dojo-kun" className="bg-night px-4 py-24 sm:px-6 lg:px-8">
                <div id="dojo-kun" className="mx-auto max-w-[1400px] space-y-12">
                    {heading}
                    {list}
                </div>
            </section>
        );
    }

    return (
        <section ref={section} aria-label="The Dojo Kun" className="relative bg-night" style={{ height: "320vh" }}>
            <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-4 sm:px-6 lg:px-8">
                <div className="relative mx-auto w-full max-w-[1400px] space-y-8 md:space-y-10">
                    {heading}
                    {list}
                    <span
                        ref={osu}
                        aria-hidden="true"
                        lang="ja"
                        className="absolute right-0 top-1/2 -translate-y-1/2 font-mincho text-[clamp(3.052rem,8vw,7rem)] font-extrabold leading-none text-kyokushin-red [writing-mode:vertical-rl]"
                        style={{ opacity: 0 }}
                    >
                        押忍
                    </span>
                </div>
            </div>
        </section>
    );
}
