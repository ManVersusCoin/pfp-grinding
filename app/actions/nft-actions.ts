"use server"

import { SUPPORTED_CHAINS } from "@/lib/constants"
import type { NFT } from "@/types/nft"
import { normalizeImageUrl } from "@/lib/image-utils"
import { revalidatePath } from "next/cache";

// Helper function to check if a URL is an MP4 file
function isMP4(url: string): boolean {
  return url?.toLowerCase().endsWith(".mp4")
}

export async function getNFTMetadata(contractAddress: string, tokenId: string): Promise<{ success: boolean; data: any; error: string | null }> {
  try {
    const apiKey = process.env.ALCHEMY_API_KEY;

    if (!apiKey) {
      return { success: false, data: null, error: 'Alchemy API key is not configured' };
    }

    const baseUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}`;
    const url = `${baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, data: null, error: `Alchemy API error: ${response.status} ${response.statusText} - ${text}` };
    }

    const data = await response.json();
    return { success: true, data, error: null };

  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function fetchNFTs(
  walletAddresses: string[],
  chains: string[] = ["eth-mainnet"],
): Promise<{
  success: boolean
  data: NFT[]
  error?: string
  missingApiKey?: boolean
}> {
  try {
    // Check if API key is available - only use the secure server-side variable
    const apiKey = process.env.ALCHEMY_API_KEY

    if (!apiKey) {
      console.error("Alchemy API key is not set")
      return {
        success: false,
        data: [],
        error: "Alchemy API key is not configured. Please add the ALCHEMY_API_KEY environment variable.",
        missingApiKey: true,
      }
    }

    // Create an array to hold all NFTs
    let allNFTs: NFT[] = []
    const errors: string[] = []

    // Process each wallet address
    for (const walletAddress of walletAddresses) {
      // Process each blockchain
      for (const chainId of chains) {
        try {
          const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
          if (!chain) {
            errors.push(`Unsupported blockchain: ${chainId}`)
            continue
          }

          // Use the dedicated function for fetching NFTs for a wallet on a chain
          const nfts = await fetchNFTsForWallet(walletAddress, apiKey, chain);
          allNFTs = [...allNFTs, ...nfts];

        } catch (error: any) {
          const errorMessage = error.message || "Unknown error"; // Ensure error is always a string
          console.error(`Error fetching NFTs for wallet ${walletAddress} on chain ${chainId}:`, error)
          errors.push(`Failed to fetch NFTs for wallet ${walletAddress} on ${chainId}: ${errorMessage}`)
          // Continue with other chains and wallets even if one fails
        }
      }
    }

    // Handle success and errors
    if (allNFTs.length > 0 && errors.length > 0) {
      return {
        success: true,
        data: allNFTs,
        error: `Some requests had errors: ${errors.join(". ")}`,
      }
    }

    if (allNFTs.length === 0 && errors.length > 0) {
      return {
        success: false,
        data: [],
        error: errors.join(". "),
      }
    }

    return { success: true, data: allNFTs }
  } catch (error: any) {
    console.error("Error in fetchNFTs action:", error)
    return {
      success: false,
      data: [],
      error: error.message || "Unknown error fetching NFTs", // Ensure error is always a string
    }
  }
}

async function fetchNFTsForWallet(
  walletAddress: string,
  apiKey: string,
  chain: { id: string; name: string; baseUrl: string },
): Promise<NFT[]> {

  // Input validation: Wallet address
  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error(`Invalid Ethereum address: ${walletAddress}`)
  }

  const baseURL = chain.baseUrl;
  const apiEndpoint = `${baseURL}/${apiKey}/getNFTsForOwner`;

  let allNFTs: any[] = [];
  let hasNextPage = true;
  let pageKey: string | null = null;
  const pageSize = 100;

  while (hasNextPage) {
    let url = `${apiEndpoint}?owner=${walletAddress}&pageSize=${pageSize}`;
    if (pageKey) {
      url += `&pageKey=${pageKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      console.log(`Fetching NFTs for ${walletAddress} on ${chain.name}...${pageKey ? ` (Page Key: ${pageKey})` : ''}`);


      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details available");
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.ownedNfts || !Array.isArray(data.ownedNfts)) {
        console.warn("Unexpected API response format:", data);
        break; // Exit the loop to prevent infinite loop
      }

      allNFTs = [...allNFTs, ...data.ownedNfts];
      pageKey = data.pageKey || null;
      hasNextPage = !!pageKey;

      if (hasNextPage) {
        console.log(`Fetched ${data.ownedNfts.length} NFTs, continuing with pageKey: ${pageKey}`);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Respectful delay
      }
    } catch (error: any) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out for wallet ${walletAddress} on ${chain.name}`);
      }
      // Improved error handling: Wrap original error for more context
      throw new Error(`Error fetching NFTs: ${error.message || 'Unknown error'}`);
    }
  }
  return allNFTs.map((nft: any) => {
    //console.log(nft);
    let imageUrl = '';
    const isVideo = nft.image?.contentType?.startsWith('video/') || nft.image?.contentType === 'mp4';

    // 1. Check for nft.image
    if (nft.image?.cachedUrl) {
        imageUrl = nft.image.cachedUrl;
    }
    // 2. Fallback to raw.metadata.image
    else if (nft.raw?.metadata?.image) {
        imageUrl = nft.raw.metadata.image;
    }
     // 3. Fallback to raw.metadata.fallback_image if image is video
    if (isVideo && nft.raw?.metadata?.fallback_image) {
        imageUrl = nft.raw.metadata.fallback_image;
    }
    // 4. Fallback to pngUrl if image is video
    if (isVideo && nft.image?.pngUrl && !nft.raw?.metadata?.fallback_image) {
        imageUrl = nft.image.pngUrl;
    }

    imageUrl = normalizeImageUrl(imageUrl);

    // Use placeholder if no image found
    if (!imageUrl) {
      const tokenId = nft.tokenId || "unknown";
      const title = nft.name || `NFT #${tokenId}`;
      imageUrl = `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(title)}`;
    }
    let tokenId = "unknown";
    try {
      tokenId = nft.tokenId || "unknown";
    } catch (error) {
       console.warn("Error parsing tokenId", error);
    }

    let collectionName = "Unknown Collection";
      try {
        if (nft.collection?.name) { // Check if nft.collection?.name exists and is not null
          collectionName = nft.collection.name;
        }
        else if (nft.contract?.name) {
          collectionName =  nft.contract.name;
        } 
        else if (nft.name && nft.tokenType === 'ERC1155') {
          collectionName = nft.name;
        }  else {
          collectionName = "Unknown Collection";
        }
      } catch (error) {
        console.warn("Error parsing collectionName", error);
      }
    return {
      id: `${chain.id}-${nft.contract?.address || "unknown"}-${tokenId}`,
      name: nft.name || `#${tokenId}`,
      tokenId: tokenId,
      collection: collectionName,
      collectionAddress: nft.contract?.address || "unknown",
      image: imageUrl,
      owner: walletAddress,
      blockchain: chain.name,
      description: nft.description || "",
      attributes: nft.raw?.metadata?.attributes || [],
    }
  });
}

