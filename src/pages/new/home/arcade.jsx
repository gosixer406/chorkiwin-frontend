import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Arcade() {
    return <CatalogueSection title="Arcade" endpoint="/api/9w/games/reference?theme=dark&category=arcade" limit={40} icon={<CategoryTitleIcon category="arcade" />} showTools />
}
