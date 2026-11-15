import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Fishing() {
    return <CatalogueSection title="Fishing" endpoint="/api/9w/games/reference?theme=dark&category=fishing" limit={40} icon={<CategoryTitleIcon category="fishing" />} showTools />
}
