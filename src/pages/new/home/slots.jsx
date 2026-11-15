import CatalogueSection from '@/components/new/catalogue-section'
import CategoryTitleIcon from '@/components/new/category-title-icon'

const slotProviderOrder = ['JILI', 'JDB', 'BNG']

export default function Slots() {
    return <CatalogueSection title="Slots" endpoint="/api/9w/games/reference?theme=dark&category=slots" limit={40} icon={<CategoryTitleIcon category="slots" />} showTools providerOrder={slotProviderOrder} />
}
