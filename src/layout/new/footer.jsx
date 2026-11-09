import { Link } from "react-router-dom";

import logo from "@/assets/img/logo/short_logo_3d.png";
import adult_1 from "@/assets/img/new/adult/1.png";
import adult_2 from "@/assets/img/new/adult/2.png";
import adult_3 from "@/assets/img/new/adult/3.png";
import payment_1 from "@/assets/img/new/payment/1.png";
import payment_2 from "@/assets/img/new/payment/2.png";
import payment_3 from "@/assets/img/new/payment/3.png";
import payment_4 from "@/assets/img/new/payment/4.png";
import payment_5 from "@/assets/img/new/payment/5.png";
import igamingpoint_logo from "@/assets/img/new/developer/igamingpoint-logo.png";
import SocialButtons from "@/components/social-buttons";

export default function Footer({ fullWidth = false }) {
  return (
    <footer
      className={`${fullWidth ? "px-2" : "mt-3"} flex flex-col gap-4 pt-5 pb-10`}
    >
      <div className="flex w-full flex-col items-center gap-2.5 rounded-lg px-3 py-2">
        <Link to="/" aria-label="chorkix.com home">
          <img
            src={logo}
            className="h-8 w-28 object-contain object-center"
            alt="chorkix.com"
          />
        </Link>
        <div className="font-inter text-center text-[8px] tracking-[0.16px] text-white">
          <p className="font-normal leading-normal">
            Compulsive gambling is harmful to health
          </p>
          <p className="font-light leading-normal">
            The Provincial Lottery&apos;s Compulsive Gambling Prevention and
            Assistance Program,
          </p>
          <p className="font-light leading-normal">
            if you have a gambling problem, you can contact our support. If you
            think you are at risk of developing a gambling problem or believe
            you already have a gambling addiction problem, you can request
            self-exclusion by clicking here.
          </p>
          <p className="font-normal leading-normal">
            License and operating permit DI-2022-103-GCABA-LOTBA
          </p>
        </div>
      </div>
      <div className="flex h-10 w-full items-center justify-center gap-10 rounded-md px-3 py-2">
        <img
          src={adult_1}
          className="h-[19px] w-[60px] object-contain"
          alt="GoCuracao"
        />
        <img
          src={adult_2}
          className="h-[18px] w-20 object-contain"
          alt="SaberJugar"
        />
        <img src={adult_3} className="size-6 object-contain" alt="18+" />
      </div>
      <div className="flex h-12 w-full items-center justify-between rounded-md px-3 py-2">
        <img
          src={payment_1}
          className="h-[31px] w-14 object-contain"
          alt="bKash"
        />
        <img
          src={payment_2}
          className="h-7 w-[60px] object-contain"
          alt="Nagad"
        />
        <img
          src={payment_3}
          className="h-[25px] w-10 object-contain"
          alt="Rocket"
        />
        <img src={payment_4} className="size-8 object-contain" alt="eSomp" />
        <img
          src={payment_5}
          className="h-[23px] w-[63px] object-contain"
          alt="Bank Deposit"
        />
      </div>
      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full items-center gap-4">
          <span className="h-px flex-1 bg-line-strong" />
          <span className="whitespace-nowrap font-roboto text-sm font-medium tracking-[-0.14px] text-ink-muted">
            About chorkix.com
          </span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>
        <SocialButtons />
      </div>
      <div className="flex w-full flex-col items-center gap-1.5 border-t border-line pt-3">
        <span className="font-inter text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
          Development by
        </span>
        <a
          href="#"
          rel="noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <img
            src={igamingpoint_logo}
            className="h-5 w-auto object-contain"
            alt="iGamingPoint"
          />
        </a>
      </div>
    </footer>
  );
}
