import { useState } from "react";
import PageTitle from "../../components/dashboard/page-title";
import referral from "@/assets/img/referral.png";
import CommonInner from "../../layout/dashboard/common-inner";

export default function Referral() {
  const btns = [
    {
      name: "Invite",
    },
    {
      name: "Details",
    },
  ];
  const [active_btn, set_active_btn] = useState(btns[0]);
  return (
    <>
      <PageTitle title="Referral" />
      <CommonInner className={"px-0! "}>
        <div className="flex items-center justify-center px-8 gap-6 bg-[#DEE7EC] overflow-auto mb-6">
          {btns.map((item, idx) => (
            <button
              onClick={() => set_active_btn(item)}
              className={`flex w-max text-nowrap items-center justify-center min-h-11 font-bold text-base leading-normal text-black border-b-2 border-solid ${active_btn.name === item.name ? "border-black" : "border-transparent"}`}
              key={idx}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-y-6 px-4 pt-2">
          <div className="rounded-xl overflow-hidden">
            <img
              src={referral}
              className="size-full object-cover object-center"
              alt=""
            />
          </div>
          <div className="rounded-xl p-4 bg-[#EBF1F4]">
            <div className=" py-6 px-4 sm:min-h-75 flex flex-col items-center justify-center bg-background rounded-xl text-center">
              <div className="size-15 mb-6 rounded-full bg-[#ECE5C0] flex items-center justify-center mx-auto">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_40_5043)">
                    <path
                      d="M10.9031 0.0749989C10.1531 0.210938 9.30469 0.557812 8.60156 1.02187C8.17969 1.29844 7.29844 2.17969 7.01719 2.60625C6.54844 3.32344 6.21094 4.15312 6.07031 4.94062C6.01406 5.26875 6 5.74219 6 7.17656V9H5.41875C4.97813 9 4.76719 9.02344 4.55156 9.08906C3.8625 9.30469 3.27656 9.89531 3.075 10.5891C3.00938 10.8187 3 11.475 3 16.5047C3 21.9281 3.00469 22.1766 3.08906 22.4484C3.30469 23.1375 3.89531 23.7234 4.58906 23.925C4.81875 23.9906 5.60625 24 12 24C18.3938 24 19.1813 23.9906 19.4109 23.925C20.1047 23.7234 20.6953 23.1375 20.9109 22.4484C20.9953 22.1766 21 21.9281 21 16.5047C21 11.475 20.9906 10.8187 20.925 10.5891C20.7234 9.89531 20.1375 9.30469 19.4484 9.08906C19.2328 9.02344 19.0219 9 18.5813 9H18V7.17656C18 5.17031 17.9719 4.875 17.7141 4.10156C17.4 3.16875 16.9734 2.48438 16.2469 1.75312C15.3188 0.829687 14.2922 0.285936 13.0453 0.0703125C12.5391 -0.0187511 11.4047 -0.0140629 10.9031 0.0749989ZM13.05 2.17969C14.4281 2.57812 15.3984 3.54844 15.8297 4.95469C15.9563 5.36719 15.9563 5.36719 15.975 7.18125L15.9938 9H12H8.00625L8.025 7.18125C8.04375 5.36719 8.04375 5.36719 8.17031 4.95469C8.65313 3.38906 9.87188 2.31094 11.4516 2.05781C11.8688 1.99219 12.5953 2.04844 13.05 2.17969ZM12.5719 13.125C13.5984 13.4391 14.1891 14.5359 13.8844 15.5484C13.7672 15.9328 13.5 16.3219 13.2 16.5422L12.9844 16.7062V17.8969C12.9844 19.2 12.9609 19.3453 12.7359 19.6219C12.3563 20.0766 11.6438 20.0766 11.2641 19.6219C11.0344 19.3453 11.0156 19.2 11.0156 17.8969V16.7016L10.8188 16.5656C10.5328 16.3687 10.2375 15.9375 10.1203 15.5531C9.67031 14.0719 11.0906 12.6656 12.5719 13.125Z"
                      fill="#D08700"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_40_5043">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h4 className="text-heading font-bold mb-3 text-xl">
                Referrals Locked
              </h4>
              <p>Please make your first deposit to enable referrals.</p>
            </div>
          </div>
        </div>
      </CommonInner>
    </>
  );
}
