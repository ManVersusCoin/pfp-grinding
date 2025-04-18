import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Welcome to PFP Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link
          href="/share"
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-all border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-2">👜 Share my Bag</h2>
          <p className="text-gray-600">Display your NFT collection layout beautifully.</p>
        </Link>
        <Link
          href="/grind"
          className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-all border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-2">🎨 PFP Grinder</h2>
          <p className="text-gray-600">Customize your favorite NFT with overlays and backgrounds.</p>
        </Link>
      </div>
    </main>
  )
}
