import PageTitle from '../../components/dashboard/page-title'
import CommonInner from '../../layout/dashboard/common-inner';
import Switch from '../../components/ui/switch'

export default function Setting() {
    return (
        <>
            <PageTitle title="Setting" />
            <CommonInner className={'py-7! sm:py-10!'}>
                <div className="flex flex-col gap-y-2 mb-4">
                    <strong className='font-medium text-black text-[22px] leading-[130%]'>Odds</strong>
                    <div className="bg-white rounded-lg px-4 py-2.5">
                        <Switch
                            id="odds"
                            className='flex-row-reverse justify-between'
                            titleClass='text-[#002134]! font-normal! text-base!'
                            title="Highlight when odds change"
                            switchClass='bg-[#8EAFC2] border-[#8EAFC2] [&_span]:bg-[#F5F8F9] has-checked:bg-primary'
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-y-2">
                    <strong className='font-medium text-black text-[22px] leading-[130%]'>Events widget</strong>
                    <div className="bg-white rounded-lg px-4 py-2.5">
                        <Switch
                            id="events"
                            className='flex-row-reverse justify-between'
                            titleClass='text-[#002134]! font-normal! text-base!'
                            title="Show in Full-Markets"
                            switchClass='bg-[#8EAFC2] border-[#8EAFC2] [&_span]:bg-[#F5F8F9] has-checked:bg-primary'
                        />
                    </div>
                </div>
            </CommonInner>
        </>
    )
}
