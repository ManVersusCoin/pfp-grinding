// app/grind/page.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { DownloadIcon, RefreshCw, Share2, AlertCircle, MoveHorizontal, ArrowUpDown, Copy, Check, Layers2, Plus, Trash2, ArrowLeftRight } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
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

import { Slider } from "@/components/ui/slider"
import { useInView } from 'react-intersection-observer'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

type OverlayType = 'image' | 'text';

interface OverlayState {
  id: string;
  type: OverlayType;
  src: string | null;
  text?: string;
  color?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
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
    const scaledX = overlay.position.x * scaleX;
    const scaledY = overlay.position.y * scaleY;
    const scaledW = overlay.size.width * scaleX;
    const scaledH = overlay.size.height * scaleY;
    if (overlay.type === 'image' && overlay.src) {
          const img = await loadImage(overlay.src);
          

          ctx.save();
          ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
          ctx.restore();
        } else if (overlay.type === 'text' && overlay.text) {
            ctx.save();
            const fontSize = overlay.fontSize || 30;
            const fontFamily = overlay.fontFamily || 'sans-serif';
            ctx.font = `${fontSize * scaleY}px ${fontFamily}`;
            ctx.fillStyle = overlay.color || '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
          
            const words = overlay.text.split(' ');
            let line = '';
            const lineHeight = fontSize * scaleY * 1.2;
            const scaledOverlayWidth = overlay.size.width * scaleX;
          
            const centerX = scaledX + scaledW / 2;
            const centerY = scaledY + scaledH / 2;
          
            // Translate + rotate before drawing text
            ctx.translate(centerX, centerY);
            ctx.rotate((overlay.rotation * Math.PI) / 180);
          
            let y = -scaledH / 2;
            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > scaledOverlayWidth && i > 0) {
                ctx.fillText(line, 0, y);
                line = words[i] + ' ';
                y += lineHeight;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, 0, y);
          
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
    const [backgroundColor, setBackgroundColor] = useState<string>('#00FFB3');
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
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const proxiedNFT = selectedNft ? `/api/proxy?url=${encodeURIComponent(selectedNft)}` : null;
    const [isImageLoading, setIsImageLoading] = useState(false);
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
            type: 'image',
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
        <main className="container mx-auto flex flex-col lg:flex-row p-4 gap-4">
            <div className="w-full lg:w-1/2 flex flex-col gap-4 items-center">
                <h1 className="text-2xl font-bold self-center">🎨 PFP Grinder</h1>

                <Card className="w-full max-w-2xl mx-auto mb-6 rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">Select Your NFT</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                    Fill your wallet address, select a Blockchain, Load NFTs, Select one, and start customizing it with some $GRIND overlays, copy and share!
                    </p>

                    {/* Wallet Address */}
                    <div>
                    <Label htmlFor="wallet-address" className="block text-lg font-medium">Wallet Address</Label>
                    <Input
                        id="wallet-address"
                        type="text"
                        value={walletAddress}
                        onChange={handleAddressChange}
                        placeholder="Enter wallet address"
                        className="w-full"
                    />
                    </div>

                    {/* Blockchain Select + Load Button */}
                    <div>
                    <Label htmlFor="blockchain-select" className="block text-lg font-medium mb-2">Select Blockchain</Label>
                    <div className="flex items-center gap-2">
                        <Select value={selectedChains[0]} onValueChange={(value) => setSelectedChains([value])}>
                        <SelectTrigger className="flex-1">
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

                        <Button onClick={handleFetchNFTs} className="text-sm ml-auto whitespace-nowrap">
                        Load NFTs
                        </Button>
                    </div>
                    </div>

                    {/* Loading / Error */}
                    {loading && <p className="text-sm text-gray-500">Loading NFTs...</p>}
                    {error && <p className="text-sm text-red-500">Error: {error}</p>}

