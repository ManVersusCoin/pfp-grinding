'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-4">
      <div className="bg-white dark:bg-gray-800 shadow-md px-4 py-2 rounded-full flex gap-4">
        <Link
          href="/share"
          className={`font-medium ${pathname === '/share' ? 'text-blue-500 dark:text-blue-400' : ''}`}
        >
          Share my Bag
        </Link>
        <Link
          href="/grind"
          className={`font-medium ${pathname === '/grind' ? 'text-blue-500 dark:text-blue-400' : ''}`}
        >
          PFP Grinder
        </Link>
      </div>
    </nav>
  )
}
