import { useState } from "react";

export default function Switch({ className = "", switchClass = "border-[#3a6b88] bg-[#0b3a55] has-checked:bg-[#000900]", title, titleClass = "", id = "switch", name = "switch", checked, onChange }) {
    const [is_checked, set_is_checked] = useState(checked)
    const customChange = (event) => {
        set_is_checked((e) => !e);
        onChange?.(event)
    }
    return (
        <label htmlFor={id} className={`cursor-pointer flex items-center gap-2 ${className}`}>
            <span className={`w-10 h-5.5 rounded-full border border-solid inline-block relative transition-all duration-300 ${switchClass}`}>
                <input type="checkbox" id={id} className='peer hidden' checked={is_checked} name={name} onChange={customChange} />
                <span className='size-4 rounded-full bg-[#CFDCE4] absolute top-1/2 left-0.5 -translate-y-1/2 peer-checked:ml-0.5 peer-checked:translate-x-full transition-all duration-300' />
            </span>
            {title &&
                <span className={`font-medium text-black text-sm capitalize select-none ${titleClass}`}>{title}</span>
            }
        </label>
    )

}