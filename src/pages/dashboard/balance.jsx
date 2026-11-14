import PageTitle from '../../components/dashboard/page-title';
import CommonInner from '../../layout/dashboard/common-inner';
import { useSelector } from 'react-redux';

export default function Balance() {
  const wallet = useSelector((state) => state.auth.user?.wallet) || {}
  const currency = 'BDT'
  const available = Number(wallet.available ?? wallet.main_balance ?? 0).toFixed(2)
  return (
    <>
      <PageTitle title="Balance Overview" />
      <CommonInner>
        <div className="rounded-xl bg-[#032F48] py-3 px-4 flex flex-col gap-y-2">
          <h4 className='text-white font-bold'>Your Balances</h4>
          <div className="flex items-center gap-x-5 font-bold ">
            <span className='text-base bg-primary rounded-[10px] text-black min-h-8 flex items-center px-3'>{currency}</span>
            <span className='text-2xl text-white leading-normal'>{available}</span>
          </div>
        </div>
        <div className="text-center mt-24">No transactions to show</div>
      </CommonInner>
    </>
  )
}
