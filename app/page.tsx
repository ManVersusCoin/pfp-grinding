import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-background">
      <h1 className="text-3xl font-bold mb-8 text-center">Fun tools for NFTs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Share my Bag */}
        <Link
          href="/share"
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-3">
            <Image src="/icons/bag.png" alt="NFT Bag icon" width={40} height={40} />
            <h2 className="text-xl font-semibold">Share my NFT Bag</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Display your NFT collection layout beautifully. No wallet connection required.</p>
        </Link>

        {/* Grind my Pic */}
        <Link
          href="/grind"
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-3">
            <Image src="/icons/Grind.png" alt="Grind meme icon" width={40} height={40} />
            <h2 className="text-xl font-semibold">Grind my Pic</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your favorite NFT or a custom image with $GRIND overlays, add a hat or a cute hamster and create a grinding meme.
          </p>
        </Link>

        {/* Grind my Pic */}
        <Link
          href="/grind-hat"
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-3">
            <Image src="/icons/Grind.png" alt="Grind meme icon" width={40} height={40} />
            <h2 className="text-xl font-semibold">Add $grind accessory</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Select a collection, a token ID, an accessory, share, and grind.
          </p>
        </Link>

      </div>
    </main>
  )
}
