
// import { Link } from 'react-router-dom'
import { useState } from 'react'
import LegacyGameGrid from '@/components/legacy/game-grid'
import MainContent from '@/components/homepage/main-content'
// import { ArrowRight } from '../../utilities/icons/arrow-right'

import s_img_1 from '@/assets/img/game/live/game-shows/1.png'
import s_img_2 from '@/assets/img/game/live/game-shows/2.png'
import s_img_3 from '@/assets/img/game/live/game-shows/3.png'
import s_img_4 from '@/assets/img/game/live/game-shows/4.png'
import s_img_5 from '@/assets/img/game/live/game-shows/5.png'
import s_img_6 from '@/assets/img/game/live/game-shows/6.png'
import s_img_7 from '@/assets/img/game/live/game-shows/7.png'
import s_img_8 from '@/assets/img/game/live/game-shows/8.png'
import s_img_9 from '@/assets/img/game/live/game-shows/9.png'
import s_img_10 from '@/assets/img/game/live/game-shows/10.png'
import s_img_11 from '@/assets/img/game/live/game-shows/11.png'
import s_img_12 from '@/assets/img/game/live/game-shows/12.png'
import s_img_13 from '@/assets/img/game/live/game-shows/13.png'
import s_img_14 from '@/assets/img/game/live/game-shows/14.png'
import s_img_15 from '@/assets/img/game/live/game-shows/15.png'
import s_img_16 from '@/assets/img/game/live/game-shows/16.png'
import s_img_17 from '@/assets/img/game/live/game-shows/17.png'
import s_img_18 from '@/assets/img/game/live/game-shows/18.png'
import s_img_19 from '@/assets/img/game/live/game-shows/19.png'
import s_img_20 from '@/assets/img/game/live/game-shows/20.png'
import s_img_21 from '@/assets/img/game/live/game-shows/21.png'
import s_img_22 from '@/assets/img/game/live/game-shows/22.png'
import s_img_23 from '@/assets/img/game/live/game-shows/23.png'
import s_img_24 from '@/assets/img/game/live/game-shows/24.png'
import s_img_25 from '@/assets/img/game/live/game-shows/25.png'
import s_img_26 from '@/assets/img/game/live/game-shows/26.png'
import s_img_27 from '@/assets/img/game/live/game-shows/27.png'
import s_img_28 from '@/assets/img/game/live/game-shows/28.png'
import s_img_29 from '@/assets/img/game/live/game-shows/29.png'

import b_img_1 from '@/assets/img/game/live/baccarat/1.png'
import b_img_2 from '@/assets/img/game/live/baccarat/2.png'
import b_img_3 from '@/assets/img/game/live/baccarat/3.png'
import b_img_4 from '@/assets/img/game/live/baccarat/4.png'
import b_img_5 from '@/assets/img/game/live/baccarat/5.png'
import b_img_6 from '@/assets/img/game/live/baccarat/6.png'
import b_img_7 from '@/assets/img/game/live/baccarat/7.png'
import b_img_8 from '@/assets/img/game/live/baccarat/8.png'
import b_img_9 from '@/assets/img/game/live/baccarat/9.png'
import b_img_10 from '@/assets/img/game/live/baccarat/10.png'
import b_img_11 from '@/assets/img/game/live/baccarat/11.png'
import b_img_12 from '@/assets/img/game/live/baccarat/12.png'
import b_img_13 from '@/assets/img/game/live/baccarat/13.png'
import b_img_14 from '@/assets/img/game/live/baccarat/14.png'
import b_img_15 from '@/assets/img/game/live/baccarat/15.png'
import b_img_16 from '@/assets/img/game/live/baccarat/16.png'
import b_img_17 from '@/assets/img/game/live/baccarat/17.png'
import b_img_18 from '@/assets/img/game/live/baccarat/18.png'
import b_img_19 from '@/assets/img/game/live/baccarat/19.png'
import b_img_20 from '@/assets/img/game/live/baccarat/20.png'

