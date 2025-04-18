// app/grind/page.tsx
'use client'

import { useState } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { DownloadIcon, RefreshCw, Share2, AlertCircle, MoveHorizontal, ArrowUpDown, Copy, Check } from "lucide-react"
import { NftSelector } from '@/components/NftSelector'
import { OverlayPicker } from '@/components/OverlayPicker'
import { fetchNFTs } from '@/app/actions/nft-actions'
import { SUPPORTED_CHAINS } from '@/lib/constants'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

import { Rnd } from 'react-rnd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import LazyLoad from 'react-lazyload'

const generateCanvasImage = (
  nftSrc: string,
  overlaySrc: string | null,
  overlayPosition: { x: number; y: number },
  overlaySize: { width: number; height: number },
  rotation: number,
  backgroundColor: string
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("Could not get canvas context"));

    const nftImage = new Image();
    nftImage.crossOrigin = "anonymous";
    nftImage.onload = () => {
      canvas.width = nftImage.width;
      canvas.height = nftImage.height;

      
      const scaleX = nftImage.width / 400;
      const scaleY = nftImage.height / 400;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(nftImage, 0, 0);

      if (overlaySrc) {
        const overlayImage = new Image();
        overlayImage.crossOrigin = "anonymous";
        overlayImage.onload = () => {
          ctx.save();

          // Applique le scale aux positions
          const scaledX = overlayPosition.x * scaleX;
          const scaledY = overlayPosition.y * scaleY;
          const scaledW = overlaySize.width * scaleX;
          const scaledH = overlaySize.height * scaleY;

          ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(overlayImage, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
          ctx.restore();

          resolve(canvas);
        };
        overlayImage.onerror = reject;
        overlayImage.src = overlaySrc;
      } else {
        resolve(canvas);
      }
    };
    nftImage.onerror = reject;
    nftImage.src = nftSrc;
  });
};

const handleExport = async (selectedNft: string, selectedOverlay: string | null, overlayPosition: { x: number, y: number }, overlaySize: { width: number, height: number }, rotation: number, backgroundColor: string) => {
    try {
        const canvas = await generateCanvasImage(
            selectedNft,
            selectedOverlay,
            overlayPosition,
            overlaySize,
            rotation,
            backgroundColor
        );
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'combined-image.png';
        link.click();
    } catch (error) {
        console.error("Error generating or downloading image:", error);
        alert('Error generating or downloading image');
    }
};

const handleCopyToClipboard = async (selectedNft: string, selectedOverlay: string | null, overlayPosition: { x: number, y: number }, overlaySize: { width: number, height: number }, rotation: number, backgroundColor: string) => {
    try {
        const canvas = await generateCanvasImage(
            selectedNft,
            selectedOverlay,
            overlayPosition,
            overlaySize,
            rotation,
            backgroundColor
        );
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob,
                        }),
                    ]);
                    //alert('Image copiée dans le presse-papier !');
                } catch (err) {
                    alert('Error generating canvas for clipboard:');
                    console.error("Clipboard write error:", err);
                }
            }
        }, 'image/png');
    } catch (error) {
        console.error("Error generating canvas for clipboard:", error);
        alert('Error generating canvas for clipboard:');
    }
};

