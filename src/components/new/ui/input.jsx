import { useState } from 'react'
import { Eye, EyeOff, Search } from 'lucide-react';

export default function Input({
    onChange,
    value,
    leftIcon,
    className = "",
    inputClass = "min-h-12.5",
    labelClass = "text-sm",
    type = "text",
    label,
    placeholder,
    error,
    id,
    name,
    required,
    children,
    autoComplete,
    min,
    max,
}) {
    const [newType, setNewType] = useState(type);
    const handleChange = () => {
        setNewType((prev) => prev === 'password' ? 'text' : 'password')
    }
    const [internalValue, setInternalValue] = useState('');
    const newValue = value ?? internalValue;
    const onchange = (e) => {
        if (value === undefined) setInternalValue(e.target.value);
        onChange?.(e);
    }
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = newValue?.length > 0;
    const isFloating = isFocused || hasValue;
    const common_class = `${type === 'search' || leftIcon ? 'px-12' : 'px-4'} ${isFloating ? 'border-primary' : 'border-[#3FE9FA]'} w-full font-medium text-base text-[#CFDCE4] placeholder:text-[#CFDCE4] border border-solid rounded-xl placeholder:transition-all placeholder:duration-300 focus:placeholder:translate-x-2 focus:placeholder:opacity-0 ring ring-transparent focus:ring-primary/30`
    return (
        <label htmlFor={id} className={`flex flex-col gap-y-2 ${className}`}>
            <div className="relative z-1">
                {(label || placeholder) &&
                    <span
                        className={`block font-normal leading-relaxed text-base absolute transition-all duration-300 z-1 pointer-events-none
                            ${type === 'search' || leftIcon ? 'left-12' : 'left-4'} 
                             ${isFloating
                                ? 'top-0 -translate-y-1/2 bg-[#022b43] text-white'
                                : 'top-1/2 -translate-y-1/2 text-[#91A8B5]'
                            }
                            ${labelClass}`
                        }
                    >
                        {placeholder} {required && '*'}
                    </span>
                }
                {type === 'textarea' ?
                    <textarea
                        onChange={onchange}
                        name={name}
                        value={newValue}
                        id={id}
                        aria-label={label || placeholder}
                        // placeholder={placeholder}
                        required={required}
                        className={`${common_class} min-h-25 ${inputClass}`}
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
                            aria-label={label || placeholder}
                            className={`${common_class} ${inputClass}`}
                            // placeholder={placeholder}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            required={required}
                            autoComplete={autoComplete}
                            min={min}
                            max={max}
                        />
                        {type === 'password' &&
                            <button type="button" onClick={() => handleChange()} className='absolute top-1/2 -translate-y-1/2 right-0 px-4'>
                                {newType === 'password' ? <Eye className='size-5 text-[#F5F8F9]' /> : <EyeOff className='size-5 text-[#F5F8F9]' />}
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
