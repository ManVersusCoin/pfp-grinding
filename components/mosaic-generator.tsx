"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { NFTSelector } from "@/components/nft-selector"
import { MosaicPreview } from "@/components/mosaic-preview"
import type { NFT } from "@/types/nft"
import { fetchNFTs } from "@/app/actions/nft-actions"
import { SUPPORTED_CHAINS } from "@/lib/constants" // Updated import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// Define supported blockchains locally as a fallback
const DEFAULT_CHAINS = [
  { id: "eth-mainnet", name: "Ethereum" },
  // { id: "polygon-mainnet", name: "Polygon" },
  // { id: "opt-mainnet", name: "Optimism" },
  { id: "arb-mainnet", name: "Arbitrum" },
  { id: "base-mainnet", name: "Base" },
  { id: "abstract-mainnet", name: "Abstract" },
  { id: "apechain-mainnet", name: "Apechain" },
]

export function MosaicGenerator() {
  const [wallets, setWallets] = useState<string>("")
  const [rows, setRows] = useState<number>(2) // Changed default to 2
  const [columns, setColumns] = useState<number>(2) // Changed default to 2
  const [imageWidth, setImageWidth] = useState<number>(500) // Changed default to 500
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000") // Changed default to black
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNFTs, setSelectedNFTs] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isMissingApiKey, setIsMissingApiKey] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("settings")
  const [selectedChains, setSelectedChains] = useState<string[]>(["eth-mainnet"])

  // Use the imported SUPPORTED_CHAINS if available, otherwise use the default
  const chains = Array.isArray(SUPPORTED_CHAINS) ? SUPPORTED_CHAINS : DEFAULT_CHAINS

  const handleFetchNFTs = async () => {
    if (!wallets.trim()) {
      setError("Please enter at least one wallet address")
      return
    }

    if (selectedChains.length === 0) {
      setError("Please select at least one blockchain")
      return
    }

    setIsLoading(true)
    setError(null)
    setWarning(null)
    setIsMissingApiKey(false)

    try {
      const walletAddresses = wallets.split(",").map((wallet) => wallet.trim())

      // Use the server action to fetch NFTs from selected blockchains
      const result = await fetchNFTs(walletAddresses, selectedChains)

      if (result.success) {
        setNfts(result.data)

        // Check if we have a partial success (some wallets had errors)
        if (result.error && result.data.length > 0) {
          setWarning(result.error)
        }

        if (result.data.length > 0) {
          setActiveTab("select")
        } else {
          setError("No NFTs found for the provided wallet addresses on the selected blockchains.")
        }
      } else {
        setError(result.error || "Failed to fetch NFTs.")
        if (result.missingApiKey) {
          setIsMissingApiKey(true)
        }
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error)
      setError("An unexpected error occurred while fetching NFTs.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectNFT = (nft: NFT) => {
    // Special case for "Unselect All" button
    if (nft.id === "clear-all") {
      setSelectedNFTs([])
      return
    }

    if (selectedNFTs.some((selected) => selected.id === nft.id)) {
      setSelectedNFTs(selectedNFTs.filter((selected) => selected.id !== nft.id))
    } else if (selectedNFTs.length < rows * columns) {
      setSelectedNFTs([...selectedNFTs, nft])
    }
  }

  const handleGenerateMosaic = () => {
    setActiveTab("preview")
  }

  const handleChainChange = (chainId: string, checked: boolean) => {
    if (checked) {
      setSelectedChains([...selectedChains, chainId])
    } else {
      setSelectedChains(selectedChains.filter((id) => id !== chainId))
    }
  }

  // Handle reordering of NFTs in the preview
  const handleReorderNFTs = (reorderedNFTs: NFT[]) => {
    setSelectedNFTs(reorderedNFTs)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="select" disabled={nfts.length === 0}>
          Select NFTs
        </TabsTrigger>
        <TabsTrigger value="preview" disabled={selectedNFTs.length === 0}>
          Preview & Download
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {isMissingApiKey && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API Key Missing</AlertTitle>
                  <AlertDescription className="space-y-4">
                    <p>The Alchemy API key is not configured. To fetch real NFT data, you need to:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        <a
                          href="https://www.alchemy.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline flex items-center"
                        >
                          Sign up for an Alchemy account
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                      <li>Create a new app and get your API key</li>
                      <li>
                        Add the API key as an environment variable named{" "}
                        <code className="bg-muted px-1 py-0.5 rounded">ALCHEMY_API_KEY</code>
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="wallets">Wallet Addresses (comma separated)</Label>
                <Input
                  id="wallets"
                  placeholder="0x123..., 0x456..."
                  value={wallets}
                  onChange={(e) => setWallets(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Enter Ethereum wallet addresses to fetch NFTs</p>
              </div>

              <div className="grid gap-2">
                <Label>Blockchains</Label>
                <div className="grid grid-cols-2 gap-2">
                  {chains.map((chain) => (
                    <div key={chain.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`chain-${chain.id}`}
                        checked={selectedChains.includes(chain.id)}
                        onCheckedChange={(checked) => handleChainChange(chain.id, checked as boolean)}
                      />
                      <Label htmlFor={`chain-${chain.id}`} className="cursor-pointer">
                        {chain.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {error && !isMissingApiKey && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {warning && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Rows: {rows}</Label>
                  <Slider value={[rows]} min={1} max={10} step={1} onValueChange={(value) => setRows(value[0])} />
                </div>

                <div className="grid gap-2">
                  <Label>Columns: {columns}</Label>
                  <Slider value={[columns]} min={1} max={10} step={1} onValueChange={(value) => setColumns(value[0])} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Image Width: {imageWidth}px</Label>
                <Slider
                  value={[imageWidth]}
                  min={200}
                  max={2000}
                  step={100}
                  onValueChange={(value) => setImageWidth(value[0])}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button onClick={handleFetchNFTs} disabled={isLoading}>
                {isLoading ? "Loading..." : "Fetch NFTs"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="select">
        <NFTSelector
          nfts={nfts}
          selectedNFTs={selectedNFTs}
          onSelectNFT={handleSelectNFT}
          maxSelections={rows * columns}
          onGenerateMosaic={handleGenerateMosaic}
        />
      </TabsContent>

      <TabsContent value="preview">
        <MosaicPreview
          selectedNFTs={selectedNFTs}
          rows={rows}
          columns={columns}
          imageWidth={imageWidth}
          backgroundColor={backgroundColor}
          onReorderNFTs={handleReorderNFTs}
        />
      </TabsContent>
    </Tabs>
  )
}

