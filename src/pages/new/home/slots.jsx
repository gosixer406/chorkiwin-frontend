import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

// Provider pill order now comes from the Mother Panel (Casino Games →
// Provider Order → Slots); the backend returns meta.providers already ordered.
export default function Slots() {
    return <CatalogueSection title="Slots" endpoint="/api/9w/games/reference?theme=dark&category=slots" limit={40} icon={<CategoryTitleIcon category="slots" />} showTools />
}
