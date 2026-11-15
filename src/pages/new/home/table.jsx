import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

export default function Table() {
    return <CatalogueSection title="Table Games" endpoint="/api/9w/games/reference?theme=dark&category=table" limit={40} icon={<CategoryTitleIcon category="table" />} showTools />
}
