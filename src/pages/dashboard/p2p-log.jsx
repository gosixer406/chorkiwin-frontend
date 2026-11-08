import PageTitle from '../../components/dashboard/page-title'
import CommonInner from '../../layout/dashboard/common-inner';
import TransactionList from '../../components/dashboard/transaction-list';

export default function P2pLog() {
    return (
        <>
            <PageTitle title="P2P Transfer Log" />
            <CommonInner>
                <TransactionList p2pOnly />
            </CommonInner>
        </>
    )
}
