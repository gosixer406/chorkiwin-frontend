import { Link } from 'react-router-dom'
import logo from '../assets/img/logo.png'

export default function Logo({ className }) {
  return (
    <Link className={`block cursor-pointer ${className}`} to="/">
      <img src={logo} className='h-[31px] w-[100px] object-contain' alt="site-logo" />
    </Link>
  )
}
