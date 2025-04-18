"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { NFT } from "@/types/nft"
import { DownloadIcon, RefreshCw, Share2, AlertCircle, MoveHorizontal, ArrowUpDown, Copy, Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useToast } from "@/hooks/use-toast"

interface MosaicPreviewProps {
  selectedNFTs: NFT[]
  rows: number
  columns: number
  imageWidth: number
  backgroundColor: string
  onReorderNFTs?: (reorderedNFTs: NFT[]) => void
}

// Sortable NFT Item component
function SortableNFTItem({
  nft,
  index,
  rows,
  columns,
  cellSize,
}: {
  nft: NFT
  index: number
  rows: number
  columns: number
  cellSize: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: nft.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: cellSize,
    height: cellSize,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  }

  const row = Math.floor(index / columns)
  const col = index % columns

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative cursor-move border border-border bg-card rounded-md overflow-hidden touch-none"
      {...attributes}
      {...listeners}
    >
      <img
        src={nft.image || "/placeholder.svg"}
        alt={nft.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = `/placeholder.svg?height=${cellSize}&width=${cellSize}&text=${encodeURIComponent(nft.name)}`
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
        <MoveHorizontal className="h-8 w-8 text-white" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">{nft.name}</div>
    </div>
  )
}

export function MosaicPreview({
  selectedNFTs,
  rows,
  columns,
  imageWidth,
  backgroundColor,
  onReorderNFTs,
}: MosaicPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg">("png")
  const [error, setError] = useState<string | null>(null)
  const [loadedImages, setLoadedImages] = useState<number>(0)
  const [totalImages, setTotalImages] = useState<number>(0)
  const [failedImages, setFailedImages] = useState<number>(0)
  const [mosaicDataUrl, setMosaicDataUrl] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const { toast } = useToast()

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  )

  // Initialize NFTs state from props
  useEffect(() => {
    setNfts([...selectedNFTs])
  }, [selectedNFTs])

  useEffect(() => {
    if (!isEditMode) {
      generateMosaic()
    }
  }, [nfts, rows, columns, imageWidth, backgroundColor, isEditMode])

  // Function to check if a URL is a video file
  const isVideoFile = (url: string): boolean => {
    if (!url) return false

    // Check file extension
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv", ".flv", ".mkv"]
    const lowerCaseUrl = url.toLowerCase()

    // Check if URL ends with a video extension
    if (videoExtensions.some((ext) => lowerCaseUrl.endsWith(ext))) {
      return true
    }

    // Check if URL contains video mime type indicators
    if (
      lowerCaseUrl.includes("video/") ||
      lowerCaseUrl.includes("=video") ||
      lowerCaseUrl.includes("content-type=video") ||
      lowerCaseUrl.includes("contenttype=video") ||
      lowerCaseUrl.includes("media-type=video")
    ) {
      return true
    }

    return false
  }

  // Function to create a video thumbnail placeholder
  const createVideoPlaceholder = (nft: NFT, width: number, height: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      // Create a canvas for the video placeholder
      const placeholderCanvas = document.createElement("canvas")
      placeholderCanvas.width = width
      placeholderCanvas.height = height
      const ctx = placeholderCanvas.getContext("2d")

      if (ctx) {
        // Fill background with a gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, "#1a1a2e")
        gradient.addColorStop(1, "#16213e")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Draw border
        ctx.strokeStyle = "#30475e"
        ctx.lineWidth = 2
        ctx.strokeRect(2, 2, width - 4, height - 4)

        // Draw video icon in the center
        ctx.fillStyle = "#f05454"
        const iconSize = Math.min(width, height) * 0.3
        const centerX = width / 2
        const centerY = height / 2 - iconSize * 0.2

        // Draw play triangle
        ctx.beginPath()
        ctx.moveTo(centerX - iconSize / 3, centerY - iconSize / 3)
        ctx.lineTo(centerX + iconSize / 3, centerY)
        ctx.lineTo(centerX - iconSize / 3, centerY + iconSize / 3)
        ctx.closePath()
        ctx.fill()

        // Draw NFT name
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${Math.max(12, Math.floor(width / 12))}px Arial, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Draw "Video NFT" text
        ctx.fillText("Video NFT", width / 2, height * 0.25, width - 20)

        // Draw NFT name or token ID
        const nftName = nft.name || `#${nft.tokenId}`
        ctx.fillStyle = "#cccccc"
        ctx.font = `${Math.max(10, Math.floor(width / 15))}px Arial, sans-serif`
        ctx.fillText(
          nftName.length > 15 ? nftName.substring(0, 12) + "..." : nftName,
          width / 2,
          height * 0.75,
          width - 20,
        )
      }

      // Convert canvas to image
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        // If even this fails, create an absolute minimal fallback
        const minimalImg = new Image()
        minimalImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' fontFamily='Arial' fontSize='14' textAnchor='middle' fill='%23ffffff'%3EVideo NFT%3C/text%3E%3C/svg%3E`
        resolve(minimalImg)
      }
      img.src = placeholderCanvas.toDataURL()
    })
  }

  // Function to create a fallback image
  const createFallbackImage = (nft: NFT, width: number, height: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      // Create a canvas for the fallback
      const fallbackCanvas = document.createElement("canvas")
      fallbackCanvas.width = width
      fallbackCanvas.height = height
      const ctx = fallbackCanvas.getContext("2d")

      if (ctx) {
        // Fill background with a gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, "#f0f0f0")
        gradient.addColorStop(1, "#e0e0e0")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Draw border
        ctx.strokeStyle = "#cccccc"
        ctx.lineWidth = 2
        ctx.strokeRect(2, 2, width - 4, height - 4)

        // Draw NFT name
        ctx.fillStyle = "#666666"
        ctx.font = `bold ${Math.max(12, Math.floor(width / 12))}px Arial, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Draw collection name at top
        const collectionName = nft.collection || "Unknown Collection"
        ctx.fillText(
          collectionName.length > 15 ? collectionName.substring(0, 12) + "..." : collectionName,
          width / 2,
          height * 0.3,
          width - 20,
        )

        // Draw NFT name or token ID
        const nftName = nft.name || `#${nft.tokenId}`
        ctx.fillText(
          nftName.length > 15 ? nftName.substring(0, 12) + "..." : nftName,
          width / 2,
          height * 0.5,
          width - 20,
        )

        // Draw blockchain name
        ctx.fillStyle = "#999999"
        ctx.font = `${Math.max(10, Math.floor(width / 15))}px Arial, sans-serif`
        ctx.fillText(nft.blockchain || "Unknown Blockchain", width / 2, height * 0.65, width - 20)

        // Draw "Image Failed" text
        ctx.fillStyle = "#ff5555"
        ctx.font = `${Math.max(9, Math.floor(width / 18))}px Arial, sans-serif`
        ctx.fillText("Image Failed to Load", width / 2, height * 0.8, width - 20)
      }

      // Convert canvas to image
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        // If even this fails, create an absolute minimal fallback
        const minimalImg = new Image()
        minimalImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' fontFamily='Arial' fontSize='14' textAnchor='middle' fill='%23666666'%3ENFT%3C/text%3E%3C/svg%3E`
        resolve(minimalImg)
      }
      img.src = fallbackCanvas.toDataURL()
    })
  }

  // Function to check if a URL is from a known problematic domain
  const isProblematicDomain = (url: string): boolean => {
    const problematicDomains = [
      "fiendz.herodevelopment.com",
      "metadata.gorgs.wengoods.io",
      "s3.us-east-2.amazonaws.com",
      "ghost-lab.xyz",
      "storage.googleapis.com",
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
    ]

    try {
      const urlObj = new URL(url)
      return problematicDomains.some((domain) => urlObj.hostname.includes(domain))
    } catch {
      return false
    }
  }

  // Function to get an alternative IPFS gateway URL
  const getAlternativeIpfsUrl = (url: string): string | null => {
    try {
      // Check if it's an IPFS URL
      if (url.includes("ipfs.io/ipfs/")) {
        const cid = url.split("ipfs.io/ipfs/")[1]
        if (cid) {
          // Try different IPFS gateways
          const gateways = [
            `https://gateway.pinata.cloud/ipfs/${cid}`,
            `https://cloudflare-ipfs.com/ipfs/${cid}`,
            `https://ipfs.fleek.co/ipfs/${cid}`,
            `https://dweb.link/ipfs/${cid}`,
            `https://gateway.ipfs.io/ipfs/${cid}`,
          ]
          return gateways[Math.floor(Math.random() * gateways.length)]
        }
      }
      return null
    } catch {
      return null
    }
  }

  // Function to try loading an image with different proxy services
  const tryProxyServices = async (
    imageUrl: string,
    nft: NFT,
    cellWidth: number,
    cellHeight: number,
  ): Promise<HTMLImageElement> => {
    // We trust the image URL from the NFT object, which has already been processed
    // to handle video NFTs in the nft-actions.ts file

    // List of proxy services to try
    const proxyServices = [
      (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
    ]

    // Try each proxy service
    for (const proxyService of proxyServices) {
      try {
        const proxyImg = new Image()
        proxyImg.crossOrigin = "anonymous"

        await new Promise<void>((resolve, reject) => {
          proxyImg.onload = () => resolve()
          proxyImg.onerror = (e) => {
            console.error(`Proxy service failed for ${imageUrl}:`, e)
            reject()
          }
          proxyImg.src = proxyService(imageUrl)
          setTimeout(() => reject(), 3000) // 3 second timeout per proxy attempt
        })

        return proxyImg
      } catch {
        // Continue to the next proxy service if this one fails
        continue
      }
    }

    // If all proxy services fail, try a direct fetch and convert to blob URL
    try {
      const response = await fetch(imageUrl, {
        mode: "no-cors",
        cache: "no-store",
      }).catch(() => null)

      if (response) {
        const blob = await response.blob().catch(() => null)
        if (blob) {
          const blobUrl = URL.createObjectURL(blob)
          const blobImg = new Image()
          blobImg.crossOrigin = "anonymous"

          await new Promise<void>((resolve, reject) => {
            blobImg.onload = () => resolve()
            blobImg.onerror = () => reject()
            blobImg.src = blobUrl
            setTimeout(() => reject(), 3000)
          })

          return blobImg
        }
      }
    } catch (e) {
      console.error("Blob URL approach failed:", e)
    }

    // If all approaches fail, create a fallback image
    return await createFallbackImage(nft, cellWidth, cellHeight)
  }

  const generateMosaic = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsGenerating(true)
    setError(null)
    setLoadedImages(0)
    setFailedImages(0)
    setMosaicDataUrl(null)

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setError("Could not initialize canvas context")
      setIsGenerating(false)
      return
    }

    // Calculate cell dimensions
    const cellWidth = imageWidth / columns
    const cellHeight = cellWidth // Keep cells square

    // Calculate canvas height based on rows (non-square canvas)
    const canvasHeight = cellHeight * rows

    // Set canvas size
    canvas.width = imageWidth
    canvas.height = canvasHeight

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Determine how many NFTs to process
    const nftCount = Math.min(rows * columns, nfts.length)
    setTotalImages(nftCount)

    // Draw each NFT to the canvas
    for (let i = 0; i < nftCount; i++) {
      const nft = nfts[i]
      const row = Math.floor(i / columns)
      const col = i % columns
      const x = col * cellWidth
      const y = row * cellHeight

      try {
        let img: HTMLImageElement

        // Check if the URL is from a known problematic domain
        if (isProblematicDomain(nft.image)) {
          // Skip direct loading and go straight to proxy services
          console.log(`Using proxy for known problematic domain: ${nft.image}`)
          img = await tryProxyServices(nft.image, nft, cellWidth, cellHeight)
        } else {
          // Try to load the image directly first
          try {
            img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image()
              img.crossOrigin = "anonymous" // Set crossOrigin before setting src

              img.onload = () => resolve(img)
              img.onerror = (e) => {
                console.error(`Error loading image ${i}:`, nft.image, e)
                reject(new Error(`Failed to load image for ${nft.name}`))
              }

              // Add a small random parameter to bypass cache
              const cacheBuster = `?cb=${Date.now()}-${Math.random()}`
              img.src = nft.image.includes("?") ? `${nft.image}&_cors=1` : `${nft.image}?_cors=1${cacheBuster}`

              // Set a timeout to reject if image takes too long to load
              setTimeout(() => reject(new Error("Image load timeout")), 5000)
            })
          } catch (directLoadError) {
            // If direct loading fails, try with proxy services
            console.log(`Direct loading failed for ${nft.image}, trying proxies`)
            setFailedImages((prev) => prev + 1)
            img = await tryProxyServices(nft.image, nft, cellWidth, cellHeight)
          }
        }

        // Draw the image to the canvas
        ctx.drawImage(img, x, y, cellWidth, cellHeight)

        // Draw border
        ctx.strokeStyle = backgroundColor
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellWidth, cellHeight)

        setLoadedImages((prev) => prev + 1)
      } catch (error) {
        console.error(`Failed to process NFT at position ${i}:`, error)

        // Draw fallback directly on the canvas
        const fallbackImg = await createFallbackImage(nft, cellWidth, cellHeight)
        ctx.drawImage(fallbackImg, x, y, cellWidth, cellHeight)

        setLoadedImages((prev) => prev + 1)
        setFailedImages((prev) => prev + 1)
      }
    }

    // Save the data URL for sharing
    const format = downloadFormat === "jpg" ? "image/jpeg" : "image/png"
    setMosaicDataUrl(canvas.toDataURL(format))

    setIsGenerating(false)

    if (failedImages > 0) {
      setError(
        `${failedImages} images failed to load and were replaced with placeholders. This is often due to CORS restrictions from the NFT image servers.`,
      )
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const format = downloadFormat === "jpg" ? "image/jpeg" : "image/png"
      const dataUrl = canvas.toDataURL(format)

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `nft-mosaic.${downloadFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading image:", error)
      setError("Failed to download image. This might be due to CORS restrictions.")
    }
  }

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsCopying(true)
    try {
      // Get the canvas data as a blob
      const format = downloadFormat === "jpg" ? "image/jpeg" : "image/png"
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob from canvas"))
        }, format)
      })

      // Create a ClipboardItem and copy to clipboard
      const item = new ClipboardItem({ [format]: blob })
      await navigator.clipboard.write([item])

      toast({
        title: "Copied to clipboard",
        description: "The mosaic image has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)

      // Fallback for browsers that don't support the Clipboard API
      try {
        const dataUrl = canvas.toDataURL(downloadFormat === "jpg" ? "image/jpeg" : "image/png")
        const textArea = document.createElement("textarea")
        textArea.value = dataUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)

        toast({
          title: "Copied to clipboard",
          description: "The mosaic image data URL has been copied to your clipboard.",
        })
      } catch (fallbackError) {
        toast({
          title: "Copy failed",
          description: "Your browser doesn't support copying images to clipboard.",
          variant: "destructive",
        })
      }
    } finally {
      setIsCopying(false)
    }
  }

  const handleShareOnX = () => {
    setShowShareDialog(true)
  }

  const copyShareLink = () => {
    const tweetText = "Check out my NFT Mosaic created with NFT Mosaic Generator!"
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

    // Open Twitter share dialog
    window.open(shareUrl, "_blank", "width=550,height=420")
  }

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = nfts.findIndex((nft) => nft.id === active.id)
      const newIndex = nfts.findIndex((nft) => nft.id === over.id)

      const reorderedNFTs = arrayMove(nfts, oldIndex, newIndex)
      setNfts(reorderedNFTs)

      // Notify parent component of the reordering
      if (onReorderNFTs) {
        onReorderNFTs(reorderedNFTs)
      }
    }
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  // Calculate cell size for the grid
  const cellSize = imageWidth / columns

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6">
          {isEditMode ? (
            <div className="w-full">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Arrange NFTs</h3>
                <Button variant="outline" onClick={toggleEditMode}>
                  Done
                </Button>
              </div>
              <div
                className="border rounded-lg p-4 bg-muted/30"
                style={{
                  width: imageWidth,
                  maxWidth: "100%",
                  height: rows * cellSize,
                  position: "relative",
                  margin: "auto",
                }}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={nfts.map((nft) => nft.id)} strategy={rectSortingStrategy}>
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                      }}
                    >
                      {nfts.slice(0, rows * columns).map((nft, index) => (
                        <SortableNFTItem
                          key={nft.id}
                          nft={nft}
                          index={index}
                          rows={rows}
                          columns={columns}
                          cellSize={cellSize - 8} // Account for gap
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Drag and drop NFTs to rearrange them in the mosaic
              </p>
            </div>
          ) : (
            <div className="relative">
              <canvas ref={canvasRef} className="border rounded-lg max-w-full" style={{ maxHeight: "70vh" }} />
              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-lg">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading images: {loadedImages} of {totalImages}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant={failedImages > 0 ? "default" : "destructive"} className="w-full max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{failedImages > 0 ? "Warning" : "Error"}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="w-full max-w-md">
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Download Format</p>
              <RadioGroup
                value={downloadFormat}
                onValueChange={(value) => setDownloadFormat(value as "png" | "jpg")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png">PNG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="jpg" id="jpg" />
                  <Label htmlFor="jpg">JPG</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={toggleEditMode} className="flex-1">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {isEditMode ? "Preview" : "Rearrange"}
              </Button>
              <Button variant="outline" onClick={generateMosaic} disabled={isGenerating} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={handleDownload} disabled={isGenerating || isEditMode} className="flex-1">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                disabled={isGenerating || isEditMode}
                className="flex-1"
                variant="outline"
              >
                {isCopying ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your NFT Mosaic on X</DialogTitle>
            <DialogDescription>
              Twitter doesn't allow direct image uploads via links. Follow these steps to share your mosaic:
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {mosaicDataUrl && (
              <img
                src={mosaicDataUrl || "/placeholder.svg"}
                alt="Your NFT Mosaic"
                className="max-w-full max-h-[300px] rounded-md border"
              />
            )}

            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="text-sm">Download your mosaic image</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="text-sm">Click the button below to open Twitter</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-1 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="text-sm">Attach the downloaded image to your tweet</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDownload} className="sm:flex-1">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download Image
            </Button>
            <Button onClick={copyShareLink} className="sm:flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Open Twitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

