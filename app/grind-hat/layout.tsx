import { Metadata } from 'next';

export const metadata = {
    title: "Grind Hat adder / PFP Cutomizer", 
    description: "Grind Hat adder / PFP Cutomizer", 
    icons: {
      icon: "/overlays/Grind.png", 
      apple: "/overlays/Grind.png", 
    },
    openGraph: {
      type: "website",
      title: "Grind Hat adder / PFP Cutomizer",
      description: "Grind Hat adder / PFP Cutomizer",
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
      title: "Grind Hat adder / PFP Cutomizer",
      description: "Grind Hat adder / PFP Cutomizer",
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