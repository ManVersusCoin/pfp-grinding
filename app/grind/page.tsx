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

const generateCanvasImage = (
    nftSrc: string,
    overlaySrc: string | null,
    overlayPosition: { x: number; y: number },
    overlaySize: { width: number; height: number },
    rotation: number,
    backgroundColor: string
  ) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const nftImage = new Image();
    nftImage.src = nftSrc;
    nftImage.onload = () => {
      // Définir la taille du canvas en fonction de l'image NFT
      canvas.width = nftImage.width;
      canvas.height = nftImage.height;
  
      // Dessiner le NFT sur le canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(nftImage, 0, 0);
  
      // Si un overlay est sélectionné, on l'ajoute au canvas
      if (overlaySrc) {
        const overlayImage = new Image();
        overlayImage.src = overlaySrc;
        overlayImage.onload = () => {
          // Appliquer la rotation à l'overlay
          ctx.save();
          ctx.translate(overlayPosition.x + overlaySize.width / 2, overlayPosition.y + overlaySize.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(
            overlayImage,
            -overlaySize.width / 2,
            -overlaySize.height / 2,
            overlaySize.width,
            overlaySize.height
          );
          ctx.restore();
        };
      }
    };
  
    return canvas;
  };
  
  // Fonction pour gérer l'exportation et la copie dans le presse-papier
  const handleExport = (selectedNft: string, selectedOverlay: string | null, overlayPosition: { x: number, y: number }, overlaySize: { width: number, height: number }, rotation: number, backgroundColor: string) => {
    const canvas = generateCanvasImage(
      selectedNft,
      selectedOverlay,
      overlayPosition,
      overlaySize,
      rotation,
      backgroundColor
    );
  
    // Convertir le canvas en URL de l'image
    const dataUrl = canvas.toDataURL('image/png');
  
    // Créer un lien de téléchargement pour l'image générée
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'combined-image.png';
    link.click();
  };
  
  // Fonction pour copier l'image dans le presse-papier
  const handleCopyToClipboard = async (selectedNft: string, selectedOverlay: string | null, overlayPosition: { x: number, y: number }, overlaySize: { width: number, height: number }, rotation: number, backgroundColor: string) => {
    const canvas = generateCanvasImage(
      selectedNft,
      selectedOverlay,
      overlayPosition,
      overlaySize,
      rotation,
      backgroundColor
    );
  
    // Convertir le canvas en Blob et essayer de copier dans le presse-papier
    canvas.toBlob(async (blob) => {
      try {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob, // Utiliser le type de l'image comme MIME type
            }),
          ]);
          alert('Image copiée dans le presse-papier !');
        }
      } catch (err) {
        alert('Erreur lors de la copie dans le presse-papier');
      }
    }, 'image/png');
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



  const handleRotate = (direction: 'left' | 'right') => {
    setRotation((prev) => (direction === 'left' ? (prev - 2) % 360 : (prev + 2) % 360))
  }

  // Fonction pour augmenter la taille de l'overlay
  const handleIncreaseSize = () => {
    setOverlaySize((prev) => ({
      width: prev.width * 1.1,  // Augmente la taille de 10%
      height: prev.height * 1.1,
    }))
  }

  // Fonction pour diminuer la taille de l'overlay
  const handleDecreaseSize = () => {
    setOverlaySize((prev) => ({
      width: prev.width * 0.9,  // Réduit la taille de 10%
      height: prev.height * 0.9,
    }))
  }

  // Fonction pour déplacer l'overlay avec les flèches
  const moveOverlay = (direction: 'up' | 'down' | 'left' | 'right') => {
    setOverlayPosition((prev) => {
      const movement = 10; // Distance de mouvement
      switch (direction) {
        case 'up':
          return { x: prev.x, y: prev.y - movement }
        case 'down':
          return { x: prev.x, y: prev.y + movement }
        case 'left':
          return { x: prev.x - movement, y: prev.y }
        case 'right':
          return { x: prev.x + movement, y: prev.y }
        default:
          return prev
      }
    })
  }

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
          <Select value={selectedChains[0]} onValueChange={(value) => setSelectedChains([value])}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a blockchain" />
            </SelectTrigger>
            <SelectContent>
                {SUPPORTED_CHAINS.map((chain) => (
                <SelectItem key={chain.id} value={chain.id}>
                    {chain.name}
                </SelectItem>
                ))}
            </SelectContent>
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
            {selectedOverlay && (
              <Rnd
                size={overlaySize}
                position={overlayPosition}
                onDragStop={(_, d) => setOverlayPosition({ x: d.x, y: d.y })}
                onResizeStop={(_, __, ref, ___, position) => {
                  setOverlaySize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  })
                  setOverlayPosition(position)
                }}
                bounds="window"
                enableResizing
                lockAspectRatio
                style={{
                  transform: `rotate(${rotation}deg)`,
                  border: '2px dashed #ccc',
                }}
              >
                <img
                  src={selectedOverlay}
                  alt="Overlay"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </Rnd>
            )}
          </div>

          {/* Barre d'outils sous l'image */}
          <div className="flex gap-2 mt-4">
            {/* Boutons de rotation */}
            <button
              onClick={() => handleRotate('left')}
              className="bg-blue-600 text-white p-2 rounded-full shadow"
            >
              ↺
            </button>
            <button
              onClick={() => handleRotate('right')}
              className="bg-blue-600 text-white p-2 rounded-full shadow"
            >
              ↻
            </button>

            {/* Boutons pour agrandir/réduire */}
            <button
              onClick={handleIncreaseSize}
              className="bg-green-600 text-white p-2 rounded-full shadow"
            >
              +
            </button>
            <button
              onClick={handleDecreaseSize}
              className="bg-red-600 text-white p-2 rounded-full shadow"
            >
              -
            </button>

            {/* Flèches de déplacement */}
            <button
              onClick={() => moveOverlay('up')}
              className="bg-yellow-600 text-white p-2 rounded-full shadow"
            >
              ↑
            </button>
            <button
              onClick={() => moveOverlay('down')}
              className="bg-yellow-600 text-white p-2 rounded-full shadow"
            >
              ↓
            </button>
            <button
              onClick={() => moveOverlay('left')}
              className="bg-yellow-600 text-white p-2 rounded-full shadow"
            >
              ←
            </button>
            <button
              onClick={() => moveOverlay('right')}
              className="bg-yellow-600 text-white p-2 rounded-full shadow"
            >
              →
            </button>
          </div>

          <button onClick={() => handleExport(selectedNft, selectedOverlay, overlayPosition, overlaySize, rotation, backgroundColor)}>Download Image</button>

          
          <button onClick={() => handleCopyToClipboard(selectedNft, selectedOverlay, overlayPosition, overlaySize, rotation, backgroundColor)}>Copy to Clipboard</button>
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
