import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
    Check, Copy, Eye, EyeOff, LockKeyhole,
    Save, SquarePen, UserRound,
} from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'
import { setUser } from '@/lib/auth'
import { LogRow, Pagination } from '@/components/dashboard/activity-log'

const placeholderEmailSuffixes = ['@users.local', '@user.local', '@affiliate.local']
const isRealEmail = (email) => Boolean(email)
    && !placeholderEmailSuffixes.some((suffix) => String(email).toLowerCase().endsWith(suffix))

const splitName = (fullName, username) => {
    const parts = String(fullName || username || '').trim().split(/\s+/).filter(Boolean)
    return { first_name: parts.shift() || '', last_name: parts.join(' ') }
}

function SectionTitle({ icon: Icon, children }) {
    return <h2 className="flex items-center gap-x-2 px-1 pb-2 pt-4 font-poppins text-[14px] font-bold text-ink">
        <Icon className="size-4" strokeWidth={2} />
        {children}
    </h2>
}

function CardTitle({ children }) {
    return <div className="flex flex-col gap-2.5">
        <span className="font-poppins text-[15px] font-semibold tracking-wide text-ink">{children}</span>
        <span className="h-px w-full bg-line" />
    </div>
}

function EditButton({ onClick }) {
    return <button type="button" onClick={onClick} className="flex h-[26px] shrink-0 items-center gap-1.5 rounded-[5px] bg-linear-to-b from-gold-light to-gold-dark px-2.5 font-poppins text-[12px] font-semibold text-on-gold">
        <SquarePen className="size-4" strokeWidth={2} /> Edit
    </button>
}

function FormButtons({ onCancel, saving, saveLabel = 'Save', icon = false }) {
    return <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={onCancel} className="h-[38px] rounded-md border border-line bg-page font-poppins text-[14px] text-ink-soft hover:border-gold">Cancel</button>
        <button disabled={saving} className="flex h-[38px] items-center justify-center gap-2 rounded-md bg-linear-to-b from-gold-light to-gold-dark font-poppins text-[14px] font-semibold text-on-gold disabled:opacity-50">
            {icon && !saving && <Save className="size-[18px]" strokeWidth={2} />}
            {saving ? 'Saving…' : saveLabel}
        </button>
    </div>
}

function Field({ label, ...props }) {
    return <label className="block">
        <span className="sr-only">{label}</span>
        <input aria-label={label} {...props} className="h-[38px] w-full rounded-md border border-line bg-page px-3.5 font-poppins text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-gold" />
    </label>
}

function PasswordField({ label, value, onChange, autoComplete }) {
    const [visible, setVisible] = useState(false)
    return <div className="relative">
        <Field label={label} type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={label} autoComplete={autoComplete} required />
        <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible((current) => !current)} className="absolute right-0 top-0 grid h-[38px] w-10 place-items-center text-ink-soft">
            {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
    </div>
}

function LockSwitch({ checked, disabled, label, onChange }) {
    return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-[22px] w-[39px] shrink-0 rounded-full border transition-colors disabled:opacity-50 ${checked ? 'border-gold-dark bg-gold' : 'border-line bg-page'}`}>
        <span className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all ${checked ? 'left-[19px] bg-on-gold' : 'left-[2px] bg-ink-soft'}`} />
    </button>
}

