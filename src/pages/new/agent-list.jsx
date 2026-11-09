import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'
import whatsapp_icon from '@/assets/img/whatsapp.png'

const whatsappLink = (phone) => `https://wa.me/${String(phone).replace(/[^\d]/g, '')}`

const roleLabel = (role) => String(role || '').replace(/_/g, ' ')

function AgentRow({ agent }) {
    return (
        <a
            href={whatsappLink(agent.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[58px] items-center gap-3 rounded-md border border-line bg-surface py-2 pl-3 pr-1.5 transition-colors hover:bg-surface-2"
        >
            <img src={whatsapp_icon} className="size-[18px] shrink-0" alt="" />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-inter text-[14px] font-semibold text-white">{agent.name}</span>
                <span className="truncate font-inter text-[12px] text-gold">{agent.whatsapp}</span>
                <span className="truncate font-inter text-[10px] uppercase text-ink-soft">{roleLabel(agent.role)}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold text-on-gold" aria-hidden="true">
                <Send className="size-[18px]" strokeWidth={1.5} />
            </span>
            <span className="sr-only">Open WhatsApp chat with {agent.name}</span>
        </a>
    )
}

export default function AgentList() {
    const navigate = useNavigate()
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get('/api/agents', { auth: false })
            .then((response) => active && setAgents(response.data || []))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [])

    return (
        <div className="flex flex-1 flex-col bg-page pb-16">
            <header className="sticky top-0 z-20 bg-bar">
                <PageTitle
                    title="Agent List"
                    titleClass="font-poppins text-[15px] font-bold tracking-tight"
                    className="min-h-[51px]! bg-bar px-3! text-ink"
                    onClick={() => navigate('/')}
                />
            </header>

            <div className="flex flex-col gap-2.5 px-2.5 py-4 text-white">
                <p className="font-inter text-[13px] leading-5 text-ink-soft">
                    To open an account, contact any of the agents below on WhatsApp.
                </p>
                {loading
                    ? <Loader />
                    : error
                        ? <div role="alert" className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 font-inter text-xs text-red-200">{error}</div>
                        : agents.length > 0
                            ? agents.map((agent) => <AgentRow key={agent.id} agent={agent} />)
                            : <div className="grid h-[60px] place-items-center rounded-md border border-line bg-surface font-inter text-[14px] text-ink-soft">No Data</div>}
            </div>
        </div>
    )
}
