import LegacyGameGrid from '@/components/legacy/game-grid'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import MainContent from '@/components/homepage/main-content'
import { ArrowRight } from '../../utilities/icons/arrow-right'

import img_1 from '@/assets/img/game/table/1.png'
import img_2 from '@/assets/img/game/table/2.png'
import img_3 from '@/assets/img/game/table/3.png'
import img_4 from '@/assets/img/game/table/4.png'
import img_5 from '@/assets/img/game/table/5.png'
import img_6 from '@/assets/img/game/table/6.png'
import img_7 from '@/assets/img/game/table/7.png'
import img_8 from '@/assets/img/game/table/8.png'
import img_9 from '@/assets/img/game/table/9.png'
import img_10 from '@/assets/img/game/table/10.png'
import img_11 from '@/assets/img/game/table/11.png'
import img_12 from '@/assets/img/game/table/12.png'
import img_13 from '@/assets/img/game/table/13.png'
import img_14 from '@/assets/img/game/table/14.png'
import img_15 from '@/assets/img/game/table/15.png'
import img_16 from '@/assets/img/game/table/16.png'
import img_17 from '@/assets/img/game/table/17.png'
import img_18 from '@/assets/img/game/table/18.png'
import img_19 from '@/assets/img/game/table/19.png'
import img_20 from '@/assets/img/game/table/20.png'

export default function Table() {
    const [activeView, setActiveView] = useState('Catalog')
    const left_menu = [
        {
            icon: <svg width="30" height="35" viewBox="0 0 30 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_40_50)">
                    <path d="M24.5372 8.17373C24.8704 7.81026 25.9491 9.45033 26.1595 9.72515C26.9575 10.7978 27.6591 12.0567 28.2028 13.2801C30.7196 19.0425 30.9213 25.6737 26.6945 30.656C25.0721 32.5709 22.9587 34.1489 20.4945 34.734C22.8886 31.9237 22.6079 28.8741 21.3013 25.6205C20.4419 23.4929 18.8897 21.7198 18.2145 19.5478C17.7497 18.0496 17.4603 16.3741 17.4691 14.8138C14.2069 16.2056 12.7863 20.1152 12.9178 23.5017C12.1812 23.5372 11.7427 22.562 11.5322 21.9681C11.1025 20.7978 11.1113 19.6276 11.1464 18.3954C5.56906 22.5886 6.30569 30 10.3922 35C5.07798 34.2376 0.579293 29.2464 0.0443616 23.8652C-0.367799 19.7163 1.97362 17.1365 2.73656 13.3422C3.06102 11.7198 2.99087 10.5673 2.80671 8.93614C3.04348 8.68791 6.788 10.461 6.60385 11.4893C10.6553 9.2021 11.5585 4.29075 10.3922 -2.94112e-05C15.7766 -0.0354904 20.2314 4.32621 21.7749 9.31735C22.2835 10.9663 22.2396 12.3847 22.5202 14.0514C23.2306 13.8564 24.5372 12.5709 24.5372 11.8794V8.17373Z" fill="currentColor" />
                </g>
                <defs>
                    <clipPath id="clip0_40_50">
                        <rect width="30" height="35" fill="white" />
                    </clipPath>
                </defs>
            </svg>,
            title: 'Latest',
        },
        {
            icon: <svg width="30" height="35" viewBox="0 0 30 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_40_55)">
                    <path d="M15.1315 25.922H11.2829L10.0292 21.4096L5.11981 21.3741L3.84863 25.922H0L5.11981 9.19328C6.00526 9.09576 9.70485 8.81207 10.1344 9.32626L15.1315 25.922ZM5.63705 18.6614H9.48568L7.55698 11.9149C7.03098 11.7465 7.15371 12.3759 7.05728 12.6951C6.4699 14.6099 6.03156 16.6933 5.63705 18.6614Z" fill="currentColor" />
                    <path d="M30.0007 9.06909L29.799 11.3297L22.0492 22.8102H30.0007V25.9219H17.1836L17.3765 23.3953L25.1263 12.1808H17.9463V9.06909H30.0007Z" fill="currentColor" />
                    <path d="M21.2858 5.44326H10.7656L16.0257 0L21.2858 5.44326Z" fill="currentColor" />
                    <path d="M21.2858 29.5568L16.0257 35L10.7656 29.5568H21.2858Z" fill="currentColor" />
                </g>
                <defs>
                    <clipPath id="clip0_40_55">
                        <rect width="30" height="35" fill="white" />
                    </clipPath>
                </defs>
            </svg>,
            title: 'A-Z',
        },
    ]

    const table_game = [
        {
            img: img_1,
            path: ''
        },
        {
            img: img_2,
            path: ''
        },
        {
            img: img_3,
            path: ''
        },
        {
            img: img_4,
            path: ''
        },
        {
            img: img_5,
            path: ''
        },
        {
            img: img_6,
            path: ''
        },
        {
            img: img_7,
            path: ''
        },
        {
            img: img_8,
            path: ''
        },
        {
            img: img_9,
            path: ''
        },
        {
            img: img_10,
            path: ''
        },
        {
            img: img_11,
            path: ''
        },
        {
            img: img_12,
            path: ''
        },
        {
            img: img_13,
            path: ''
        },
        {
            img: img_14,
            path: ''
        },
        {
            img: img_15,
            path: ''
        },
        {
            img: img_16,
            path: ''
        },
        {
            img: img_17,
            path: ''
        },
        {
            img: img_18,
            path: ''
        },
        {
            img: img_19,
            path: ''
        },
        {
            img: img_20,
            path: ''
        },
    ]
    return (
        <MainContent leftMenu={left_menu} activeTitle={activeView} onMenuChange={(menu) => setActiveView(menu.title)} childrenClass="gap-6">
            <LegacyGameGrid items={table_game} referenceCategory="table" sort={activeView} maxItems={table_game.length} />
            {activeView === 'Catalog' && <Link className='mx-auto flex h-8 w-[145px] items-center justify-center gap-2 whitespace-nowrap rounded-[3px] bg-black px-2.5 text-[17px] font-normal text-white transition-colors hover:bg-[#0a3f5d]' to="/casino/table">Show More <ArrowRight /> </Link>}
        </MainContent>
    )
}
