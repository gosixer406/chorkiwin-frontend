import { useState } from "react";
import { LuCopy, LuCopyCheck } from "react-icons/lu";

export default function CopyClipboard({ text = "xxxxxxxx" }) {
    const token = text;
    const [copied, setCopied] = useState(false);
    const copyHandle = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => {
            setCopied(false)
        }, 3000)
    }
    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="text-sm grow line-clamp-1 sm:text-base leading-normal min-h-12 rounded-lg flex items-center px-4 text-white border border-solid border-[#104868] bg-[#093c5a]">{text}</div>
            <button onClick={() => copyHandle()} className="size-12 flex-none flex items-center justify-center rounded-lg bg-primary2 text-white hover:bg-primary">
                {copied ? <LuCopyCheck className="size-6" /> : <LuCopy className="size-6 -scale-x-100 " />}
            </button>
        </div>
    )
}