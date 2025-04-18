'use client'

import { useState } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { NftSelector } from '@/components/NftSelector'
import { OverlayPicker } from '@/components/OverlayPicker'
import { fetchNFTs } from '@/app/actions/nft-actions'
import { SUPPORTED_CHAINS } from '@/lib/constants'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

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
      // Appel à l'API fetchNFTs pour récupérer les NFTs
      const { data, success, error } = await fetchNFTs([walletAddress], selectedChains)
      if (success) {
        setNfts(data) // Mets à jour l'état avec les NFTs récupérés
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
    <main className="container mx-auto flex p-4 gap-4">
      {/* Left Column (parameters and actions) */}
      <div className="w-1/2 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">🎨 PFP Grinder</h1>

        {/* Address and Blockchain Form */}
        <div className="mb-4">
          <Label htmlFor="wallet-address" className="block text-lg font-medium">Wallet Address</Label>
          <Input
            id="wallet-address"
            type="text"
            value={walletAddress}
            onChange={handleAddressChange}
            placeholder="Enter wallet address"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="blockchain-select" className="block text-lg font-medium">Select Blockchain</Label>
          <Select
            id="blockchain-select"
            value={selectedChains[0]}
            onChange={handleChainsChange}
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </Select>
        </div>

        <Button
          onClick={handleFetchNFTs}
          className="w-full"
        >
          Load NFTs
        </Button>

        {/* Display Loading and Error States */}
        {loading && <p>Loading NFTs...</p>}
        {error && <p className="text-red-500">{error}</p>}

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
      </div>

      {/* Right Column (NFT Selection) */}
      <div className="w-1/2 overflow-y-auto max-h-screen">
        <h2 className="text-xl font-bold mb-4">Select Your NFT</h2>
        {nfts.length > 0 ? (
          <NftSelector nfts={nfts} onSelect={setSelectedNft} />
        ) : (
          <p>No NFTs found</p>
        )}
      </div>
    </main>
  )
}