import r_img_1 from '@/assets/img/game/live/roulette/1.png'
import r_img_2 from '@/assets/img/game/live/roulette/2.png'
import r_img_3 from '@/assets/img/game/live/roulette/3.png'
import r_img_4 from '@/assets/img/game/live/roulette/4.png'
import r_img_5 from '@/assets/img/game/live/roulette/5.png'
import r_img_6 from '@/assets/img/game/live/roulette/6.png'
import r_img_7 from '@/assets/img/game/live/roulette/7.png'
import r_img_8 from '@/assets/img/game/live/roulette/8.png'
import r_img_9 from '@/assets/img/game/live/roulette/9.png'
import r_img_10 from '@/assets/img/game/live/roulette/10.png'
import r_img_11 from '@/assets/img/game/live/roulette/11.png'
import r_img_12 from '@/assets/img/game/live/roulette/12.png'
import r_img_13 from '@/assets/img/game/live/roulette/13.png'
import r_img_14 from '@/assets/img/game/live/roulette/14.png'
import r_img_15 from '@/assets/img/game/live/roulette/15.png'
import r_img_16 from '@/assets/img/game/live/roulette/16.png'
import r_img_17 from '@/assets/img/game/live/roulette/17.png'
import r_img_18 from '@/assets/img/game/live/roulette/18.png'
import r_img_19 from '@/assets/img/game/live/roulette/19.png'
import r_img_20 from '@/assets/img/game/live/roulette/20.png'
import r_img_21 from '@/assets/img/game/live/roulette/21.png'

import d_img_1 from '@/assets/img/game/live/dice/1.png'
import d_img_2 from '@/assets/img/game/live/dice/2.png'
import d_img_3 from '@/assets/img/game/live/dice/3.png'
import d_img_4 from '@/assets/img/game/live/dice/4.png'
import d_img_5 from '@/assets/img/game/live/dice/5.png'
import d_img_6 from '@/assets/img/game/live/dice/6.png'
import d_img_7 from '@/assets/img/game/live/dice/7.png'
import d_img_8 from '@/assets/img/game/live/dice/8.png'
import d_img_9 from '@/assets/img/game/live/dice/9.png'
import d_img_10 from '@/assets/img/game/live/dice/10.png'

import t_img_1 from '@/assets/img/game/live/traditional/1.png'
import t_img_2 from '@/assets/img/game/live/traditional/2.png'
import t_img_3 from '@/assets/img/game/live/traditional/3.png'
import t_img_4 from '@/assets/img/game/live/traditional/4.png'
import t_img_5 from '@/assets/img/game/live/traditional/5.png'
import t_img_6 from '@/assets/img/game/live/traditional/6.png'
import t_img_7 from '@/assets/img/game/live/traditional/7.png'
import t_img_8 from '@/assets/img/game/live/traditional/8.png'
import t_img_9 from '@/assets/img/game/live/traditional/9.png'
import t_img_10 from '@/assets/img/game/live/traditional/10.png'
import t_img_11 from '@/assets/img/game/live/traditional/11.png'
import t_img_12 from '@/assets/img/game/live/traditional/12.png'

import card_img_1 from '@/assets/img/game/live/card/1.png'
import card_img_2 from '@/assets/img/game/live/card/2.png'
import card_img_3 from '@/assets/img/game/live/card/3.png'
import card_img_4 from '@/assets/img/game/live/card/4.png'
import card_img_5 from '@/assets/img/game/live/card/5.png'
import card_img_6 from '@/assets/img/game/live/card/6.png'
import card_img_7 from '@/assets/img/game/live/card/7.png'

import o_img_1 from '@/assets/img/game/live/others/1.png'
import o_img_2 from '@/assets/img/game/live/others/2.png'
import o_img_3 from '@/assets/img/game/live/others/3.png'
import o_img_4 from '@/assets/img/game/live/others/4.png'

