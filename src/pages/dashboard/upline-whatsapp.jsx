import PageTitle from "../../components/dashboard/page-title";
import CommonInner from "../../layout/dashboard/common-inner";
import NotAvailable from "../../utilities/icons/not-available";
import whatsapp from "@/assets/img/whatsapp.png";

export default function UplineWhatsapp() {
  return (
    <>
      <PageTitle title="Upline Whatsapp" />
      <CommonInner>
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <strong className="font-medium text-black">Whatsapp Number</strong>
            <div className="bg-white rounded-xl p-2 flex items-center gap-2">
              <img src={whatsapp} className="size-6" alt="" />
              <span className="block text-base leading-normal text-[#1F64FF]">
                017********
              </span>
              <span className="flex items-center justify-center rounded-[10px] bg-primary ml-auto size-10">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                    fill="#002336"
                  />
                  <path
                    d="M17.5225 10.8901C18.1443 11.0885 18.7461 11.6122 18.9155 12.2519C19.0203 12.6419 19.027 14.1375 18.9445 14.5387C18.833 15.0736 18.3494 15.5751 17.9036 15.8604C17.7209 15.9763 17.4066 16.0142 17.3063 16.1078C17.1659 16.2393 16.9385 16.9815 16.7179 17.2623C16.3613 17.7147 15.7617 17.9376 15.1978 17.9934C14.6339 18.0491 13.7469 17.8841 13.3056 17.9911C13.1986 18.0179 13.1741 18.243 13.0648 18.3321C11.4133 19.665 9.81075 17.4562 11.05 16.3217C11.4445 15.9629 12.0485 15.8559 12.5589 16.0186C12.9801 16.1523 13.1651 16.7385 13.3925 16.7653C14.0678 16.6427 15.7105 17.1018 15.9177 16.2304C15.9556 16.0676 15.2692 15.7757 15.1689 15.2095C15.0552 14.5743 15.0641 12.526 15.1399 11.8574C15.209 11.2512 15.6325 10.7653 16.2632 10.7876C15.9645 4.98147 7.98089 5.0149 7.60199 10.792C8.14582 10.7118 8.64508 11.0327 8.83899 11.5253C8.74092 12.7021 8.97717 14.0929 8.84344 15.2408C8.79218 15.6821 8.56038 16.0052 8.10347 16.0766C5.97494 16.4087 4.92294 15.2809 5.00986 13.2081C5.04998 12.2408 5.35979 11.3336 6.34939 11.0038C6.50986 3.41237 17.2684 3.30093 17.5247 10.8901H17.5225Z"
                    fill="white"
                  />
                  <path
                    d="M9.8656 10.7515C10.1943 10.7515 10.4607 10.4851 10.4607 10.1564C10.4607 9.82777 10.1943 9.56134 9.8656 9.56134C9.53694 9.56134 9.27051 9.82777 9.27051 10.1564C9.27051 10.4851 9.53694 10.7515 9.8656 10.7515Z"
                    fill="white"
                  />
                  <path
                    d="M11.9486 10.7515C12.2773 10.7515 12.5437 10.4851 12.5437 10.1564C12.5437 9.82777 12.2773 9.56134 11.9486 9.56134C11.6199 9.56134 11.3535 9.82777 11.3535 10.1564C11.3535 10.4851 11.6199 10.7515 11.9486 10.7515Z"
                    fill="white"
                  />
                  <path
                    d="M14.079 10.754C14.4076 10.754 14.6741 10.4875 14.6741 10.1589C14.6741 9.83022 14.4076 9.56378 14.079 9.56378C13.7503 9.56378 13.4839 9.83022 13.4839 10.1589C13.4839 10.4875 13.7503 10.754 14.079 10.754Z"
                    fill="white"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <strong className="font-medium text-black">Agent Number</strong>
            <div className="max-w-full w-full bg-white rounded-xl p-8 flex flex-col items-center gap-y-2 justify-center">
              <NotAvailable />
              <span className="text-base text-[#4F6173]">Not Available</span>
            </div>
          </div>
        </div>
      </CommonInner>
    </>
  );
}
