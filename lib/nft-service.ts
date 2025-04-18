import type { NFT } from "@/types/nft"

// This is a mock service that would be replaced with actual API calls
// The real API calls are now in the server action
export async function fetchNFTsForWallets(walletAddresses: string[]): Promise<NFT[]> {
  console.warn("This is a client-side mock function. Use the server action instead.")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock NFT data
  const mockNFTs: NFT[] = Array.from({ length: 30 }, (_, i) => {
    // Create different colored NFTs for variety
    const colors = ["4F46E5", "7C3AED", "DB2777", "EA580C", "16A34A", "0891B2", "2563EB", "9333EA", "C026D3", "E11D48"]
    const color = colors[i % colors.length]

    return {
      id: `nft-${i}`,
      name: `NFT #${i + 1}`,
      tokenId: `${i + 1}`,
      collection: `Collection ${Math.floor(i / 5) + 1}`,
      collectionAddress: `0x${Array(40)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`,
      // Use a placeholder image
      image: `https://via.placeholder.com/400/${color}/FFFFFF?text=NFT+${i + 1}`,
      owner: walletAddresses[i % walletAddresses.length],
      description: `This is a mock NFT #${i + 1}`,
      attributes: [],
    }
  })

  return mockNFTs
}

