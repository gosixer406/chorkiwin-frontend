import { useState } from "react"

export default function MainContent({
    leftMenu,
    children,
    childrenClass = "gap-y-3",
    activeTitle,
    onMenuChange,
}) {
    const [internalActiveMenu, setInternalActiveMenu] = useState(leftMenu[0])
    const activeMenu = activeTitle
        ? leftMenu.find((menu) => menu.title === activeTitle) || leftMenu[0]
        : internalActiveMenu

    const selectMenu = (menu) => {
        if (!activeTitle) setInternalActiveMenu(menu)
        onMenuChange?.(menu)
    }

    return (
        <div className="flex items-start gap-2.5">
            <aside className="flex h-fit w-[62px] shrink-0 flex-col items-center gap-y-[14px] rounded-lg bg-white p-1 shadow-sm">
                {leftMenu.map((menu, index) => (
                    <button onClick={() => selectMenu(menu)} key={index} aria-pressed={activeMenu.title === menu.title} className={`flex h-[70px] w-[50px] shrink-0 cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg text-[10px] font-normal leading-tight transition-all duration-300 hover:bg-primary hover:text-black ${activeMenu.title === menu.title ? 'bg-primary text-black shadow-sm' : 'text-[#316481]'}`}>
                        <span className="[&_svg]:size-8.5">{menu.icon}</span>
                        <span>{menu.title}</span>
                    </button>
                ))}
            </aside>
            <div className={`flex min-w-0 flex-1 flex-col ${childrenClass}`}>
                {children}
            </div>
        </div >
    )
}
