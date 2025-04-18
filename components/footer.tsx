import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          Made with <Heart className="inline-block h-4 w-4 text-red-500 animate-pulse" /> by{" "}
          <a
            href="https://x.com/man_versus_coin"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            @man_versus_coin
          </a>{" "}
          during{" "}
          <a
            href="https://x.com/bearish_af"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            @bearish_af
          </a>{" "}
          builder sprint
        </p>
      </div>
    </footer>
  )
}

