import { MosaicGenerator } from "@/components/mosaic-generator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Share my bag - Create Beautiful NFT Mosaics",
  description: "Easily create and share mosaics of your favorite NFTs.",
  icons: {
    icon: "/bear-logo.png",
    apple: "/bear-logo.png",
  },
  openGraph: {
    type: "website",
    title: "Share my NFT bag",
    description: "Easily create and share mosaics of your favorite NFTs.",
    images: [
      {
        url: "/bear-logo.png",
        width: 800,
        height: 800,
        alt: "NFT Mosaic Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Share my NFT bag",
    description: "Easily create and share mosaics of your favorite NFTs.",
    images: ["/bear-logo.png"],
  },
}

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4 mb-8">
      <MosaicGenerator />
    </main>
  )
}

