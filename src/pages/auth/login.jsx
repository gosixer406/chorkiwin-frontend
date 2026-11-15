import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, writeSession } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { fetchFreshAccount } from '@/lib/refresh-account'

function safeReturnTo(search) {
    const value = new URLSearchParams(search).get('returnTo')
    return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function makeValidationCode() {
    return String(Math.floor(1000 + Math.random() * 9000))
}

function UserIcon({ className }) {
    return (
        <svg viewBox="0 0 51.51 69.08" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
            <path d="M22.64,34.74c10.12-1.08,20.12,3.59,25.27,12.39,4.16,7.12,6.86,20.15-4.36,21.64-11.52-.77-24.28.98-35.65,0-9.75-.84-8.79-11.6-5.98-18.38,3.47-8.37,11.65-14.68,20.72-15.65Z" />
            <path d="M23,.23c19.92-3.1,20.47,26.57,1.79,25.4C9.69,24.69,9.24,2.37,23,.23Z" />
        </svg>
    )
}

function PasswordIcon({ className }) {
    return (
        <svg viewBox="0 0 62.59 68.92" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
            <path d="M51.72,27.53c4.48-.52,9.72.85,10.44,5.93,1.27,8.88-.74,20.12.1,29.25-.39,2.91-2.1,5.17-4.96,5.95l-51.29.26c-2.2-.1-4.49-2.1-5.46-3.96-.38-.73-.34-1.78-.38-2.6-.47-9.8.24-19.77.18-29.58,1.07-4.6,5.84-5.64,9.99-5.24-.02-5.26-.18-10.92,2.11-15.76C20.63-5.46,46.02-3.32,51.07,15.21c1.12,4.09.52,8.12.65,12.33ZM41.56,27.53v-8.09c0-7.72-10.13-11.87-16.31-7.65-2.08,1.42-4.76,5.09-4.76,7.65v8.09h21.07ZM34.79,58.76v-7.71c6.98-4.62,2.06-15.89-6.13-12.9-5.76,2.1-6.22,9.89-1.02,12.9v7.71h7.15Z" />
        </svg>
    )
}

function ShieldIcon({ className }) {
    return (
        <svg viewBox="0 0 56.14 68.47" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
            <path d="M27.43.05c.43-.07.82-.1,1.22.1l27.14,12.19c-.24,8.88,1.35,19.45-.75,28.08-2.14,8.8-8.46,18.26-16.01,23.29-2.32,1.54-8.64,4.88-11.29,4.76-2.13-.1-7.72-2.95-9.69-4.17C8.89,58.64.94,46.22.18,35.38c-.53-7.58.28-15.44.2-23.04L27.43.05Z" />
        </svg>
    )
}

function HiddenEyeIcon() {
    return (
        <svg viewBox="0 0 100.05 86.09" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-hidden="true">
            <path d="M11.94,59.2C8.96,56.24,0,44.45,0,40.58c0-2.33,6.71-11.9,8.49-14.16,2.2-2.78,5.06-6.34,8.16-7.93v-.79S4.67,5.15,4.67,5.15C6.12,4.12,9.18-.4,10.82.03l79.91,80.78-5.12,5.28-15.8-15.1c-19.62,7.88-42.94,3.03-57.87-11.79ZM30.01,30.51c-9.27,16.81,5.31,35.09,23.94,32.65,1.52-.2,6.69-1.45,5.24-3.51-.38-.55-5.13-5.27-5.48-5.43-1.35-.61-5.08.07-7.52-.65-5.12-1.51-9.83-7.06-9.93-12.46-.03-1.4.94-2.67.31-4.04-.73-1.6-5.36-4.74-6.55-6.55Z" />
            <path d="M31.92,9.24c23.83-8.35,50.87.8,64.01,22.39.92,1.52,4.02,7.05,4.12,8.44.26,3.86-11.12,19.84-14.73,21.23-.71.27-.84.36-1.59.02s-11.71-11.31-11.93-12.14c3.18-10.73.23-22.42-9.72-28.4-6.57-3.95-13.33-3.89-20.49-1.81l-9.66-9.73Z" />
            <path d="M63.53,40.85l-13.07-14.17c7.35.63,13.96,6.34,13.07,14.17Z" />
        </svg>
    )
}

function VisibleEyeIcon() {
    return (
        <svg viewBox="0 0 100.22 68.5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-hidden="true">
            <path d="M43.42.29c21.39-2.06,41.83,6.79,53.04,25.37,1.3,2.15,4.15,7.21,3.72,9.48-.78,4.1-6.96,12.62-9.89,15.85-23.46,25.91-66.09,22.57-85.25-6.61C3.76,42.43-.39,35.45.03,33.47c.22-1.01,2.78-5.7,3.49-6.92C11.61,12.67,27.24,1.85,43.42.29ZM48.89,11.22c-18.5,1.01-28.43,22.98-16.53,37.52,14.4,17.58,42.69,6.02,40.68-17.17-1.04-11.98-12.39-21-24.15-20.35Z" />
            <path d="M48.32,20.5c11.19-1.43,19.52,10.84,13.61,20.71-7.74,12.92-27.75,5.48-25.26-9.41.9-5.37,6.23-10.61,11.65-11.31Z" />
        </svg>
    )
}

function AnimatedField({
    name,
    label,
    value,
    onChange,
    icon: Icon,
    type = 'text',
    autoComplete,
    inputMode,
    maxLength,
    placeholder,
    required = false,
    rightContent,
}) {
    const [focused, setFocused] = useState(false)
    const floating = focused || Boolean(value)

    return (
        <div className="relative w-full">
            <label
                className={`pointer-events-none absolute left-10 z-30 bg-white px-1 text-sm transition-all duration-300 ${floating
                    ? 'top-0 -translate-y-1/2 font-normal tracking-wide text-[#C29B23]'
                    : 'top-1/2 -translate-y-1/2 text-gray-400'
                }`}
            >
                {label}
            </label>

            <Icon className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 transition-colors duration-300 ${focused ? 'text-[#C29B23]' : 'text-[#6F8898]'}`} />

            <input
                aria-label={label}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={autoComplete}
                inputMode={inputMode}
                maxLength={maxLength}
                placeholder={placeholder}
                required={required}
                className={`h-11 w-full min-w-0 rounded-[10px] border bg-transparent px-3 py-1 pl-10 text-sm text-black shadow-xs outline-none transition-[border-color,border-width,box-shadow] duration-300 ease-in-out focus-visible:outline-none ${rightContent ? 'pr-10' : ''} ${focused
                    ? 'border-transparent ring-2 ring-[#C29B23]/25'
                    : 'border-[#6F8898] ring-0 ring-transparent'
                }`}
            />

            <div className={`pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[10px] transition-opacity duration-300 ${focused ? 'opacity-100' : 'opacity-0'}`}>
                <svg className="absolute inset-0 size-full" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect
                        x="0.5"
                        y="0.5"
                        width="calc(100% - 1px)"
                        height="calc(100% - 1px)"
                        rx="8"
                        stroke="#C29B23"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        pathLength="1"
                        strokeDasharray="0.5 1"
                        style={{ strokeDashoffset: focused ? 0 : 0.5, transition: 'stroke-dashoffset 0.6s ease-in-out' }}
                    />
                    <rect
                        x="0.5"
                        y="0.5"
                        width="calc(100% - 1px)"
                        height="calc(100% - 1px)"
                        rx="8"
                        stroke="#C29B23"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        pathLength="1"
                        strokeDasharray="0.5 1"
                        className="origin-center rotate-180"
                        style={{ strokeDashoffset: focused ? 0 : 0.5, transition: 'stroke-dashoffset 0.6s ease-in-out' }}
                    />
                </svg>
            </div>

            {rightContent}
        </div>
    )
}

export default function Login() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const mode = new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login'
    const [form, setForm] = useState({
        username: '',
        password: '',
        validation_code: '',
        phone: '',
        full_name: '',
        referral_code: new URLSearchParams(location.search).get('referral') || '',
    })
    const [validationCode, setValidationCode] = useState(makeValidationCode)
    const [showPassword, setShowPassword] = useState(false)
    const [remember, setRemember] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isLoggedIn) navigate(safeReturnTo(location.search), { replace: true })
    }, [isLoggedIn, location.search, navigate])

    const update = (name) => (event) => {
        setForm((current) => ({ ...current, [name]: event.target.value }))
    }

    const submit = async (event) => {
        event.preventDefault()
        if (mode === 'login' && form.validation_code !== validationCode) {
            setError('The validation code does not match. Please try again.')
            setValidationCode(makeValidationCode())
            setForm((current) => ({ ...current, validation_code: '' }))
            return
        }

        setLoading(true)
        setError('')
        try {
            const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
            const payload = mode === 'login'
                ? { username: form.username.trim(), password: form.password }
                : {
                    username: form.username.trim(),
                    password: form.password,
                    phone: form.phone.trim(),
                    full_name: form.full_name.trim(),
                    referral_code: form.referral_code.trim() || undefined,
                }
            const response = await api.post(path, payload, { auth: false })
            const session = {
                user: response.data.user,
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
            }
            // Store the tokens before reading the wallet, but do not render a
            // logged-in header until the authoritative balance is available.
            writeSession(session)
            let account = session.user
            try {
                account = await fetchFreshAccount()
            } catch {
                // The login response contains the current wallet as a safe
                // fallback if a transient connection issue interrupts sync.
            }
            dispatch(setSession({
                ...session,
                user: account,
            }))
            navigate(safeReturnTo(location.search), { replace: true })
        } catch (requestError) {
            setError(requestError.message || 'Unable to continue. Please check your details.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-full w-full flex-col items-center bg-white px-6 pb-[max(12px,env(safe-area-inset-bottom))]">
            <h1 className="pb-[12px] pt-[20px] text-center text-[27px] font-normal uppercase leading-[1.5] tracking-wide text-black">
                {mode === 'login' ? 'Login' : 'Register'}
            </h1>

            <form onSubmit={submit} className="w-full space-y-5 px-[10px] md:space-y-6">
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                {mode === 'register' && (
                    <AnimatedField
                        name="full_name"
                        label="Full name"
                        value={form.full_name}
                        onChange={update('full_name')}
                        icon={UserIcon}
                        autoComplete="name"
                        required
                    />
                )}

                <AnimatedField
                    name="username"
                    label="Username"
                    value={form.username}
                    onChange={update('username')}
                    icon={UserIcon}
                    autoComplete="username"
                    required
                />

                {mode === 'register' && (
                    <AnimatedField
                        name="phone"
                        label="Bangladesh mobile number"
                        value={form.phone}
                        onChange={update('phone')}
                        icon={UserIcon}
                        type="tel"
                        autoComplete="tel"
                        required
                    />
                )}

                <AnimatedField
                    name="password"
                    label="Password"
                    value={form.password}
                    onChange={update('password')}
                    icon={PasswordIcon}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    rightContent={(
                        <button
                            type="button"
                            tabIndex="-1"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((shown) => !shown)}
                            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 text-black transition-colors hover:text-gray-600"
                        >
                            {showPassword ? <VisibleEyeIcon /> : <HiddenEyeIcon />}
                        </button>
                    )}
                />

                {mode === 'login' && (
                    <AnimatedField
                        name="validation_code"
                        label="Validation Code"
                        value={form.validation_code}
                        onChange={update('validation_code')}
                        icon={ShieldIcon}
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="********"
                        required
                        rightContent={(
                            <strong
                                aria-label={`Validation code ${validationCode}`}
                                className="pointer-events-none absolute right-4 top-1/2 z-30 -translate-y-1/2 text-[2.14286rem] font-extrabold leading-none tracking-tight text-black"
                            >
                                {validationCode}
                            </strong>
                        )}
                    />
                )}

                {mode === 'register' && (
                    <AnimatedField
                        name="referral_code"
                        label="Referral code (optional)"
                        value={form.referral_code}
                        onChange={update('referral_code')}
                        icon={ShieldIcon}
                    />
                )}

                {mode === 'login' && (
                    <div className="flex items-center gap-[5px] py-1">
                        <button
                            id="remember-login"
                            type="button"
                            role="checkbox"
                            aria-label="Remember me"
                            aria-checked={remember}
                            data-state={remember ? 'checked' : 'unchecked'}
                            onClick={() => setRemember((checked) => !checked)}
                            className={`grid size-4 shrink-0 place-content-center rounded-[3px] border shadow-xs outline-none transition-shadow focus-visible:ring-[3px] ${remember
                                ? 'border-[#FFC107] bg-[#FFC107] text-black'
                                : 'border-[#0A3F5E] bg-[#0A3F5E] text-black'
                            }`}
                        >
                            {remember && <Check className="size-3.5" />}
                        </button>
                        <input
                            aria-hidden="true"
                            tabIndex="-1"
                            type="checkbox"
                            checked={remember}
                            readOnly
                            className="pointer-events-none absolute size-4 -translate-x-full opacity-0"
                        />
                        <label
                            htmlFor="remember-login"
                            onClick={(event) => {
                                event.preventDefault()
                                setRemember((checked) => !checked)
                            }}
                            className="cursor-pointer select-none text-base font-normal tracking-wide text-gray-800"
                        >
                            Remember me
                        </label>
                    </div>
                )}

                <div className="flex justify-center pb-[23px]">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-11 w-[200px] shrink-0 items-center justify-center rounded bg-[#FFC107] px-4 py-2 text-[15px] font-bold text-black shadow-md transition-all hover:bg-[#e6ae06] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
                    </button>
                </div>
            </form>
        </div>
    )
}
