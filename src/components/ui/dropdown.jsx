import { useState, useEffect, useRef } from 'react'
import { ArrowDown } from '../../utilities/icons';
import { AnimatePresence, motion } from 'framer-motion'

export default function Dropdown({ onClick,
  className = "",
  label,
  labelClass = 'text-sm',
  required,
  items = [],
  placeholder,
  btnClass = "min-h-11",
  dropdownClass = "left-0 w-full",
  dropdownPosition = "bottom"
}) {
  const [defaultItem, setDefaultItem] = useState('')

  useEffect(() => {
    setDefaultItem(typeof placeholder === 'string' ? { name: placeholder } : placeholder || { name: 'Select' })
  }, [placeholder])

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev)
  }
  const selectItem = (item) => {
    setDefaultItem(item);
    setIsOpen(false)
    onClick?.();
  }

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div ref={dropdownRef} className={`flex flex-col gap-y-2 ${className}`}>
      {label &&
        <label htmlFor="" className={`block font-normal leading-relaxed ${labelClass}`}>
          {label} {required && '*'}
        </label>
      }
      <div className="relative">
        <button onClick={toggleDropdown} className={`w-full px-2.5 border border-solid border-stroke rounded-lg flex items-center gap-1 justify-between font-medium text-xs bg-[#001f32] text-white ${btnClass}`}>
          <span className="flex items-center gap-2">
            {defaultItem.icon &&
              <span className='size-5.5 rounded-full overflow-hidden'>
                {defaultItem.code ?
                  <span className='bg-[#7281F0] size-full flex items-center justify-center text-sm text-white'>{defaultItem.icon}</span>
                  :
                  <img src={defaultItem.icon} className=' w-full h-full object-cover' alt="" />
                }
              </span>
            }
            <span className='line-clamp-1 text-left'>
              {defaultItem.name}
            </span>
          </span>
          <span className={`flex-none size-3.5 ${isOpen ? '-scale-y-100' : 'scale-y-100'}`}>
            <ArrowDown />
          </span>
        </button>

        <AnimatePresence>
          {isOpen &&
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: .2, delay: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className={`absolute ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} border border-solid border-stroke shadow-md rounded-lg px-2 py-2 bg-white max-h-50 overflow-y-auto z-1 ${dropdownClass}`}>
              {items.map((item, index) => (
                <button onClick={() => selectItem(item)} className={`mb-1 last:mb-0 flex items-center w-full gap-2 py-1.5 px-2 rounded text-xs hover:bg-stroke font-medium ${item.name === defaultItem.name ? 'bg-stroke text-white' : 'bg-transparent text-para'}`} key={index}>
                  {item.icon &&
                    <span className='size-5.5 rounded-full overflow-hidden'>
                      {item.code ?
                        <span className='bg-[#7281F0] size-full flex items-center justify-center text-sm text-white'>{item.icon}</span>
                        :
                        <img src={item.icon} className=' w-full h-full object-cover' alt="" />
                      }
                    </span>
                  }
                  <span className='line-clamp-1'>{item.name}</span>
                </button>
              ))}
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>
  )
}
