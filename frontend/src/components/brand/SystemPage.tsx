import KankuMark from "@/components/KankuMark";

/**
 * The quiet full-screen page for 404, offline and error states, in the dojo
 * system: a vertical kanji, a Mincho line, one sentence, and a way back.
 */
export default function SystemPage({
    mark,
    title,
    body,
    children,
}: {
    /** One kanji, set vertically. */
    mark: string;
    title: string;
    body: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div data-bleed className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-night px-4 font-gothic text-canvas sm:px-6 lg:px-8">
            <KankuMark className="pointer-events-none absolute -right-[12vw] top-1/2 h-[80vmin] w-[80vmin] -translate-y-1/2 text-worn-belt" />
            <div className="relative mx-auto flex w-full max-w-[1400px] items-start gap-6 md:gap-10">
                <span aria-hidden="true" lang="ja" className="font-mincho text-[clamp(3.052rem,8vw,6rem)] font-extrabold leading-none text-kyokushin-red [writing-mode:vertical-rl]">
                    {mark}
                </span>
                <div className="pt-2">
                    <h1 className="max-w-[16ch] font-mincho text-[clamp(2.441rem,6vw,4.5rem)] font-extrabold leading-[1] tracking-[-0.02em] text-canvas">{title}</h1>
                    <div className="mt-6 max-w-[46ch] text-base leading-[1.6] text-ash md:text-[1.25rem]">{body}</div>
                    {children && <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">{children}</div>}
                </div>
            </div>
        </div>
    );
}
