import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Casino() {
    return <CatalogueSection title="Casino" endpoint="/api/9w/games/reference?theme=dark&category=live" limit={40} icon={<CategoryTitleIcon category="casino" />} showTools />
}
