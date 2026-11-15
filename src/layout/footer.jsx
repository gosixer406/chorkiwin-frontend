import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Social from '../components/social';
import { LEGAL_CONTENT } from '../data/legal-content';

const LEGAL_LINKS = [
  'Privacy Policy',
  'Terms and Conditions',
  'Rules and Regulations',
  'KYC',
  'Responsible Gaming',
];

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null);

  useEffect(() => {
    if (!activePolicy) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActivePolicy(null);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [activePolicy]);

  return (
    <footer className="my-7 flex w-full flex-col items-center justify-center gap-2 text-center">
      <Social
        className="h-[32.9375px] justify-center !gap-2"
        btnClass="!size-[33px] bg-black text-base text-white hover:!bg-black hover:opacity-80"
      />

      <div className="flex flex-wrap items-center justify-center gap-2 px-6">
        {LEGAL_LINKS.map((name, index) => (
          <div className="flex items-center gap-2" key={name}>
            <button
              type="button"
              onClick={() => setActivePolicy(name)}
              className="cursor-pointer text-xs font-medium text-[#3b6c88] hover:text-black"
            >
              {name}
            </button>
            {index < LEGAL_LINKS.length - 1 && <span className="h-3 w-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {activePolicy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-drawer-header"
          tabIndex="-1"
          className="fixed inset-0 z-50 flex animate-[fade-in_.3s_ease-out] items-center justify-center"
        >
          <div className="flex h-full w-full max-w-[480px] animate-[legal-drawer-in_.3s_ease-out] flex-col overflow-hidden bg-black">
            <div className="relative flex w-full shrink-0 items-center justify-center bg-black px-4 py-4">
              <h2 id="legal-drawer-header" className="text-lg font-bold tracking-wide text-white">
                {activePolicy}
              </h2>
              <button
                type="button"
                aria-label="Close drawer"
                onClick={() => setActivePolicy(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-white transition-colors hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <X className="size-6" />
              </button>
            </div>

            <div
              className="no-scrollbar flex-1 overflow-y-auto rounded-t-xl bg-white px-6 py-6 text-left text-[#002337]"
              dangerouslySetInnerHTML={{ __html: LEGAL_CONTENT[activePolicy] }}
            />
          </div>
        </div>
      )}
    </footer>
  );
}
