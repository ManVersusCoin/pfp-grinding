'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-4 right-4 z-50">
      <div className="bg-white shadow-md px-4 py-2 rounded-full flex gap-4">
        <Link
          href="/share"
          className={`font-medium ${pathname === '/share' ? 'text-blue-500' : ''}`}
        >
          Share my Bag
        </Link>
        <Link
          href="/grind"
          className={`font-medium ${pathname === '/grind' ? 'text-blue-500' : ''}`}
        >
          PFP Grinder
        </Link>
      </div>
    </nav>
  )
}
