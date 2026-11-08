import { useState } from "react";
import PageTitle from "../../components/dashboard/page-title";
import CommonInner from "../../layout/dashboard/common-inner";
import { Check } from "lucide-react";
import { useSelector } from 'react-redux';

export default function Profile() {
    const user = useSelector((state) => state.auth.user) || {}
    const names = String(user.full_name || user.username || '').trim().split(/\s+/)
    const profile_info = [
        {
            name: 'First Name',
            value: names[0] || user.username || null,
            is_edit: true,
        },
        {
            name: 'Last Name',
            value: names.slice(1).join(' ') || null,
            is_edit: true,
        },
        {
            name: 'Phone Number',
            value: user.phone || 'N/A',
            is_edit: false,
        },
        {
            name: 'Email',
            value: user.email || null,
            is_edit: true,
        },
        {
            name: 'Password',
            value: null,
            is_edit: true,
        },
    ]
    const [active_info, set_active_info] = useState(null)

    return (
        <>
            <PageTitle title="My Profile" />
            <CommonInner className={'py-8!'}>
                <div className="flex flex-col gap-y-0 bg-white rounded-lg overflow-hidden">
                    {profile_info.map((item, idx) => (
                        <div
                            className="flex items-center min-h-11 gap-x-2 py-2 px-3 cursor-pointer not-last:border-b border-solid border-[#EBF1F4]"
                            key={idx}
                        >
                            <span className="text-sm block w-25 font-medium text-black leading-normal">{item.name}</span>
                            <div className="grow text-sm leading-tight text-[#647D8D] font-medium">
                                {active_info && item.name === active_info.name ?
                                    <input type="text" placeholder={item.name} className="w-full" defaultValue={active_info.value || ''} />
                                    :
                                    !item.value ? '—' : item.value
                                }
                            </div>
                            {item.is_edit &&
                                <button onClick={() => set_active_info(active_info && item.name === active_info.name ? null : item)} className="ml-auto flex items-center gap-x-1 px-2 bg-primary text-black font-medium text-sm min-h-7 rounded-md capitalize">
                                    {active_info && item.name === active_info.name ?
                                        <Check className="size-3" />
                                        :
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g clipPath="url(#clip0_313_499)">
                                                <path d="M9.51562 0.0374994C9.44531 0.0562496 9.31875 0.103125 9.23437 0.142968C9.09375 0.210938 8.78906 0.508594 4.9125 4.38281L0.742969 8.55L0.372656 10.0336C0.16875 10.8516 0.00234375 11.5664 0 11.6203C0 11.8453 0.15 12 0.367969 12C0.525 12 3.37734 11.2898 3.48047 11.2266C3.51797 11.2008 5.39062 9.3375 7.64062 7.08516C10.807 3.91406 11.7492 2.95781 11.8125 2.85C11.9437 2.625 11.9836 2.47969 11.9953 2.18906C12.007 1.86797 11.9789 1.72031 11.8547 1.46953C11.7656 1.29141 11.7187 1.2375 11.2406 0.759375C10.6805 0.201562 10.568 0.119531 10.2516 0.0374994C10.0711 -0.00937557 9.6914 -0.00937557 9.51562 0.0374994ZM10.1508 0.839062C10.2211 0.874218 10.4016 1.03828 10.7039 1.34062C11.1 1.74375 11.1539 1.80703 11.1914 1.91953C11.2453 2.08125 11.2289 2.25703 11.1445 2.40937C11.107 2.47969 10.8961 2.70937 10.5867 3.01875L10.0898 3.51562L9.28594 2.71172L8.48203 1.90781L8.99297 1.40391C9.58828 0.813281 9.6539 0.768749 9.91406 0.780468C9.98906 0.785156 10.0898 0.808594 10.1508 0.839062ZM8.73047 3.28125L9.52734 4.07812L6.39141 7.21406L3.25781 10.3477L2.45625 9.54375L1.65234 8.74219L4.78125 5.61328C6.50156 3.89297 7.91484 2.48438 7.92187 2.48438C7.92891 2.48438 8.29219 2.84297 8.73047 3.28125ZM2.44219 10.6898C2.41641 10.7109 0.960937 11.0695 0.946875 11.0578C0.939844 11.0484 1.26328 9.68203 1.30312 9.56484C1.31016 9.54141 1.51172 9.72656 1.88672 10.1016C2.20312 10.418 2.45156 10.6805 2.44219 10.6898Z" fill="black" />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_313_499">
                                                    <rect width="12" height="12" fill="white" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    }
                                    {active_info && item.name === active_info.name ? 'done' : 'edit'}
                                </button>
                            }
                        </div>
                    ))}
                </div>
            </CommonInner>
        </>
    )
}
