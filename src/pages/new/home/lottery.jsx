import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Lottery() {
    return <CatalogueSection title="Lottery" endpoint="/api/9w/games/reference?theme=dark&category=lottery" limit={40} icon={<CategoryTitleIcon category="lottery" />} showTools />
}
