import PageTitle from '../../components/dashboard/page-title';
import CommonInner from '../../layout/dashboard/common-inner';
import TransactionList from '../../components/dashboard/transaction-list';

export default function PaymentTransfer() {
    return (
        <>
            <PageTitle title="Payment Transfer Log" />
            <CommonInner>
                <TransactionList />
            </CommonInner>
        </>
    )
}
