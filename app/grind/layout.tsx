import { Metadata } from 'next';

export const metadata = {
    title: "Grind Meme Generator / PFP Cutomizer", 
    description: "Edit your pic or your NFTs by adding $grind overlays!", 
    icons: {
      icon: "/overlays/Grind.png", 
      apple: "/overlays/Grind.png", 
    },
    openGraph: {
      type: "website",
      title: "Grind Meme Generator / PFP Cutomizer",
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
      title: "Grind Meme Generator / PFP Cutomizer",
      description: "Edit your pic or your NFTs by adding $grind overlays!",
      images: ["/grind-banner.png"], 
    },
  };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}