                    {/* NFT Dropdown */}
                    <NFTDropdownSelector
                        filteredNFTs={filteredNFTs}
                        onSelect={(nft) => {
                            setIsImageLoading(true);
                            setSelectedNft(nft);
                        }}
                        />
                </CardContent>
                </Card>
                <Card className="max-w-2xl w-full mx-auto mt-6 rounded-2xl shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Upload Your Own Image</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                                    
                    <Input
                        id="upload-image"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                            setUploadedImage(reader.result as string);
                            setSelectedNft(null); // reset NFT if custom image is used
                            };
                            reader.readAsDataURL(file);
                        }
                        }}
                    />

                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
                    <Label htmlFor="background-color" className="text-lg font-medium">Background Color</Label>
                    <input
                        id="background-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-16 h-10 p-0 border rounded-md"
                    />
                    </div>
                    </CardContent>
                    </Card>

            </div>
            

            <div className="w-full lg:w-1/2 overflow-y-auto max-h-screen nft-scroll-area" ref={nftListRef}>
                
            <div className="flex flex-col items-center gap-4 w-full">
                    <OverlayPicker onSelect={handleAddOverlay} />
                    <Button
                        variant="outline"
                        onClick={() =>
                            setOverlays([
                            ...overlays,
                            {
                                id: uuidv4(),
                                type: 'text',
                                text: 'New Text',
                                color: '#000000',
                                src: null,
                                position: { x: 100, y: 100 },
                                size: { width: 150, height: 50 },
                                rotation: 0,
                                fontSize: 30,
                            },
                            ])
                        }
                        >
                        Add Text
                        </Button>
                        <div id="canvas" className="relative w-[400px] h-[400px] rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor }}>
                            {isImageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900" />
                                </div>
                            )}
                            <img
                                src={uploadedImage || proxiedNFT || '/overlays/Grind.png'}
                                alt="Selected image"
                                className="w-full h-full object-contain"
                                onLoad={() => setIsImageLoading(false)}
                                onError={() => setIsImageLoading(false)}
                            />


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
                                lockAspectRatio={overlay.type === 'image'}
                                style={{
                                    position: 'absolute',
                                    background: 'transparent',
                                    //transform: `rotate(${overlay.rotation}deg)`,
                                    zIndex: index + 1, // Simple visual z-index
                                }}
                                onClick={() => setSelectedOverlayId(overlay.id)}
                            >
                                {overlay.type === 'image' ? (
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
                                />) : (
                                    <div
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        color: overlay.color,
                                        //fontSize: `${Math.max(12, overlay.size.height / 3)}px`,
                                        fontSize: overlay.fontSize,
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transform: `rotate(${overlay.rotation}deg)`,
                                        fontWeight: 'bold',
                                        fontFamily: overlay.fontFamily || 'sans-serif',
                                      }}
                                      className="pointer-events-none"
                                    >
                                      {overlay.text}
                                    </div>
                                  )}
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
                {/*<Button onClick={handleClearAllOverlays} className="w-full" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>*/}

                <DragDropContext onDragEnd={onDragEnd} >
                    <Droppable droppableId="overlays">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="w-full px-4 space-y-1">
                                {overlays.map((overlay, index) => (
                                    <Draggable key={overlay.id} draggableId={overlay.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white dark:bg-gray-700 p-2 rounded-md shadow-sm flex flex-col w-full ${
                                          selectedOverlayId === overlay.id ? 'border-blue-500 border-2' : ''
                                        }`}
                                        onClick={() => setSelectedOverlayId(overlay.id)}
                                      >
                                        {overlay.type === 'text' ? (
                                          <div className="flex flex-col gap-1 mt-1 w-full">
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="color"
                                                value={overlay.color || '#000000'}
                                                onChange={(e) =>
                                                  handleUpdateOverlay(overlay.id, { color: e.target.value })
                                                }
                                                className="w-8 h-8 p-0"
                                              />
                                              <Input
                                                type="number"
                                                value={overlay.fontSize || 20}
                                                onChange={(e) =>
                                                  handleUpdateOverlay(overlay.id, {
                                                    fontSize: parseInt(e.target.value),
                                                  })
                                                }
                                                className="h-8 text-xs"
                                                style={{ width: '8ch' }}
                                              />
                                              <select
                                                value={overlay.fontFamily || 'sans-serif'}
                                                onChange={(e) =>
                                                  handleUpdateOverlay(overlay.id, {
                                                    fontFamily: e.target.value,
                                                  })
                                                }
                                                className="h-8 text-xs bg-white dark:bg-gray-800 border rounded px-1"
                                              >
                                                <option value="sans-serif">Sans Serif</option>
                                                <option value="serif">Serif</option>
                                                <option value="monospace">Monospace</option>
                                                <option value="Arial">Arial</option>
                                                <option value="Helvetica">Helvetica</option>
                                              </select>
                                              <div className="ml-auto flex items-center gap-1">
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicateOverlay();
                                                  }}
                                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveOverlay(overlay.id);
                                                  }}
                                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                            <Input
                                              type="text"
                                              value={overlay.text || ''}
                                              onChange={(e) =>
                                                handleUpdateOverlay(overlay.id, { text: e.target.value })
                                              }
                                              className="w-full h-8 text-sm"
                                              placeholder="Edit text"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex justify-between items-center gap-2 w-full">
                                            <img
                                              src={overlay.src || ''}
                                              alt="preview"
                                              className="w-10 h-10 object-contain border rounded shadow-sm bg-white dark:bg-gray-800"
                                            />
                                            <div className="ml-auto flex items-center gap-1">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDuplicateOverlay();
                                                }}
                                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                              >
                                                <Copy className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveOverlay(overlay.id);
                                                }}
                                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
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
                        <Button onClick={() => handleExport(uploadedImage || proxiedNFT || '/overlays/Grind.png', overlays, backgroundColor)} className="w-1/2">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => handleCopyToClipboard(uploadedImage || proxiedNFT || '/overlays/Grind.png', overlays, backgroundColor)} className="w-1/2">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy to Clipboard
                        </Button>
                    </div>
                </div>
                
            </div>

            
            
        </main>
    );
}