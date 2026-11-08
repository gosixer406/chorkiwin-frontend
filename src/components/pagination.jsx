import React, { useState } from 'react'

export default function Pagination({ className = "" }) {
    const p_count = 3;
    const [active_pagination, set_active_pagination] = useState(1);
    const btn_size = 'size-8.5 flex items-center justify-center rounded-lg border border-solid text-xs font-bold hover:bg-primary2 hover:border-primary2 hover:text-[#093c5a]';

    return (
        <div className={`flex items-center gap-x-2 justify-center ${className}`}>
            <button className={`${btn_size} text-[#CCDAE2] bg-[#0b3a55] border-[#0d4464]`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_172_5683)">
                        <path d="M9.21451 0.293133C9.16295 0.180633 9.07388 0.0892271 8.96842 0.0376646C8.85592 -0.0162416 8.64029 -0.0115541 8.5231 0.0470396C8.45748 0.0775084 7.52466 0.996258 5.60982 2.9111C2.59341 5.9322 2.74341 5.77048 2.74341 6.00016C2.74341 6.22985 2.59341 6.06813 5.60982 9.08923C7.52466 11.0041 8.45748 11.9228 8.5231 11.9533C8.64029 12.0119 8.85592 12.0166 8.96842 11.9627C9.20748 11.8502 9.32467 11.5478 9.22388 11.3017C9.1981 11.2408 8.42701 10.4533 6.58013 8.60876L3.97388 6.00016L6.58013 3.39391C8.42701 1.54704 9.1981 0.75954 9.22388 0.698602C9.27076 0.581415 9.26841 0.407977 9.21451 0.293133Z" fill="currentColor" />
                    </g>
                    <defs>
                        <clipPath id="clip0_172_5683">
                            <rect width="12" height="12" fill="white" transform="matrix(0 1 -1 0 12 0)" />
                        </clipPath>
                    </defs>
                </svg>
            </button>
            {Array.from({ length: p_count }).map((_, idx) => (
                <button className={`${btn_size} ${active_pagination === idx + 1 ? 'bg-primary2 border-primary2 text-[#093c5a]' : 'bg-[#0b3a55] border-[#0d4464] text-[#CCDAE2]'}`} onClick={() => set_active_pagination(idx + 1)} key={idx + 1}>{idx + 1}</button>
            ))}
            <button className={`${btn_size} text-[#CCDAE2] bg-[#0b3a55] border-[#0d4464]`}>
                <svg className='-scale-x-100' width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_172_5683)">
                        <path d="M9.21451 0.293133C9.16295 0.180633 9.07388 0.0892271 8.96842 0.0376646C8.85592 -0.0162416 8.64029 -0.0115541 8.5231 0.0470396C8.45748 0.0775084 7.52466 0.996258 5.60982 2.9111C2.59341 5.9322 2.74341 5.77048 2.74341 6.00016C2.74341 6.22985 2.59341 6.06813 5.60982 9.08923C7.52466 11.0041 8.45748 11.9228 8.5231 11.9533C8.64029 12.0119 8.85592 12.0166 8.96842 11.9627C9.20748 11.8502 9.32467 11.5478 9.22388 11.3017C9.1981 11.2408 8.42701 10.4533 6.58013 8.60876L3.97388 6.00016L6.58013 3.39391C8.42701 1.54704 9.1981 0.75954 9.22388 0.698602C9.27076 0.581415 9.26841 0.407977 9.21451 0.293133Z" fill="currentColor" />
                    </g>
                    <defs>
                        <clipPath id="clip0_172_5683">
                            <rect width="12" height="12" fill="white" transform="matrix(0 1 -1 0 12 0)" />
                        </clipPath>
                    </defs>
                </svg>
            </button>
        </div>
    )
}
