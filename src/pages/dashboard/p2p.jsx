import PageTitle from '../../components/dashboard/page-title'
import CommonInner from '../../layout/dashboard/common-inner';
import Input from '@/components/ui/input'
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function P2p() {
  const user = useSelector((state) => state.auth.user) || {}
  const walletId = user.id || user.username || 'Not available'
  const [form, setForm] = useState({ recipient: '', amount: '', note: '' })
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clearForm = () => {
    setForm({ recipient: '', amount: '', note: '' })
    setFormKey((value) => value + 1)
    setError('')
    setMessage('')
  }

  const transfer = async () => {
    setError('')
    setMessage('')
    if (!form.recipient.trim() || !form.amount) {
      setError('Enter a recipient wallet ID and transfer amount.')
      return
    }
    setLoading(true)
    try {
      const response = await api.post('/api/wallet/p2p', {
        recipient: form.recipient.trim(),
        amount: form.amount,
        note: form.note.trim(),
      })
      setMessage(response.message || 'Transfer completed successfully.')
      setForm({ recipient: '', amount: '', note: '' })
      setFormKey((value) => value + 1)
      window.dispatchEvent(new CustomEvent('velki:balance-changed'))
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the transfer.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <PageTitle title="P2P Transfer" />
      <CommonInner className={'py-7! sm:py-10!'}>
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <strong className='font-medium text-black text-[22px] leading-[130%]'>My Wallet ID</strong>
            <div className="bg-white rounded-md p-1.5 flex items-center gap-2">
              <div className="min-h-10 rounded-md border border-solid border-[#748FAA] bg-[#D9E3EA] w-full text-sm text-black flex items-center px-2 font-medium leading-[130%]">
                {walletId}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(walletId);
                  alert('Copy Successfully')
                }}
                className='flex-none ml-auto size-10 flex items-center justify-center rounded-xl bg-primary text-black'>
                <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.13991 0.0281239C0.605536 0.154686 0.130927 0.664452 0.0289738 1.22695C0.00436442 1.35 -0.00266683 3.18164 0.0008488 6.44062L0.0113957 11.468L0.0992863 11.6262C0.148505 11.7105 0.257489 11.8301 0.338349 11.8898C0.478974 11.9848 0.517646 11.9953 0.767255 11.9953C1.01686 11.9953 1.05554 11.9848 1.19616 11.8898C1.27702 11.8301 1.386 11.7105 1.43522 11.6262L1.52311 11.468L1.54069 6.73242L1.55827 2.00039L1.66374 1.84922C1.72702 1.75781 1.83952 1.66289 1.94499 1.61016L2.11725 1.51875L6.07585 1.50117C10.4915 1.48008 10.1364 1.50469 10.3579 1.23398C10.6426 0.889452 10.5688 0.376171 10.1962 0.112499L10.0415 0.00703049L5.66101 -9.53674e-07C3.10163 -9.53674e-07 1.22077 0.0105457 1.13991 0.0281239Z" fill="black" />
                  <path d="M4.15288 3.03047C3.70288 3.15351 3.35483 3.43828 3.15093 3.84609L3.03491 4.08515V9.74531V15.4055L3.13335 15.6129C3.32671 16.0312 3.64663 16.3125 4.06851 16.4426C4.28296 16.5094 4.40601 16.5129 8.64233 16.5129C12.8787 16.5129 13.0017 16.5094 13.2197 16.4426C13.6416 16.3125 13.9404 16.0523 14.1408 15.634L14.2498 15.4055V9.74531V4.08515L14.1337 3.84609C13.9298 3.43125 13.5818 3.15 13.1177 3.03047C12.8259 2.95312 4.43413 2.95664 4.15288 3.03047ZM12.3197 4.5914C12.4919 4.66875 12.6607 4.86562 12.7169 5.04844C12.7697 5.23125 12.7732 14.2523 12.7169 14.4492C12.6712 14.6145 12.4814 14.8324 12.3056 14.9168C12.1826 14.9801 12.0103 14.9836 8.64233 14.9836C5.27437 14.9836 5.1021 14.9801 4.97905 14.9168C4.80327 14.8324 4.61343 14.6145 4.56772 14.4492C4.51147 14.2523 4.51499 5.23125 4.56772 5.04844C4.62397 4.86562 4.77866 4.68984 4.95796 4.59844C5.10913 4.52461 5.11616 4.52461 8.64233 4.52461C12.0033 4.52461 12.1826 4.52812 12.3197 4.5914Z" fill="black" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <strong className='font-medium text-black text-[22px] leading-[130%]'>Transfer To</strong>
            <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
              {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              {message && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
              <Input
                key={`${formKey}-recipient`}
                type="text"
                placeholder="Recipient Wallet ID"
                inputClass="rounded-lg! min-h-11"
                onChange={(event) => setForm((value) => ({ ...value, recipient: event.target.value }))}
              />
              <Input
                key={`${formKey}-amount`}
                type="text"
                placeholder="Transfer Amount"
                inputClass="rounded-lg! min-h-11 pl-21!"
                labelClass="ml-17"
                onChange={(event) => setForm((value) => ({ ...value, amount: event.target.value }))}
                children={
                  <div className='absolute top-1/2 -translate-y-1/2 left-3'>
                    <svg width="55" height="19" viewBox="0 0 55 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.37477 4.686C5.82144 4.686 6.93211 4.94267 7.70677 5.456C8.48144 5.96 8.86877 6.79067 8.86877 7.948C8.86877 9.11467 8.47677 9.95933 7.69277 10.482C6.90877 10.9953 5.78877 11.252 4.33277 11.252H3.64677V14.5H1.46277V4.938C1.93877 4.84467 2.44277 4.77933 2.97477 4.742C3.50677 4.70467 3.97344 4.686 4.37477 4.686ZM4.51477 6.548C4.35611 6.548 4.19744 6.55267 4.03877 6.562C3.88944 6.57133 3.75877 6.58067 3.64677 6.59V9.39H4.33277C5.08877 9.39 5.65811 9.28733 6.04077 9.082C6.42344 8.87667 6.61477 8.494 6.61477 7.934C6.61477 7.66333 6.56344 7.43933 6.46077 7.262C6.36744 7.08467 6.22744 6.94467 6.04077 6.842C5.86344 6.73 5.64411 6.65533 5.38277 6.618C5.12144 6.57133 4.83211 6.548 4.51477 6.548ZM13.7065 14.626C13.1745 14.626 12.6425 14.6073 12.1105 14.57C11.5879 14.542 11.0419 14.4673 10.4725 14.346V4.938C10.9205 4.854 11.4105 4.79333 11.9425 4.756C12.4745 4.70933 12.9692 4.686 13.4265 4.686C14.0425 4.686 14.6072 4.73267 15.1205 4.826C15.6432 4.91 16.0912 5.05933 16.4645 5.274C16.8379 5.48867 17.1272 5.77333 17.3325 6.128C17.5472 6.47333 17.6545 6.90267 17.6545 7.416C17.6545 8.19067 17.2812 8.802 16.5345 9.25C17.1505 9.48333 17.5705 9.80067 17.7945 10.202C18.0185 10.6033 18.1305 11.056 18.1305 11.56C18.1305 12.5773 17.7572 13.3427 17.0105 13.856C16.2732 14.3693 15.1719 14.626 13.7065 14.626ZM12.6005 10.272V12.778C12.7592 12.7967 12.9319 12.8107 13.1185 12.82C13.3052 12.8293 13.5105 12.834 13.7345 12.834C14.3879 12.834 14.9152 12.7407 15.3165 12.554C15.7179 12.3673 15.9185 12.022 15.9185 11.518C15.9185 11.07 15.7505 10.7527 15.4145 10.566C15.0785 10.37 14.5979 10.272 13.9725 10.272H12.6005ZM12.6005 8.606H13.6645C14.3365 8.606 14.8172 8.522 15.1065 8.354C15.3959 8.17667 15.5405 7.89667 15.5405 7.514C15.5405 7.122 15.3912 6.84667 15.0925 6.688C14.7939 6.52933 14.3552 6.45 13.7765 6.45C13.5899 6.45 13.3892 6.45467 13.1745 6.464C12.9599 6.464 12.7685 6.47333 12.6005 6.492V8.606ZM23.6728 14.696C22.9915 14.696 22.4035 14.6027 21.9088 14.416C21.4141 14.22 21.0035 13.954 20.6768 13.618C20.3595 13.2727 20.1215 12.8667 19.9628 12.4C19.8135 11.924 19.7388 11.4013 19.7388 10.832V4.798H21.9228V10.65C21.9228 11.042 21.9648 11.378 22.0488 11.658C22.1421 11.9287 22.2635 12.1527 22.4128 12.33C22.5715 12.498 22.7581 12.6193 22.9728 12.694C23.1968 12.7687 23.4395 12.806 23.7008 12.806C24.2328 12.806 24.6621 12.6427 24.9888 12.316C25.3248 11.9893 25.4928 11.434 25.4928 10.65V4.798H27.6768V10.832C27.6768 11.4013 27.5975 11.924 27.4388 12.4C27.2801 12.876 27.0375 13.2867 26.7108 13.632C26.3841 13.968 25.9688 14.2293 25.4648 14.416C24.9608 14.6027 24.3635 14.696 23.6728 14.696Z" fill="#647D8D" />
                      <rect x="54" width="1" height="19" fill="#647D8D" />
                    </svg>
                  </div>
                }
              />
              <Input
                key={`${formKey}-note`}
                type="text"
                placeholder="Remark"
                inputClass="rounded-lg! min-h-11"
                onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={clearForm} className='btn bg-transparent hover:bg-black hover:text-white border border-solid text-black min-h-12'>Clear</button>
                <button type="button" disabled={loading} onClick={transfer} className='btn bg-primary hover:bg-black hover:text-white min-h-12 text-black disabled:opacity-60'>{loading ? 'Transferring…' : 'Transfer'}</button>
              </div>
            </div>
          </div>
        </div>
      </CommonInner>
    </>
  )
}
