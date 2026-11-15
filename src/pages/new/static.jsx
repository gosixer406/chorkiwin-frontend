import { useParams } from 'react-router-dom'
import PageTitle from '@/components/dashboard/page-title'
import { LEGAL_CONTENT } from '@/data/legal-content'
import Footer from '@/layout/new/footer'
import Nav from '@/layout/new/nav'
import Support from '@/components/support'

// Pages live at clean slugs (/static/responsible-gaming); old title links still work.
const slugOf = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const TITLE_BY_SLUG = Object.fromEntries(Object.keys(LEGAL_CONTENT).map((title) => [slugOf(title), title]))

export default function StaticPage() {
    const { document } = useParams()
    const raw = decodeURIComponent(document || '')
    const title = TITLE_BY_SLUG[slugOf(raw)] || raw
    // Bundled, trusted copy from src/data; keep its headings and line breaks.
    const content = LEGAL_CONTENT[title]

    return (
        <div className="new-version-shell mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page pb-[66px] font-inter text-sm text-white">
            <header className="sticky top-0 z-20 bg-account-header">
                <PageTitle title={title || 'Information'} titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
            </header>
            <main className="flex-1">
                {content ? (
                    <div className="flex flex-col gap-2.5 px-2.5 pb-6 pt-3">
                        <div className="flex items-center gap-2.5">
                            <span className="h-[13px] w-1 rounded-full bg-gold" aria-hidden="true" />
                            <h2 className="font-inter text-[14px] font-semibold text-white">{title}</h2>
                        </div>
                        <article
                            className="promotion-content rounded-md border border-line bg-surface p-3.5 text-[13px] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                ) : (
                    <div className="mx-2.5 mt-3 grid min-h-40 place-items-center rounded-md border border-line bg-surface p-4 text-[13px] text-ink-muted">This page is not available.</div>
                )}
                <Footer fullWidth />
            </main>
            <Support />
            <Nav />
        </div>
    )
}
