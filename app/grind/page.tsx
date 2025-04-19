// app/grind/page.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { DownloadIcon, RefreshCw, Share2, AlertCircle, MoveHorizontal, ArrowUpDown, Copy, Check, Layers2, Plus, Trash2, ArrowLeftRight } from "lucide-react"
import { NftSelector } from '@/components/NftSelector'
import NFTDropdownSelector from '@/components/NFTDropdownSelector'
import { OverlayPicker } from '@/components/OverlayPicker'
import { LazyNftItem } from '@/components/LazyNftItem'
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
import { useInView } from 'react-intersection-observer'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

interface OverlayState {
    id: string;
    src: string | null;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
}

const generateCanvasImage = async (nftSrc: string, overlays: OverlayState[], backgroundColor: string): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  const nftImage = await loadImage(nftSrc);
  canvas.width = nftImage.width;
  canvas.height = nftImage.height;

  const scaleX = canvas.width / 400;
  const scaleY = canvas.height / 400;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(nftImage, 0, 0);

  await Promise.all(overlays.map(async overlay => {
      if (overlay.src) {
          const img = await loadImage(overlay.src);
          const scaledX = overlay.position.x * scaleX;
          const scaledY = overlay.position.y * scaleY;
          const scaledW = overlay.size.width * scaleX;
          const scaledH = overlay.size.height * scaleY;

          ctx.save();
          ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
          ctx.restore();
      }
  }));

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
  });
}
const handleExport = async (selectedNft: string, overlays: OverlayState[], backgroundColor: string) => {
    try {
        const canvas = await generateCanvasImage(
            selectedNft,
            overlays,
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

const handleCopyToClipboard = async (selectedNft: string, overlays: OverlayState[], backgroundColor: string) => {
    try {
        const canvas = await generateCanvasImage(
            selectedNft,
            overlays,
            backgroundColor
        );
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
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
    const [selectedNft, setSelectedNft] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
    const [overlays, setOverlays] = useState<OverlayState[]>([]);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [selectedChains, setSelectedChains] = useState<string[]>(['eth-mainnet']);
    const [nfts, setNfts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const nftListRef = useRef<HTMLDivElement>(null);
    const [isDraggingOrResizing, setIsDraggingOrResizing] = useState(false);

    const proxiedNFT = selectedNft ? `/api/proxy?url=${encodeURIComponent(selectedNft)}` : null;

    const selectedOverlay = overlays.find(overlay => overlay.id === selectedOverlayId);


    const filteredNFTs = nfts.filter((nft) => {
      const collectionMatch = nft.collectionName && nft.collectionName.toLowerCase().includes(searchTerm.toLowerCase());
      const tokenMatch = nft.tokenId && nft.tokenId.toString().includes(searchTerm);
      const nameMatch = nft.name && nft.name.toLowerCase().includes(searchTerm.toLowerCase());
  
      return collectionMatch || tokenMatch || nameMatch;
    });

    const handleAddOverlay = (overlaySrc: string) => {
        const newOverlay: OverlayState = {
            id: uuidv4(),
            src: overlaySrc,
            position: { x: 100, y: 100 },
            size: { width: 150, height: 150 },
            rotation: 0,
        };
        setOverlays([...overlays, newOverlay]);
    };

    const handleUpdateOverlay = useCallback((id: string, updates: Partial<OverlayState>) => {
        setOverlays(prevOverlays =>
            prevOverlays.map(overlay =>
                overlay.id === id ? { ...overlay, ...updates } : overlay
            )
        );
    }, []);

    const handleRemoveOverlay = (id: string) => {
        setOverlays(prevOverlays => prevOverlays.filter(overlay => overlay.id !== id));
        setSelectedOverlayId(null);
    };

    const handleDuplicateOverlay = () => {
        if (selectedOverlay) {
            const newOverlay: OverlayState = {
                ...selectedOverlay,
                id: uuidv4(),
                position: { x: selectedOverlay.position.x + 20, y: selectedOverlay.position.y + 20 },
            };
            setOverlays([...overlays, newOverlay]);
        }
    };

    const handleClearAllOverlays = () => {
        setOverlays([]);
        setSelectedOverlayId(null);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) {
            return;
        }

        const reorderedOverlays = Array.from(overlays);
        const [removed] = reorderedOverlays.splice(result.source.index, 1);
        reorderedOverlays.splice(result.destination.index, 0, removed);

        setOverlays(reorderedOverlays);
    };

    const handleRotate = (direction: 'left' | 'right') => {
      if (selectedOverlayId && selectedOverlay) {
          handleUpdateOverlay(selectedOverlayId, {
              rotation: (selectedOverlay.rotation + (direction === 'left' ? -2 : 2)) % 360,
          });
      }
  };

  const handleIncreaseSize = () => {
      if (selectedOverlayId && selectedOverlay) {
          handleUpdateOverlay(selectedOverlayId, {
              size: {
                  width: selectedOverlay.size.width * 1.1,
                  height: selectedOverlay.size.height * 1.1,
              },
          });
      }
  };

  const handleDecreaseSize = () => {
      if (selectedOverlayId && selectedOverlay) {
          handleUpdateOverlay(selectedOverlayId, {
              size: {
                  width: selectedOverlay.size.width * 0.9,
                  height: selectedOverlay.size.height * 0.9,
              },
          });
      }
  };

  const moveOverlay = (direction: 'up' | 'down' | 'left' | 'right') => {
      if (selectedOverlayId && selectedOverlay) {
          const movement = 5;
          let newPosition = { ...selectedOverlay.position };
          switch (direction) {
              case 'up': newPosition.y -= movement; break;
              case 'down': newPosition.y += movement; break;
              case 'left': newPosition.x -= movement; break;
              case 'right': newPosition.x += movement; break;
          }
          handleUpdateOverlay(selectedOverlayId, { position: newPosition });
      }
  };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWalletAddress(e.target.value);
    };

   

    const handleFetchNFTs = async () => {
        if (!walletAddress) {
            setError('Please enter a wallet address');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, success, error } = await fetchNFTs([walletAddress], selectedChains);
            console.log("-----NFTS-----")
            console.log(data);
            if (success) setNfts(data.filter(nft => !nft.image || !nft.image.endsWith('.mp4'))); // Exclude videos
            else setError(error || 'An error occurred while fetching NFTs');
        } catch (err) {
            setError('An error occurred while fetching NFTs');
        } finally {
            setLoading(false);
        }
    };

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
                    <Label htmlFor="blockchain-select" className="block text-lg font-medium mb-2">Select Blockchain</Label>
                    <div className="flex items-center gap-2">
                        <Select value={selectedChains[0]} onValueChange={(value) => setSelectedChains([value])} className="flex-1">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a blockchain" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_CHAINS.map((chain) => (
                                    <SelectItem key={chain.id} value={chain.id}>{chain.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Button Load NFTs */}
                        <Button onClick={handleFetchNFTs} className="w-auto text-sm ml-auto">
                            Load NFTs
                        </Button>
                    </div>
                </div>
                
                {loading && <p>Loading NFTs...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                <NFTDropdownSelector
                  filteredNFTs={filteredNFTs}
                  onSelect={(nft) => setSelectedNft(nft)}
                  //onSelect={setSelectedNft}
                />
                
            </div>
            

            <div className="w-1/2 overflow-y-auto max-h-screen nft-scroll-area" ref={nftListRef}>
                
            <div className="flex flex-col items-center gap-4 w-full">
                    <OverlayPicker onSelect={handleAddOverlay} />

                    <div id="canvas" className="relative w-[400px] h-[400px] rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor }}>
                        <img src={proxiedNFT || '/overlays/01.png'} alt="Select a NFT" className="w-full h-full object-contain" />
                        {overlays.map((overlay, index) => (
                            <Rnd
                                key={overlay.id}
                                position={overlay.position}
                                size={overlay.size}
                                onDragStart={() => setIsDraggingOrResizing(true)}
                                onDragStop={(_, d) => {
                                    handleUpdateOverlay(overlay.id, { position: { x: d.x, y: d.y } });
                                    setIsDraggingOrResizing(false);
                                }}
                                onResizeStart={() => setIsDraggingOrResizing(true)}
                                onResizeStop={(_, __, ref, ___, position) => {
                                    handleUpdateOverlay(overlay.id, {
                                        size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                                        position: position,
                                    });
                                    setIsDraggingOrResizing(false);
                                }}
                                className={`hover-overlay ${selectedOverlayId === overlay.id ? 'border-blue-500 border-2' : ''}`}
                                enableResizing
                                lockAspectRatio
                                style={{
                                    position: 'absolute',
                                    background: 'transparent',
                                    //transform: `rotate(${overlay.rotation}deg)`,
                                    zIndex: index + 1, // Simple visual z-index
                                }}
                                onClick={() => setSelectedOverlayId(overlay.id)}
                            >
                                <img
                                    src={overlay.src || ''}
                                    alt={`Overlay ${index}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      transform: `rotate(${overlay.rotation}deg)`,
                                      transition: 'transform 0.2s ease-in-out',
                                    }}
                                    className="w-full h-full object-contain pointer-events-none"
                                />
                                {/* Better Visual Layer Indicator */}
                                <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs rounded-br px-1 py-0.5 opacity-70">{index + 1}</div>
                            </Rnd>
                        ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button onClick={() => handleRotate('left')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↺</button>
                        <button onClick={() => handleRotate('right')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↻</button>
                        <button onClick={handleIncreaseSize} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">+</button>
                        <button onClick={handleDecreaseSize} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">-</button>
                        <button onClick={() => moveOverlay('up')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↑</button>
                        <button onClick={() => moveOverlay('down')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">↓</button>
                        <button onClick={() => moveOverlay('left')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-whitedark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">←</button>
                        <button onClick={() => moveOverlay('right')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-md shadow w-10 h-10 flex items-center justify-center">→</button>
                    </div>
                    
                <h3 className="text-lg font-bold">Overlay Layers</h3>
                <Button onClick={handleClearAllOverlays} className="w-full" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="overlays">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {overlays.map((overlay, index) => (
                                    <Draggable key={overlay.id} draggableId={overlay.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`bg-white dark:bg-gray-700 p-2 rounded-md shadow-sm flex items-center justify-between ${selectedOverlayId === overlay.id ? 'border-blue-500 border-2' : ''}`}
                                                onClick={() => setSelectedOverlayId(overlay.id)}
                                            >
                                                <div className="w-10 h-10 rounded-md overflow-hidden">
                                                    <img src={overlay.src || '/overlays/01.png'} alt="Overlay Thumbnail" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="flex-grow ml-2 text-sm truncate">{overlay.src?.split('/').pop()}</span>
                                                <div className="flex items-center">
                                                    <ArrowUpDown className="w-4 h-4 mr-2 cursor-grab" />
                                                    <Button size="icon" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDuplicateOverlay();
                                                    }} className="mr-1">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="destructive" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveOverlay(overlay.id);
                                                    }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                {overlays.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No overlays added yet.</p>}
            
                    <div className="flex w-full max-w-md gap-2 mt-2">
                        <Button onClick={() => handleExport(proxiedNFT!, overlays, backgroundColor)} className="w-1/2">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => handleCopyToClipboard(proxiedNFT!, overlays, backgroundColor)} className="w-1/2">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy to Clipboard
                        </Button>
                    </div>
                </div>
                
            </div>

            
            
        </main>
    );
}