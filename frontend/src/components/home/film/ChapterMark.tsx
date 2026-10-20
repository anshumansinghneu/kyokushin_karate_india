/**
 * A chapter's mark at the right edge: its numeral and kanji set vertically in
 * Mincho, like a hanging scroll, with the English name small beneath.
 */
export default function ChapterMark({ numeral, kanji, name }: { numeral: string; kanji: string; name: string }) {
    return (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5 md:right-10">
            <span aria-hidden="true" lang="ja" className="font-mincho text-[2.441rem] font-extrabold leading-none text-canvas [writing-mode:vertical-rl] md:text-[3.052rem]">
                {numeral}
            </span>
            <span aria-hidden="true" lang="ja" className="font-mincho text-[1.563rem] font-medium leading-none tracking-[0.25em] text-canvas [writing-mode:vertical-rl] md:text-[1.953rem]">
                {kanji}
            </span>
            <h2 className="font-gothic text-[0.8rem] text-canvas">{name}</h2>
        </div>
    );
}