export default function GrindPage() {
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff')
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [overlayPosition, setOverlayPosition] = useState({ x: 100, y: 100 })
  const [overlaySize, setOverlaySize] = useState({ width: 150, height: 150 })
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [selectedChains, setSelectedChains] = useState<string[]>(['eth-mainnet'])
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const proxiedNFT = selectedNft ? `/api/proxy?url=${encodeURIComponent(selectedNft)}` : null
  const proxiedOverlay = selectedOverlay

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation((prev) => (direction === 'left' ? (prev - 2) % 360 : (prev + 2) % 360))
  }

  const handleIncreaseSize = () => {
    setOverlaySize((prev) => ({ width: prev.width * 1.1, height: prev.height * 1.1 }))
  }

  const handleDecreaseSize = () => {
    setOverlaySize((prev) => ({ width: prev.width * 0.9, height: prev.height * 0.9 }))
  }

  const moveOverlay = (direction: 'up' | 'down' | 'left' | 'right') => {
    setOverlayPosition((prev) => {
      const movement = 5;
      switch (direction) {
        case 'up': return { x: prev.x, y: prev.y - movement }
        case 'down': return { x: prev.x, y: prev.y + movement }
        case 'left': return { x: prev.x - movement, y: prev.y }
        case 'right': return { x: prev.x + movement, y: prev.y }
        default: return prev
      }
    })
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value)
  }
  const filteredNFTs = nfts.filter((nft) =>
    (nft.collectionName ? nft.collectionName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (nft.tokenId ? nft.tokenId.toString().includes(searchTerm) : false)
  );
  
  const handleFetchNFTs = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, success, error } = await fetchNFTs([walletAddress], selectedChains)
      if (success) setNfts(data)
      else setError(error || 'An error occurred while fetching NFTs')
    } catch (err) {
      setError('An error occurred while fetching NFTs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto flex p-4 gap-4">
      <div className="w-1/2 flex flex-col gap-4 items-center">
                <h1 className="text-2xl font-bold self-center">🎨 PFP Grinder</h1>

                <div className="mb-4 w-full max-w-md">
                    <p className='my-2 text-sm'>Fill your wallet address, select a Blockchain, Load NFTs, Select one, and start customize it with some $GRIND overlays, copy and share !</p>
                    <Label htmlFor="wallet-address" className="block text-lg font-medium">Wallet Address</Label>
                    <Input id="wallet-address" type="text" value={walletAddress} onChange={handleAddressChange} placeholder="Enter wallet address" className="w-full" />
                </div>

                <div className="mb-4 w-full max-w-md">
                    <Label htmlFor="blockchain-select" className="block text-lg font-medium">Select Blockchain</Label>
                    <Select value={selectedChains[0]} onValueChange={(value) => setSelectedChains([value])}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a blockchain" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_CHAINS.map((chain) => (
                                <SelectItem key={chain.id} value={chain.id}>{chain.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleFetchNFTs} className="w-full max-w-md">Load NFTs</Button>

                {loading && <p>Loading NFTs...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                
                    <div className="flex flex-col items-center gap-4 w-full">
                        {/*
                        <BackgroundPicker value={backgroundColor} onChange={setBackgroundColor} />
                       */}
                        <OverlayPicker onSelect={setSelectedOverlay} />

                        <div id="canvas" className="relative w-[400px] h-[400px] rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor }}>
                            <img src={proxiedNFT || '/overlays/01.png'} alt="Select a NFT" className="w-full h-full object-contain" />
                            {selectedOverlay && (
                                <Rnd
                                    position={overlayPosition}
                                    size={overlaySize}
                                    onDragStop={(_, d) => setOverlayPosition({ x: d.x, y: d.y })}
                                    onResizeStop={(_, __, ref, ___, position) => {
                                        setOverlaySize({ width: parseInt(ref.style.width), height: parseInt(ref.style.height) });
                                        setOverlayPosition(position);
                                    }}
                                    //bounds="window"
                                    className="hover-overlay"
                                    enableResizing
                                    lockAspectRatio
                                    style={{
                                        border: '2px dashed #ccc',
                                        transform: `rotate(${rotation}deg)`,
                                        position: 'absolute',
                                    }}
                                >
                                    <img src={proxiedOverlay || ''} alt="Overlay" className="w-full h-full object-contain pointer-events-none" />
                                </Rnd>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4">
                            {/*
                            <button onClick={() => handleRotate('left')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↺</button>
                            <button onClick={() => handleRotate('right')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↻</button>
                            */}
                            <button onClick={handleIncreaseSize} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">+</button>
                            <button onClick={handleDecreaseSize} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">-</button>
                            <button onClick={() => moveOverlay('up')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↑</button>
                            <button onClick={() => moveOverlay('down')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↓</button>
                            <button onClick={() => moveOverlay('left')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">←</button>
                            <button onClick={() => moveOverlay('right')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">→</button>
                        </div>

                        <div className="flex w-full max-w-md gap-2 mt-2">
                            <Button onClick={() => handleExport(proxiedNFT!, proxiedOverlay, overlayPosition, overlaySize, rotation, backgroundColor)} className="w-1/2">
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                            <Button onClick={() => handleCopyToClipboard(proxiedNFT!, proxiedOverlay, overlayPosition, overlaySize, rotation, backgroundColor)} className="w-1/2">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy to Clipboard
                            </Button>
                        </div>
                    </div>
                
            </div>

      <div className="w-1/2 overflow-y-auto max-h-screen">

      <h2 className="text-xl font-bold mb-4">Select Your NFT</h2>

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by collection name or token ID"
          />
        </div>

        {/* NFT Selector with Lazy Loading */}
        {filteredNFTs.length > 0 ? (
          <div className="space-y-4">
            {filteredNFTs.map((nft) => (
              <LazyLoad key={nft.tokenId} height={80} offset={100} once>
                <div
                  onClick={() => setSelectedNft(nft.imageUrl)}
                  className="flex items-center cursor-pointer"
                >
                  <img
                    src={nft.imageUrl}
                    alt={nft.tokenId}
                    className="w-16 h-16 object-cover rounded-full mr-4"
                  />
                  <div>
                    <h4 className="text-sm font-semibold">{nft.collectionName}</h4>
                    <p className="text-xs text-gray-500">{nft.tokenId}</p>
                  </div>
                </div>
              </LazyLoad>
            ))}
          </div>
        ) : (
          <p>No NFTs found</p>
        )}
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
