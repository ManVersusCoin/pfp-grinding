// grind-hat/config.ts


export interface Overlay {
    name: string;
    image: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface CollectionConfig {
    baseUrl?: string;
    contractAddress?: string;
    chain?: 'ETH_MAINNET' | 'MATIC_MAINNET' | 'ARBITRUM_MAINNET' | 'OPTIMISM_MAINNET' | 'BASE_MAINNET';
    format: 'png' | 'jpg' | 'jpeg' | 'webp';
    overlays: Overlay[];
    customImageResolver?: (id: string, alchemyData?: any) => Promise<string> | string;
  }
  
  export const collections: Record<string, CollectionConfig> = {
    Bearish_AF: {
      baseUrl: "https://bearish.s3.amazonaws.com/bearish/metadata/images/",
      format: "png",
      overlays: [
        { name: "Cap", image: "/overlays/grind-hat/bearish_cap.png", x: 0, y: 0, width: 800, height: 800 },
        { name: "Chef hat", image: "/overlays/grind-hat/bearish_chef.png", x: 0, y: 0, width: 800, height: 800 },
        //{ name: "Crown", image: "/overlays/grind-hat/bearish_crown.png", x: 0, y: 0, width: 800, height: 800 },
      ]
    },
    ThePlague: {
      contractAddress: "0xc379e535caff250a01caa6c3724ed1359fe5c29b",
      chain: "ETH_MAINNET",
      format: "png",
      overlays: [
        { name: "Grind hat", image: "/overlays/grind-hat/plague_hat.png", x: 0, y: 0, width: 800, height: 800 },
        { name: "Hoodie up", image: "/overlays/grind-hat/plague_hoodie.png", x: 0, y: 0, width: 800, height: 800 },
      ],
      // Advanced resolver for The Plague that handles multiple formats
      customImageResolver: async (id, alchemyData) => {
        // If we have Alchemy data, try to extract the image URL from it
        if (alchemyData) {
          // Try approach 1: Check media gateway (already formatted as HTTP URL)
          if (alchemyData.media && 
              Array.isArray(alchemyData.media) && 
              alchemyData.media.length > 0 && 
              alchemyData.media[0].gateway) {
            // Verify the URL is accessible
            try {
              const response = await fetch(alchemyData.media[0].gateway, { method: 'HEAD' });
              if (response.ok) {
                return alchemyData.media[0].gateway;
              }
            } catch (error) {
              console.warn(`Failed to verify media gateway URL: ${error}`);
              // Continue to next approach if this fails
            }
          }
          
          // Try approach 2: Check metadata.image (usually IPFS URL)
          if (alchemyData.metadata && alchemyData.metadata.image) {
            const imageUrl = alchemyData.metadata.image;
            // Convert IPFS URL to HTTP URL
            if (imageUrl.startsWith('ipfs://')) {
              const httpUrl = imageUrl
                .replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/')
                .replace('ipfs://', 'https://ipfs.io/ipfs/');
              
              // Verify the URL is accessible
              try {
                const response = await fetch(httpUrl, { method: 'HEAD' });
                if (response.ok) {
                  return httpUrl;
                }
              } catch (error) {
                console.warn(`Failed to verify converted IPFS URL: ${error}`);
                // Continue to next approach if this fails
              }
            }
          }
          
          // Try approach 3: Check tokenUri and fetch metadata
          if (alchemyData.tokenUri && alchemyData.tokenUri.gateway) {
            try {
              const response = await fetch(alchemyData.tokenUri.gateway);
              if (response.ok) {
                const metadata = await response.json();
                if (metadata.image) {
                  const imageUrl = metadata.image;
                  if (imageUrl.startsWith('ipfs://')) {
                    return imageUrl
                      .replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/')
                      .replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                  return imageUrl;
                }
              }
            } catch (error) {
              console.error('Error fetching token URI metadata:', error);
            }
          }
        }
        
        // Fallback approaches if Alchemy data doesn't contain usable image URLs
        
        // Try known IPFS CIDs for The Plague collection
        const knownCids = [
          // Format 1: ID in path with .png extension
          `https://ipfs.io/ipfs/QmXFaCzoZjc5632b8dzJXWsxK1xhLFrharUfZHTTJVvsPF/${id}.png`,
          // Format 2: Just ID in path
          //`https://ipfs.io/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/${id}.png`,
          // Format 3: Direct CID
          `https://ipfs.io/ipfs/Qme42q3ufJRUYB2mQfF5cYEMVRxvr7DKpaDcNUCHRmA43a`,
          // Format 4: New CID pattern found in token #9999
          `https://ipfs.io/ipfs/QmQ6MDtfjg7LZbPRe7A3ZSPEtvYcVqUTmsuTMM1zhUR8MG/${id}.png`,
          // Try Cloudflare gateway as alternative
          `https://cloudflare-ipfs.com/ipfs/QmQ6MDtfjg7LZbPRe7A3ZSPEtvYcVqUTmsuTMM1zhUR8MG/${id}.png`,
        ];
        
        // Try each known CID pattern
        for (const url of knownCids) {
          try {
            // Check if the URL is accessible
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              return url;
            }
          } catch (error) {
            console.warn(`Failed to access ${url}:`, error);
          }
        }
        
        // Last resort: Construct URL directly from the Alchemy data without checking
        if (alchemyData && alchemyData.metadata && alchemyData.metadata.image) {
          const imageUrl = alchemyData.metadata.image;
          if (imageUrl.startsWith('ipfs://')) {
            return imageUrl
              .replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/')
              .replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          return imageUrl;
        }
        
        // If all else fails, return a placeholder or throw an error
        throw new Error(`Could not find image for The Plague #${id}`);
      }
    },
    /*LilPudgy: {
      contractAddress: "0x524cab2ec69124574082676e6f654a18df49a048",
      chain: "ETH_MAINNET",
      format: "png", 
      overlays: [
        { name: "Grind hat", image: "/overlays/grind-hat/lilpudgy_hat.png", x: 266, y: 349, width: 300, height: 300 },
      ]
    },
    SugarTown: {
      baseUrl: "https://nfts.visitsugartown.com/nfts/oras/",
      format: "png", 
      overlays: [
        { name: "Grind hat", image: "/overlays/grind-hat/sugartown_cap.png", x: 200, y: 0, width: 500, height: 500 },
        { name: "Wizard hat", image: "/overlays/grind-hat/sugartown_wizard_2.png", x: 0, y: 0, width: 800, height: 800 },
      ]
    },*/
  };
  