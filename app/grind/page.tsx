'use client'

import { useState } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { NftSelector } from '@/components/NftSelector'
import { OverlayPicker } from '@/components/OverlayPicker'
import { fetchNFTs } from '@/app/actions/nft-actions'
import { SUPPORTED_CHAINS } from '@/lib/constants'

export default function GrindPage() {
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff')
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [selectedChains, setSelectedChains] = useState<string[]>(['eth-mainnet'])
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value)
  }

  const handleChainsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedChains(value ? [value] : [])
  }

  const handleFetchNFTs = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, success, error } = await fetchNFTs([walletAddress], selectedChains)
      if (success) {
        setNfts(data)
      } else {
        setError(error || 'An error occurred while fetching NFTs')
      }
    } catch (err) {
      setError('An error occurred while fetching NFTs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold">🎨 PFP Grinder</h1>

      {/* Address and Blockchain Form */}
      <div className="mb-4">
        <label htmlFor="wallet-address" className="block text-lg font-medium">Wallet Address</label>
        <input
          id="wallet-address"
          type="text"
          value={walletAddress}
          onChange={handleAddressChange}
          placeholder="Enter wallet address"
          className="p-2 border rounded-md"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="blockchain-select" className="block text-lg font-medium">Select Blockchain</label>
        <select
          id="blockchain-select"
          value={selectedChains[0]}
          onChange={handleChainsChange}
          className="p-2 border rounded-md"
        >
          {SUPPORTED_CHAINS.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleFetchNFTs}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Load NFTs
      </button>

      {/* Display Loading and Error States */}
      {loading && <p>Loading NFTs...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* NFT Selection */}
      {nfts.length > 0 && (
        <>
          <div className="mb-4">
            <label className="block text-lg font-medium">Select Your NFT</label>
            <NftSelector nfts={nfts} onSelect={setSelectedNft} />
          </div>

          {/* NFT Editing */}
          {selectedNft && (
            <>
              <BackgroundPicker value={backgroundColor} onChange={setBackgroundColor} />
              <OverlayPicker onSelect={setSelectedOverlay} />

              <div
                id="canvas"
                className="relative w-[400px] h-[400px] rounded-xl overflow-hidden shadow-lg"
                style={{ backgroundColor }}
              >
                <img src={selectedNft} alt="Selected NFT" className="w-full h-full object-contain" />
                {selectedOverlay && <EditableOverlay src={selectedOverlay} />}
              </div>

              <ExportButtons exportTargetId="canvas" />
            </>
          )}
        </>
      )}
    </main>
  )
}
