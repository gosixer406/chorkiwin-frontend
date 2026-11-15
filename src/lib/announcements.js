import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const timeFormat = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
})

function parse(value) {
    const date = value ? new Date(value) : null
    return date && !Number.isNaN(date.getTime()) ? date : null
}

/** `01/07/2026, 19:47:29 GMT+6` in the viewer's time zone. */
export function formatAnnouncementTime(value) {
    const date = parse(value)
    return date ? timeFormat.format(date) : ''
}

/** `1.7.2026`: when the announcement starts, or else when it was posted. */
export function formatAnnouncementDate(announcement) {
    const date = parse(announcement.starts_at) || parse(announcement.created_at)
    return date ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : ''
}

/** This site's live announcements (the backend picks the site from X-Tenant). */
export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState([])

    useEffect(() => {
        let active = true
        api.get('/api/notices')
            .then((response) => {
                if (active) setAnnouncements(Array.isArray(response.data) ? response.data : [])
            })
            .catch(() => {
                // The bar stays hidden; the rest of the page still works.
            })
        return () => {
            active = false
        }
    }, [])

    return announcements
}
