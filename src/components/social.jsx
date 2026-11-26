import { FaWhatsapp } from "react-icons/fa";



export default function Social({ className = "", btnClass = "bg-black text-white size-9" }) {
  const socialIcons = [
    {
      name: 'whatsapp',
      icon: <FaWhatsapp />,
      url: '',
    },
  ];
  return (
    <div className={`flex items-center flex-wrap gap-3 ${className}`}>
      {socialIcons.map((item, index) => {
        const label = item.name[0].toUpperCase() + item.name.slice(1);
        const look = `size-8 rounded-full flex items-center justify-center hover:bg-primary ${btnClass}`;
        return item.url ? (
          <a key={index} href={item.url} aria-label={label} className={look}>
            {item.icon}
          </a>
        ) : (
          <span key={index} role="img" aria-label={label} className={look}>
            {item.icon}
          </span>
        );
      })}
    </div>
  )
}
