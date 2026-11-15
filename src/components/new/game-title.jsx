export default function GameTitle({ title, icon }) {
    return (
        <div className="relative z-1 flex h-[27px] flex-col gap-2 text-primary2">
            <div className="flex h-4 items-center gap-1.5 [&_svg]:size-4">
                {icon}
                <span className="whitespace-nowrap font-poppins text-[14px] font-semibold uppercase leading-none tracking-[-0.14px] text-primary2">{title}</span>
            </div>
            <div className="h-[3px] w-19 rounded-full bg-[linear-gradient(90deg,var(--c-gold)_0%,var(--c-gold)_39%,color-mix(in_srgb,var(--c-gold)_0%,transparent)_100%)]" />
        </div>
    )
}
