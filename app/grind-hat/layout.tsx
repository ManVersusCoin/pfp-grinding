import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Grind Meme Generator / PFP Customizer",
  description: "Edit your pic or your NFTs by adding $grind overlays!",
  icons: {
    icon: "/overlays/Grind.png",
    apple: "/overlays/Grind.png",
  },
  openGraph: {
    type: "website",
    title: "Grind Meme Generator / PFP Customizer",
    description: "Edit your pic or your NFTs by adding $grind overlays!",
    images: [
      {
        url: "/overlays/Grind.png",
        width: 1200,
        height: 630,
        alt: "NFT Editing Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grind Meme Generator / PFP Customizer",
    description: "Edit your pic or your NFTs by adding $grind overlays!",
    images: ["/overlays/Grind.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}
