"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { NFT } from "@/types/nft"
import { Check, ImageOff, Filter } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface NFTSelectorProps {
  nfts: NFT[]
  selectedNFTs: NFT[]
  onSelectNFT: (nft: NFT) => void
  maxSelections: number
  onGenerateMosaic: () => void
}

export function NFTSelector({ nfts, selectedNFTs, onSelectNFT, maxSelections, onGenerateMosaic }: NFTSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [selectedBlockchains, setSelectedBlockchains] = useState<string[]>([])
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false)
  const [blockchainSearchTerm, setBlockchainSearchTerm] = useState("")
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("")

  // Get unique collections and blockchains for filtering
  const collections = Array.from(new Set(nfts.map((nft) => nft.collection)))
  const blockchains = Array.from(new Set(nfts.map((nft) => nft.blockchain)))

  // Filter collections and blockchains based on search terms
  const filteredCollections = collections.filter((collection) =>
    collection.toLowerCase().includes(collectionSearchTerm.toLowerCase()),
  )

  const filteredBlockchains = blockchains.filter((blockchain) =>
    blockchain.toLowerCase().includes(blockchainSearchTerm.toLowerCase()),
  )

  // Reset filters when NFTs change
  useEffect(() => {
    setSelectedCollections([])
    setSelectedBlockchains([])
  }, [nfts])

  const filteredNFTs = nfts.filter((nft) => {
    // Apply search filter
    const matchesSearch =
      nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.collection.toLowerCase().includes(searchTerm.toLowerCase())

    // Apply collection filter
    const matchesCollection = selectedCollections.length === 0 || selectedCollections.includes(nft.collection)

    // Apply blockchain filter
    const matchesBlockchain = selectedBlockchains.length === 0 || selectedBlockchains.includes(nft.blockchain)

    // Apply selected filter
    const matchesSelected = !showOnlySelected || selectedNFTs.some((selected) => selected.id === nft.id)

    return matchesSearch && matchesCollection && matchesBlockchain && matchesSelected
  })

  const handleImageError = (nftId: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [nftId]: true,
    }))
  }

  const toggleCollection = (collection: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collection) ? prev.filter((c) => c !== collection) : [...prev, collection],
    )
  }

  const toggleBlockchain = (blockchain: string) => {
    setSelectedBlockchains((prev) =>
      prev.includes(blockchain) ? prev.filter((b) => b !== blockchain) : [...prev, blockchain],
    )
  }

  const clearCollectionFilters = () => {
    setSelectedCollections([])
  }

  const clearBlockchainFilters = () => {
    setSelectedBlockchains([])
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Selected {selectedNFTs.length} of {maxSelections} NFTs
            </p>
            {selectedNFTs.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => onSelectNFT({ ...selectedNFTs[0], id: "clear-all" })}>
                Unselect All
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search NFTs by name or collection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />

            <div className="flex gap-2">
              {/* View Selected Toggle */}
              <Button
                variant={showOnlySelected ? "default" : "outline"}
                className="flex gap-2"
                onClick={() => setShowOnlySelected(!showOnlySelected)}
              >
                <Check className={`h-4 w-4 ${!showOnlySelected && "opacity-0"}`} />
                <span>View Selected</span>
              </Button>

              {/* Blockchain Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Blockchains</span>
                    {selectedBlockchains.length > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {selectedBlockchains.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="p-2">
                    <Input
                      placeholder="Search blockchains..."
                      value={blockchainSearchTerm}
                      onChange={(e) => setBlockchainSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id="unselect-all-blockchains"
                        checked={selectedBlockchains.length === 0}
                        onCheckedChange={() => clearBlockchainFilters()}
                      />
                      <Label htmlFor="unselect-all-blockchains" className="flex-grow cursor-pointer font-medium">
                        Unselect All
                      </Label>
                    </div>
                    <Separator className="my-2" />
                  </div>
                  <ScrollArea className="h-80">
                    <div className="p-2">
                      {filteredBlockchains.map((blockchain) => (
                        <div
                          key={blockchain}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                          onClick={() => toggleBlockchain(blockchain)}
                        >
                          <Checkbox
                            id={`blockchain-${blockchain.replace(/\s+/g, "-").toLowerCase()}`}
                            checked={selectedBlockchains.includes(blockchain)}
                            onCheckedChange={() => {}}
                            className="pointer-events-none"
                          />
                          <Label
                            htmlFor={`blockchain-${blockchain.replace(/\s+/g, "-").toLowerCase()}`}
                            className="flex-grow cursor-pointer"
                          >
                            {blockchain}
                          </Label>
                        </div>
                      ))}
                      {filteredBlockchains.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No blockchains found</p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* Collection Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Collections</span>
                    {selectedCollections.length > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {selectedCollections.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="p-2">
                    <Input
                      placeholder="Search collections..."
                      value={collectionSearchTerm}
                      onChange={(e) => setCollectionSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id="unselect-all-collections"
                        checked={selectedCollections.length === 0}
                        onCheckedChange={() => clearCollectionFilters()}
                      />
                      <Label htmlFor="unselect-all-collections" className="flex-grow cursor-pointer font-medium">
                        Unselect All
                      </Label>
                    </div>
                    <Separator className="my-2" />
                  </div>
                  <ScrollArea className="h-80">
                    <div className="p-2">
                      {filteredCollections.map((collection) => (
                        <div
                          key={collection}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                          onClick={() => toggleCollection(collection)}
                        >
                          <Checkbox
                            id={`collection-${collection.replace(/\s+/g, "-").toLowerCase()}`}
                            checked={selectedCollections.includes(collection)}
                            onCheckedChange={() => {}}
                            className="pointer-events-none"
                          />
                          <Label
                            htmlFor={`collection-${collection.replace(/\s+/g, "-").toLowerCase()}`}
                            className="flex-grow cursor-pointer text-sm truncate"
                          >
                            {collection}
                          </Label>
                        </div>
                      ))}
                      {filteredCollections.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No collections found</p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {filteredNFTs.map((nft) => {
            const isSelected = selectedNFTs.some((selected) => selected.id === nft.id)
            const hasImageError = imageErrors[nft.id]

            return (
              <div
                key={nft.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                  isSelected ? "border-primary" : "border-transparent"
                }`}
                onClick={() => onSelectNFT(nft)}
              >
                <div className="aspect-square relative">
                  {hasImageError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-2 text-center">
                      <ImageOff className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground line-clamp-2">{nft.name}</p>
                    </div>
                  ) : (
                    <img
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={() => handleImageError(nft.id)}
                    />
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 text-white rounded-full px-2 py-1 text-xs">
                    {nft.blockchain}
                  </div>
                </div>
                <div className="p-2 bg-background/90 absolute bottom-0 w-full">
                  <p className="text-xs font-medium truncate">{nft.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
                </div>
              </div>
            )
          })}
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-8">
            <ImageOff className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No NFTs found matching your criteria</p>
          </div>
        )}

        {/* Add padding at the bottom to prevent content from being hidden behind the fixed button */}
        <div className="h-16"></div>

        {/* Fixed position footer with Generate Mosaic button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedNFTs.length === maxSelections
                ? "Maximum NFTs selected"
                : `Select ${maxSelections - selectedNFTs.length} more NFTs`}
            </p>
            <Button onClick={onGenerateMosaic} disabled={selectedNFTs.length === 0}>
              Generate Mosaic
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

