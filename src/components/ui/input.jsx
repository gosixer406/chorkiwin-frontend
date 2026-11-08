import { useState } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react';

export default function Input({
    onChange,
    leftIcon,
    className = "",
    inputClass = "min-h-11",
    labelClass = "text-sm",
    type = "text",
    label,
    placeholder,
    error,
    id,
    name,
    required,
    children
}) {
    const [newType, setNewType] = useState(type);
    const handleChange = () => {
        setNewType((prev) => prev === 'password' ? 'text' : 'password')
    }
    const [newValue, setNewValue] = useState('');
    const onchange = (e) => {
        setNewValue(e.target.value);
        onChange?.(e);
    }

    const [isFocused, setIsFocused] = useState(false);
    const hasValue = newValue?.length > 0;
    const isFloating = isFocused || hasValue;

    const common_class = `${type === 'search' || leftIcon ? 'px-12' : 'px-4'} ${isFloating ? 'border-primary' : 'border-stroke'} w-full font-normal text-base text-heading placeholder:text-[#91A8B5] border border-solid rounded-xl placeholder:transition-all placeholder:duration-300 focus:placeholder:translate-x-2 focus:placeholder:opacity-0`

    return (
        <label htmlFor={id} className={`flex flex-col gap-y-2 ${className}`}>
            <div className="relative">
                {(label || placeholder) &&
                    <label
                        htmlFor=""
                        className={`block font-normal leading-relaxed text-base absolute transition-all duration-300 z-1 pointer-events-none
                            ${type === 'search' || leftIcon ? 'left-12' : 'left-4'} 
                             ${isFloating
                                ? 'top-0 -translate-y-1/2 bg-white text-para'
                                : 'top-1/2 -translate-y-1/2 text-[#91A8B5]'
                            }
                            ${labelClass}`
                        }
                    >
                        {placeholder} {required && '*'}
                    </label>
                }
                {type === 'textarea' ?
                    <textarea
                        onChange={onchange}
                        name={name}
                        value={newValue}
                        id={id}
                        // placeholder={placeholder}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        required={required}
                        className={`${common_class} min-h-25 ${inputClass}`}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    :
                    <div className="relative">
                        {children}
                        {leftIcon &&
                            <span className='absolute top-1/2 -translate-y-1/2 ltr:left-4 rtl:right-4 pointer-events-none'>{leftIcon}</span>
                        }
                        {type === 'search' &&
                            <span className='absolute top-1/2 -translate-y-1/2 ltr:left-4 rtl:right-4'>
                                <Search />
                            </span>
                        }
                        <input
                            type={newType}
                            onChange={onchange}
                            value={newValue}
                            name={name}
                            id={id}
                            className={`${common_class} ${inputClass}`}
                            // placeholder={placeholder}
                            required={required}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        {type === 'password' &&
                            <button onClick={() => handleChange()} className='absolute top-1/2 -translate-y-1/2 right-0 px-4'>
                                {newType === 'password' ? <Eye className='size-5 text-heading' /> : <EyeOff className='size-5 text-heading' />}
                            </button>
                        }
                    </div>
                }
            </div>
            {error &&
                <span className='text-sm leading-normal font-normal text-red-400 -mt-1'>{error}</span>
            }
        </label>
    )
}
