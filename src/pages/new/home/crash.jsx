import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Crash() {
    return <CatalogueSection title="Crash" endpoint="/api/9w/games/reference?theme=dark&category=crash" limit={40} icon={<CategoryTitleIcon category="crash" />} showTools />
}
