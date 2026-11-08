import { useEffect, useState } from 'react';
import PageTitle from '../../components/dashboard/page-title';
import Reload from '../../utilities/icons/reload';
import CommonInner from '../../layout/dashboard/common-inner';
import { useSelector } from 'react-redux';
import { api } from '@/lib/api';

export default function Turnover() {
    const user = useSelector((state) => state.auth.user) || {}
    const [rotating, setRotating] = useState(false);
    const handleClick = () => {
        if (rotating) return;
        setRotating(true);
        setTimeout(() => {
            setRotating(false);
        }, 1000);
    };
    const [turnover, setTurnover] = useState({ required: 0, completed: 0, remaining: 0, progress: 0 })

    useEffect(() => {
        let active = true
        api.get('/api/bonus/my-bonuses')
            .then((response) => {
                if (!active) return
                const rows = (response.data || []).filter((row) => ['active', 'pending'].includes(row.status))
                const required = rows.reduce((sum, row) => sum + Number(row.required_wager || row.bonus_wager?.required || 0), 0)
                const completed = rows.reduce((sum, row) => sum + Number(row.wagered_amount || row.bonus_wager?.wagered || 0), 0)
                const remaining = Math.max(0, required - completed)
                const progress = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0
                setTurnover({ required, completed, remaining, progress })
            })
            .catch(() => {})
        return () => { active = false }
    }, [])

    const target_process = turnover.progress

    return (
        <>
            <PageTitle title="Turnover" />
            <CommonInner>
                <div className="flex items-center gap-2 mb-8">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.81633 1.94532C8.53508 2.03438 8.35695 2.21719 8.17883 2.60157C8.09445 2.77969 7.26008 4.85625 6.32258 7.20469L4.61633 11.4844H2.76477C1.74758 11.4844 0.833516 11.5031 0.735079 11.5266C0.505391 11.5828 0.275704 11.7375 0.135079 11.9438C-0.0196087 12.1734 -0.0477337 12.6609 0.0835163 12.9188C0.200704 13.1484 0.350704 13.2891 0.571016 13.3828C0.833516 13.4906 5.39914 13.4906 5.66164 13.3828C5.87727 13.2891 6.03195 13.1484 6.13977 12.9328C6.18664 12.8438 6.8007 11.3344 7.49914 9.58125C8.19758 7.83282 8.7882 6.38438 8.80695 6.36094C8.8257 6.34219 9.54289 9.675 10.4054 13.7672C11.2632 17.8641 11.9945 21.3047 12.0273 21.4219C12.1116 21.7125 12.3929 21.9797 12.6929 22.0547C12.9601 22.125 13.321 22.0781 13.4945 21.9469C13.8366 21.6938 13.7757 21.9 15.4257 15.6891C16.2835 12.4734 16.996 9.84375 17.0101 9.84375C17.0288 9.84375 17.3241 10.5328 17.671 11.3766C18.0179 12.2203 18.3648 12.9891 18.4351 13.0922C18.6976 13.4531 18.6835 13.4531 21.107 13.4531C22.9398 13.4531 23.2773 13.4438 23.4273 13.3828C23.6476 13.2891 23.7976 13.1484 23.9148 12.9188C24.046 12.6609 24.0179 12.1734 23.8632 11.9438C23.7226 11.7375 23.4929 11.5828 23.2632 11.5266C23.1648 11.5031 22.3585 11.4844 21.4679 11.4844H19.8507L19.0116 9.45469C17.5304 5.89688 17.6054 6.04219 17.2351 5.85469C17.0148 5.7375 16.6116 5.72813 16.396 5.83125C16.307 5.87344 16.1616 5.98125 16.0773 6.07032C15.8898 6.26719 15.9929 5.90157 14.3616 12.0328C13.6679 14.6438 13.0913 16.7813 13.0773 16.7813C13.0632 16.7813 12.3882 13.6313 11.582 9.78282C10.771 5.93907 10.082 2.69063 10.0445 2.57344C9.96477 2.29219 9.64602 1.9875 9.3882 1.94532C9.28977 1.93125 9.16789 1.90782 9.11633 1.89844C9.06477 1.88907 8.92883 1.9125 8.81633 1.94532Z" fill="#002134" />
                    </svg>
                    <span className='text-heading font-bold'>{user.username || 'Player'}’s Turnover</span>
                    <button className='ml-auto size-12 rounded-[10px] flex items-center justify-center bg-primary' onClick={handleClick}>
                        <Reload rotating={rotating} />
                    </button>
                </div>

                <div className="bg-white rounded-xl py-3 px-4 flex flex-col gap-y-4">
                    <div className="flex items-center justify-between">
                        <span className='text-[#4D7992]'>Turnover Progress</span>
                        <strong className='text-2xl leading-normal text-heading font-bold'>{target_process}%</strong>
                    </div>
                    <div className="h-3 rounded-full bg-[#EBF1F4] relative z-1 overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${target_process}%` }}></div>
                    </div>
                    <strong className='font-bold text-heading text-center'>{turnover.remaining.toFixed(2)} remaining</strong>
                    <div className="flex items-center justify-between">
                        <span className='text-[#4D7992]'>{turnover.completed.toFixed(2)} completed</span>
                        <span className='text-[#4D7992]'>{turnover.required.toFixed(2)} required</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white rounded-xl py-1.5 px-4">
                        <span className='text-[#4D7992] block text-xs'>REQUIRED</span>
                        <strong className="text-bold text-lg leading-[130%] block text-center text-black mt-1.5">{turnover.required.toFixed(2)}</strong>
                    </div>

                    <div className="bg-white rounded-xl py-1.5 px-4">
                        <span className='text-[#4D7992] block text-xs'>COMPLETED</span>
                        <strong className="text-bold text-lg leading-[130%] block text-center text-[#00A63E] mt-1.5">{turnover.completed.toFixed(2)}</strong>
                    </div>

                    <div className="bg-white rounded-xl py-1.5 px-4">
                        <span className='text-[#4D7992] block text-xs'>REMAINING</span>
                        <strong className="text-bold text-lg leading-[130%] block text-center text-[#FB2C36] mt-1.5">{turnover.remaining.toFixed(2)}</strong>
                    </div>
                </div>
            </CommonInner>
        </>
    )
}