export default function Settings() {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user) || {}
    const [profile, setProfile] = useState(() => splitName(user.full_name, user.username))
    const [profileEditing, setProfileEditing] = useState(false)
    const [emailEditing, setEmailEditing] = useState(false)
    const [emailFlow, setEmailFlow] = useState({ email: '', verification_id: '', otp: '', masked: '' })
    const [passwordEditing, setPasswordEditing] = useState(false)
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' })
    const [locks, setLocks] = useState({ password_locked: false, withdraw_locked: false })
    const [saving, setSaving] = useState('')
    const [copied, setCopied] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('activity')
    const [logPage, setLogPage] = useState(1)
    const [logs, setLogs] = useState([])
    const [logMeta, setLogMeta] = useState({})
    const [loadingLogs, setLoadingLogs] = useState(true)
    const [logReload, setLogReload] = useState(0)

    const verifiedEmail = isRealEmail(user.email)
    const { hash } = useLocation()

    // Sidebar links (#password-lock, #withdraw-lock) jump straight to their lock card.
    useEffect(() => {
        if (!hash) return
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [hash])

    useEffect(() => {
        let active = true
        api.get('/api/auth/security-locks')
            .then((response) => active && setLocks(response.data || {}))
            .catch((requestError) => active && setError(requestError.message || 'Unable to load security settings.'))
        return () => { active = false }
    }, [])

    useEffect(() => {
        let active = true
        const endpoint = activeTab === 'activity' ? '/api/auth/activity-logs' : '/api/auth/password-logs'
        api.get(`${endpoint}?page=${logPage}&limit=10`)
            .then((response) => {
                if (!active) return
                setLogs(response.data || [])
                setLogMeta(response.meta || {})
            })
            .catch((requestError) => active && setError(requestError.message || 'Unable to load the log.'))
            .finally(() => active && setLoadingLogs(false))
        return () => { active = false }
    }, [activeTab, logPage, logReload])

    const startAction = (name) => {
        setSaving(name)
        setError('')
        setMessage('')
    }

    const saveProfile = async (event) => {
        event.preventDefault()
        const fullName = `${profile.first_name} ${profile.last_name}`.trim()
        if (fullName.length < 2) return setError('Enter your first and last name.')
        startAction('profile')
        try {
            const response = await api.patch('/api/auth/profile', { full_name: fullName })
            dispatch(setUser({ ...user, ...response.data }))
            setProfileEditing(false)
            setMessage(response.message || 'Profile updated')
        } catch (requestError) {
            setError(requestError.message || 'Unable to update profile.')
        } finally {
            setSaving('')
        }
    }

    const saveEmail = async (event) => {
        event.preventDefault()
        startAction('email')
        try {
            if (!emailFlow.verification_id) {
                const response = await api.post('/api/auth/email/send-otp', { email: emailFlow.email })
                setEmailFlow((current) => ({ ...current, verification_id: response.data.verification_id, masked: response.data.email }))
                setMessage(response.message || 'Verification code sent')
            } else {
                const response = await api.post('/api/auth/email/verify-otp', { verification_id: emailFlow.verification_id, email: emailFlow.email, otp: emailFlow.otp })
                dispatch(setUser({ ...user, ...response.data.user }))
                setEmailEditing(false)
                setEmailFlow({ email: '', verification_id: '', otp: '', masked: '' })
                setMessage(response.message || 'Email address verified')
            }
        } catch (requestError) {
            setError(requestError.message || 'Unable to verify email.')
        } finally {
            setSaving('')
        }
    }

    const changePassword = async (event) => {
        event.preventDefault()
        if (passwords.new_password !== passwords.confirm) return setError('New passwords do not match.')
        startAction('password')
        try {
            const response = await api.post('/api/auth/change-password', { old_password: passwords.old_password, new_password: passwords.new_password })
            setPasswords({ old_password: '', new_password: '', confirm: '' })
            setPasswordEditing(false)
            if (user.must_change_password) dispatch(setUser({ ...user, must_change_password: false }))
            setMessage(response.message || 'Password updated successfully')
            if (activeTab === 'password') {
                setLoadingLogs(true)
                setLogPage(1)
                setLogReload((value) => value + 1)
            }
        } catch (requestError) {
            setError(requestError.message || 'Unable to update password.')
        } finally {
            setSaving('')
        }
    }

    const toggleLock = async (field, checked) => {
        const previous = locks[field]
        setLocks((current) => ({ ...current, [field]: checked }))
        startAction(field)
        try {
            const response = await api.patch('/api/auth/security-locks', { [field]: checked })
            setLocks(response.data)
            setMessage(response.message || 'Security lock updated')
        } catch (requestError) {
            setLocks((current) => ({ ...current, [field]: previous }))
            setError(requestError.message || 'Unable to update security lock.')
        } finally {
            setSaving('')
        }
    }

    const copyUsername = async () => {
        await navigator.clipboard.writeText(user.username || '')
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
    }

    const changeLogTab = (tab) => {
        if (tab === activeTab) return
        setLoadingLogs(true)
        setActiveTab(tab)
        setLogPage(1)
    }

    const changeLogPage = (page) => {
        if (page < 1 || page === logPage) return
        setLoadingLogs(true)
        setLogPage(page)
    }

    // This page's accent only: every gold-* utility below, and the shared pagination, resolves to it.
    return <div className="min-h-dvh bg-page text-white [--c-gold-dark:#4CC2FF] [--c-gold-light:#4CC2FF] [--c-gold:#4CC2FF]">
        <header className="sticky top-0 z-20 bg-account-header">
            <PageTitle title="Profile & Settings" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        </header>
        <main className="space-y-1 px-[13px] pb-8 pt-1">
            {(error || message) && <div role={error ? 'alert' : 'status'} className={`mb-2 rounded p-3 text-xs ${error ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{error || message}</div>}

            <section className="flex flex-col gap-1">
                <SectionTitle icon={UserRound}>Account Info</SectionTitle>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface px-3.5 py-4">
                        <CardTitle>Profile Info</CardTitle>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="grid size-[30px] shrink-0 place-items-center rounded-full border-2 border-[#2FA37C] text-ink"><UserRound className="size-4" /></span>
                                <span className="min-w-0 font-poppins">
                                    <strong className="block truncate text-[13px] font-semibold">{user.full_name || user.username || 'Player'}</strong>
                                    <span className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-soft"><span className="truncate">{user.username || 'player'}</span><button type="button" aria-label="Copy username" onClick={copyUsername} className="text-ink-muted">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5 -scale-x-100" />}</button></span>
                                </span>
                            </div>
                            {!profileEditing && <EditButton onClick={() => setProfileEditing(true)} />}
                        </div>
                        {profileEditing && <form onSubmit={saveProfile} className="space-y-2">
                            <Field label="First name" placeholder="Enter your first name..." value={profile.first_name} onChange={(event) => setProfile((current) => ({ ...current, first_name: event.target.value }))} required />
                            <Field label="Last name" placeholder="Enter your last name..." value={profile.last_name} onChange={(event) => setProfile((current) => ({ ...current, last_name: event.target.value }))} />
                            <FormButtons icon onCancel={() => { setProfileEditing(false); setProfile(splitName(user.full_name, user.username)) }} saving={saving === 'profile'} />
                        </form>}
                    </div>

                    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface px-3.5 py-4">
                        <CardTitle>Contact Info</CardTitle>
                        <div>
                            <div className="mb-2 flex items-end justify-between gap-3">
                                <div><span className="block font-poppins text-[13px] tracking-wide text-ink-soft">E-mail Verification</span>{!verifiedEmail && !emailEditing && <p className="mt-3.5 max-w-[220px] font-poppins text-[11px] leading-[1.3] tracking-wide text-ink-muted">Verify your email address is valid and accessible by you.</p>}</div>
                                {!verifiedEmail && !emailEditing && <button type="button" onClick={() => setEmailEditing(true)} className="h-[29px] shrink-0 rounded-[5px] bg-linear-to-b from-gold-light to-gold-dark px-4 font-poppins text-[12px] font-semibold text-on-gold">Add</button>}
                            </div>
                            {verifiedEmail && <div className="flex h-[38px] items-center justify-between rounded-md border border-line bg-page px-2.5 font-poppins text-[11px] text-ink"><span className="truncate">{user.email}</span><span className="ml-2 flex shrink-0 items-center gap-1 text-gold"><span className="grid size-[15px] place-items-center rounded-full bg-gold"><Check className="size-2.5 text-on-gold" strokeWidth={3.5} /></span><span className="text-[11px] font-semibold text-gold">Verified</span></span></div>}
                            {emailEditing && <form onSubmit={saveEmail} className="mt-3 space-y-2">
                                {!emailFlow.verification_id ? <Field type="email" label="Email address" placeholder="Enter your email address..." value={emailFlow.email} onChange={(event) => setEmailFlow((current) => ({ ...current, email: event.target.value }))} required /> : <><p className="text-xs text-ink-soft">Enter the 6-digit code sent to {emailFlow.masked}.</p><Field inputMode="numeric" maxLength={6} label="Verification code" placeholder="Verification code" value={emailFlow.otp} onChange={(event) => setEmailFlow((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '') }))} required /></>}
                                <FormButtons onCancel={() => { setEmailEditing(false); setEmailFlow({ email: '', verification_id: '', otp: '', masked: '' }) }} saving={saving === 'email'} saveLabel={emailFlow.verification_id ? 'Verify' : 'Save'} />
                            </form>}
                        </div>
                        <div><span className="mb-2.5 block font-poppins text-[13px] tracking-wide text-ink-soft">Phone Number</span><div className="flex h-[38px] items-center justify-between rounded-md border border-line bg-page px-2.5 font-poppins text-[11px] text-ink"><span>{user.phone || '—'}</span>{user.phone && <span className="ml-2 flex shrink-0 items-center gap-1 text-gold"><span className="grid size-[15px] place-items-center rounded-full bg-gold"><Check className="size-2.5 text-on-gold" strokeWidth={3.5} /></span><span className="text-[11px] font-semibold text-gold">Primary</span></span>}</div></div>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-1">
                <SectionTitle icon={LockKeyhole}>Security</SectionTitle>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col rounded-md border border-line bg-surface px-4 py-4">
                        <div className="mb-2.5 flex items-center justify-between gap-1"><div className="flex flex-col gap-1"><span className="font-poppins text-[13px] font-bold tracking-wide">Change Password</span><span className="font-poppins text-[11px] leading-4 tracking-wide text-ink-soft">Create your own password for security.</span></div>{!passwordEditing && <EditButton onClick={() => setPasswordEditing(true)} />}</div>
                        {passwordEditing && <form onSubmit={changePassword} className="space-y-2"><PasswordField label="Old password" value={passwords.old_password} onChange={(event) => setPasswords((current) => ({ ...current, old_password: event.target.value }))} autoComplete="current-password" /><PasswordField label="New password" value={passwords.new_password} onChange={(event) => setPasswords((current) => ({ ...current, new_password: event.target.value }))} autoComplete="new-password" /><PasswordField label="Confirm password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} autoComplete="new-password" /><FormButtons onCancel={() => { setPasswordEditing(false); setPasswords({ old_password: '', new_password: '', confirm: '' }) }} saving={saving === 'password'} /></form>}
                    </div>
                    <div id="password-lock" className="flex scroll-mt-14 flex-col rounded-md border border-line bg-surface px-4 py-4"><div className="flex items-center justify-between gap-3"><div className="flex flex-col gap-1"><span className="font-poppins text-[13px] font-bold tracking-wide">Password Change Lock</span><span className="max-w-[300px] font-poppins text-[11px] leading-4 tracking-wide text-ink-soft">Restrict your upline users from changing your password.</span></div><LockSwitch checked={Boolean(locks.password_locked)} disabled={saving === 'password_locked'} label="Restrict upline users from changing your password" onChange={(checked) => toggleLock('password_locked', checked)} /></div></div>
                    <div id="withdraw-lock" className="flex scroll-mt-14 flex-col rounded-md border border-line bg-surface px-4 py-4"><div className="flex items-center justify-between gap-3"><div className="flex flex-col gap-1"><span className="font-poppins text-[13px] font-bold tracking-wide">Withdrawal Lock</span><span className="font-poppins text-[11px] leading-4 tracking-wide text-ink-soft">Lock your account from making withdrawals.</span></div><LockSwitch checked={Boolean(locks.withdraw_locked)} disabled={saving === 'withdraw_locked'} label="Lock withdrawals" onChange={(checked) => toggleLock('withdraw_locked', checked)} /></div></div>

                    <div className="flex flex-col gap-4 rounded-md border border-line bg-surface px-3.5 py-4">
                        <div className="flex rounded-md border border-line bg-page p-1"><button type="button" onClick={() => changeLogTab('activity')} className={`flex-1 rounded-[3px] py-1.5 font-poppins text-[11px] tracking-tight ${activeTab === 'activity' ? 'bg-linear-to-b from-gold-light to-gold-dark font-semibold text-on-gold' : 'text-ink-muted hover:text-ink'}`}>Activity Log</button><button type="button" onClick={() => changeLogTab('password')} className={`flex-1 rounded-[3px] py-1.5 font-poppins text-[11px] tracking-tight ${activeTab === 'password' ? 'bg-linear-to-b from-gold-light to-gold-dark font-semibold text-on-gold' : 'text-ink-muted hover:text-ink'}`}>Password Log</button></div>
                        <div><h2 className="font-poppins text-[14px] font-semibold text-ink">{activeTab === 'activity' ? 'Activity Log' : 'Password Log'}</h2><div className="mt-3 h-px bg-line" /><div className="mt-3 flex items-center justify-between rounded-md border border-line bg-page px-2.5 py-2.5 font-poppins text-[10px] text-ink-soft"><span>Device</span><span>Action</span></div>{loadingLogs && <Loader />}{!loadingLogs && logs.map((row) => <LogRow key={row.id} row={row} passwordLog={activeTab === 'password'} />)}{!loadingLogs && logs.length === 0 && <p className="py-12 text-center font-poppins text-xs text-ink-muted">No Data Found!</p>}{!loadingLogs && <Pagination meta={logMeta} page={logPage} onChange={changeLogPage} />}</div>
                    </div>
                </div>
            </section>
        </main>
    </div>
}
