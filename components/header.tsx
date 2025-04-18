import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { TopNav } from "@/components/TopNav" // Import TopNav ici

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-2 px-4 mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/bear-logo.png" alt="Bear Chef Logo" width={40} height={40} className="rounded-full" />
          <h1 className="text-xl font-bold md:text-2xl">Share my NFT bag</h1>
        </div>
        <div className="flex items-center gap-6"> {/* Augmenté pour laisser de l'espace */}
          <TopNav />  {/* Ajout du TopNav à gauche */}
          <ThemeToggle /> {/* Le ThemeToggle à droite */}
        </div>
      </div>
    </header>
  )
}
