'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils' // à supprimer si tu ne l’as pas

export function TopNav() {
  const pathname = usePathname()

  const links = [
    { href: '/share', label: 'Share my Bag' },
    { href: '/grind', label: 'PFP Grinder' },
  ]

  return (
    <nav className="flex flex-col md:flex-row gap-2 md:gap-4">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors text-center',
            'bg-muted hover:bg-accent text-foreground',
            pathname === href &&
              'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
