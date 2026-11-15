import { Check } from "lucide-react";

export default function Checkbox({ onChange, className = "", type = "checkbox", name, id = "checkbox", title, checked }) {
  return (
    <>
      <style jsx={'true'}>{`
        .custom-checkbox input:checked~span .hidden {
              display: block;
          }
      `}</style>

      <label htmlFor={id} className={`custom-checkbox flex items-center gap-x-2 w-max cursor-pointer select-none relative ${className}`}>
        <input type={type} className='hidden peer' id={id} defaultChecked={checked} name={name || id} onChange={onChange} />
        <span className={`size-5 relative flex items-center justify-center flex-none ${type != 'radio' ? 'peer-checked:bg-primary2' : ''} ${type === "checkbox" ? 'rounded-sm bg-white peer-checked:bg-primary2' : 'rounded-full'}]`}>
          <Check className="size-3 text-heading hidden" />
        </span>
        {type === 'radio' && <span className="size-2 bg-[#01253A] rounded-full absolute top-1.5 left-1 hidden peer-checked:block" />}
        {title &&
          <span className={`select-none font-normal text-base text-white`}>{title || 'Title'}</span>
        }
      </label>
    </>
  )
}
