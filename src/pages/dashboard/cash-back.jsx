import { useState } from 'react';
import PageTitle from '../../components/dashboard/page-title';
import NotAvailable from '../../utilities/icons/not-available';
import CommonInner from '../../layout/dashboard/common-inner';

export default function CashBack() {
    const btns = [
        {
            name: 'My Cashback'
        },
        {
            name: 'Cashback History'
        },
    ]
    const [active_btn, set_active_btn] = useState(btns[0])

    return (
        <>
            <PageTitle title="Cash Back" />
            <CommonInner className={'px-0!'}>
                <div className="flex items-center justify-center px-8 gap-6 bg-[#DEE7EC]">
                    {btns.map((item, idx) => (
                        <button onClick={() => set_active_btn(item)} className={`flex items-center justify-center min-h-11 font-bold text-base leading-normal text-black border-b-2 border-solid ${active_btn.name === item.name ? 'border-black' : 'border-transparent'}`} key={idx}>{item.name}</button>
                    ))}
                </div>
                <div className="max-w-36 bg-white rounded-xl p-4 mx-auto m-auto w-full flex flex-col items-center gap-y-2 justify-center mt-18">
                    <NotAvailable />
                    <span className='text-base text-[#4F6173]'>Not Available</span>
                </div>
            </CommonInner>
        </>
    )
}