export default function Live() {
  const [activeView, setActiveView] = useState('Catalog')
  const left_menu = [
    {
      icon: <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_40_39)">
          <path d="M21.2331 21.725L17.8379 2.22647C17.9371 1.51978 18.2117 1.18544 18.8526 0.90428C19.402 0.661119 23.3465 -0.0379688 23.9188 2.50849e-05C24.7886 0.0608154 25.2616 0.706712 25.3837 1.51218L28.7941 20.304C28.7255 20.5775 28.4737 20.5623 28.2677 20.6307C27.6039 20.8511 21.4849 21.9757 21.2331 21.7174V21.725Z" fill="currentColor" />
          <path d="M7.58393 8.77661V28.7386C7.58393 29.6429 5.99695 29.8784 5.3179 29.9316C4.31078 30.0076 0 30.2432 0 28.7386V8.77661H7.58393Z" fill="currentColor" />
          <path d="M16.4649 8.77661V28.9514C16.4649 29.0046 15.8316 29.6049 15.679 29.6809C14.9771 30.038 11.6429 30.038 10.7197 29.9316C10.0025 29.848 8.88098 29.3237 8.88098 28.5259V8.77661H16.4649Z" fill="currentColor" />
          <path d="M29.2284 23.0471C29.3047 24.4985 30.7468 27.7584 29.4802 28.7614C28.9538 29.1793 24.437 30.0228 23.7732 29.8936C22.1099 29.5745 22.026 25.5015 21.8887 24.1109L29.2208 23.0471H29.2284Z" fill="currentColor" />
          <path d="M16.4649 6.40581H8.88098V1.55018C8.88098 0.980273 9.93388 0.425562 10.4985 0.357173C11.3606 0.258388 15.3433 0.25079 15.9003 0.600334C16.0529 0.699118 16.4649 1.21584 16.4649 1.32982V6.39821V6.40581Z" fill="currentColor" />
          <path d="M7.58393 6.40575H0V1.55013C0 1.1094 0.885046 0.417908 1.39624 0.349519C2.21261 0.243136 5.63835 0.22034 6.38606 0.364717C6.69888 0.425507 7.58393 1.20818 7.58393 1.32976V6.39815V6.40575Z" fill="currentColor" />
        </g>
        <defs>
          <clipPath id="clip0_40_39">
            <rect width="30" height="30" fill="white" />
          </clipPath>
        </defs>
      </svg>,
      title: 'Catalog',
    },
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
  const live_game = [
    {
      title: 'Game Shows',
      games: [
        {
          img: s_img_1,
          path: ''
        },
        {
          img: s_img_2,
          path: ''
        },
        {
          img: s_img_3,
          path: ''
        },
        {
          img: s_img_4,
          path: ''
        },
        {
          img: s_img_5,
          path: ''
        },
        {
          img: s_img_6,
          path: ''
        },
        {
          img: s_img_7,
          path: ''
        },
        {
          img: s_img_8,
          path: ''
        },
        {
          img: s_img_9,
          path: ''
        },
        {
          img: s_img_10,
          path: ''
        },
        {
          img: s_img_11,
          path: ''
        },
        {
          img: s_img_12,
          path: ''
        },
        {
          img: s_img_13,
          path: ''
        },
        {
          img: s_img_14,
          path: ''
        },
        {
          img: s_img_15,
          path: ''
        },
        {
          img: s_img_16,
          path: ''
        },
        {
          img: s_img_17,
          path: ''
        },
        {
          img: s_img_18,
          path: ''
        },
        {
          img: s_img_19,
          path: ''
        },
        {
          img: s_img_20,
          path: ''
        },
        {
          img: s_img_21,
          path: ''
        },
        {
          img: s_img_22,
          path: ''
        },
        {
          img: s_img_23,
          path: ''
        },
        {
          img: s_img_24,
          path: ''
        },
        {
          img: s_img_25,
          path: ''
        },
        {
          img: s_img_26,
          path: ''
        },
        {
          img: s_img_27,
          path: ''
        },
        {
          img: s_img_28,
          path: ''
        },
        {
          img: s_img_29,
          path: ''
        },
      ]
    },
    {
      title: 'Baccarat',
      games: [
        {
          img: b_img_1,
          path: ''
        },
        {
          img: b_img_2,
          path: ''
        },
        {
          img: b_img_3,
          path: ''
        },
        {
          img: b_img_4,
          path: ''
        },
        {
          img: b_img_5,
          path: ''
        },
        {
          img: b_img_6,
          path: ''
        },
        {
          img: b_img_7,
          path: ''
        },
        {
          img: b_img_8,
          path: ''
        },
        {
          img: b_img_9,
          path: ''
        },
        {
          img: b_img_10,
          path: ''
        },
        {
          img: b_img_11,
          path: ''
        },
        {
          img: b_img_12,
          path: ''
        },
        {
          img: b_img_13,
          path: ''
        },
        {
          img: b_img_14,
          path: ''
        },
        {
          img: b_img_15,
          path: ''
        },
        {
          img: b_img_16,
          path: ''
        },
        {
          img: b_img_17,
          path: ''
        },
        {
          img: b_img_18,
          path: ''
        },
        {
          img: b_img_19,
          path: ''
        },
        {
          img: b_img_20,
          path: ''
        },
      ]
    },
    {
      title: 'Roulette',
      games: [
        {
          img: r_img_1,
          path: ''
        },
        {
          img: r_img_2,
          path: ''
        },
        {
          img: r_img_3,
          path: ''
        },
        {
          img: r_img_4,
          path: ''
        },
        {
          img: r_img_5,
          path: ''
        },
        {
          img: r_img_6,
          path: ''
        },
        {
          img: r_img_7,
          path: ''
        },
        {
          img: r_img_8,
          path: ''
        },
        {
          img: r_img_9,
          path: ''
        },
        {
          img: r_img_10,
          path: ''
        },
        {
          img: r_img_11,
          path: ''
        },
        {
          img: r_img_12,
          path: ''
        },
        {
          img: r_img_13,
          path: ''
        },
        {
          img: r_img_14,
          path: ''
        },
        {
          img: r_img_15,
          path: ''
        },
        {
          img: r_img_16,
          path: ''
        },
        {
          img: r_img_17,
          path: ''
        },
        {
          img: r_img_18,
          path: ''
        },
        {
          img: r_img_19,
          path: ''
        },
        {
          img: r_img_20,
          path: ''
        },
        {
          img: r_img_21,
          path: ''
        },
      ]
    },
    {
      title: 'Dice',
      games: [
        {
          img: d_img_1,
          path: ''
        },
        {
          img: d_img_2,
          path: ''
        },
        {
          img: d_img_3,
          path: ''
        },
        {
          img: d_img_4,
          path: ''
        },
        {
          img: d_img_5,
          path: ''
        },
        {
          img: d_img_6,
          path: ''
        },
        {
          img: d_img_7,
          path: ''
        },
        {
          img: d_img_8,
          path: ''
        },
        {
          img: d_img_9,
          path: ''
        },
        {
          img: d_img_10,
          path: ''
        },
      ]
    },
    {
      title: 'Traditional Games',
      games: [
        {
          img: t_img_1,
          path: ''
        },
        {
          img: t_img_2,
          path: ''
        },
        {
          img: t_img_3,
          path: ''
        },
        {
          img: t_img_4,
          path: ''
        },
        {
          img: t_img_5,
          path: ''
        },
        {
          img: t_img_6,
          path: ''
        },
        {
          img: t_img_7,
          path: ''
        },
        {
          img: t_img_8,
          path: ''
        },
        {
          img: t_img_9,
          path: ''
        },
        {
          img: t_img_10,
          path: ''
        },
        {
          img: t_img_11,
          path: ''
        },
        {
          img: t_img_12,
          path: ''
        },
      ]
    },
    {
      title: 'Card Games',
      games: [
        {
          img: card_img_1,
          path: ''
        },
        {
          img: card_img_2,
          path: ''
        },
        {
          img: card_img_3,
          path: ''
        },
        {
          img: card_img_4,
          path: ''
        },
        {
          img: card_img_5,
          path: ''
        },
        {
          img: card_img_6,
          path: ''
        },
        {
          img: card_img_7,
          path: ''
        },
      ]
    },
    {
      title: 'Others',
      games: [
        {
          img: o_img_1,
          path: ''
        },
        {
          img: o_img_2,
          path: ''
        },
        {
          img: o_img_3,
          path: ''
        },
        {
          img: o_img_4,
          path: ''
        },
      ]
    },
  ]

  const allLiveGames = live_game.flatMap((section) => section.games)

  return (
    <MainContent leftMenu={left_menu} activeTitle={activeView} onMenuChange={(menu) => setActiveView(menu.title)} childrenClass="gap-0">
      {activeView === 'Catalog' ? live_game.map((item, idx) => (
          <section className="mb-8 rounded-[8px] bg-[#e6edf1] p-[8px]" key={idx}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold capitalize text-gray-800">
              <span className="inline-block h-4 w-1 rounded-lg bg-black" />
              {item.title}
            </h2>
            <LegacyGameGrid className="grid grid-cols-3 gap-2" cardClassName="aspect-square !rounded-[10px]" items={item.games} referenceCategory="live" referenceGroup={item.title.toUpperCase().replaceAll(' ', '_')} maxItems={item.games.length} />
          </section>
        )) : (
          <LegacyGameGrid
            className="grid grid-cols-3 gap-2"
            cardClassName="aspect-square !rounded-[10px]"
            items={allLiveGames}
            referenceCategory="live"
            sort={activeView}
            maxItems={allLiveGames.length}
          />
        )}
      {/* <Link className='btn w-max mx-auto' to="/games/casino/live">Show More <ArrowRight /> </Link> */}

    </MainContent>
  )
}
