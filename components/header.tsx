import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { TopNav } from "@/components/TopNav" 

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-3 gap-2 md:gap-0">
        <div className="flex items-center gap-3">
          <Image
            src="/bear-logo.png"
            alt="Bear Chef Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <h1 className="text-lg font-semibold md:text-xl">Fun tools for NFTs</h1>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <TopNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

