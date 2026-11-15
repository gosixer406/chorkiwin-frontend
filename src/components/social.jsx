import { FaWhatsapp } from "react-icons/fa";



export default function Social({ className = "", btnClass = "bg-black text-white size-9" }) {
  const socialIcons = [
    {
      name: 'whatsapp',
      icon: <FaWhatsapp />,
      url: 'https://wa.me/+447520636263',
    },
  ];
  return (
    <div className={`flex items-center flex-wrap gap-3 ${className}`}>
      {socialIcons.map((item, index) => (
        <a key={index} href={item.url} aria-label={item.name[0].toUpperCase() + item.name.slice(1)} className={`size-8 rounded-full flex items-center justify-center hover:bg-primary ${btnClass}`}>
          {item.icon}
        </a>
      ))}
    </div>
  )
}
