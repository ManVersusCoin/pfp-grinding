'use client';

import React, { useState, useRef, useEffect } from 'react';
import { collections } from './config';

type CollectionName = keyof typeof collections;

// Add this to fix TypeScript errors with custom canvas properties
declare global {
  interface HTMLCanvasElement {
    __nftImage?: HTMLImageElement;
    __overlayImage?: HTMLImageElement;
  }
}

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Alchemy API key - in a real app, use environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY; // Replace with your actual API key

// Simple in-memory cache for image URLs
const imageUrlCache: Record<string, string> = {};

export default function GrindHatPage() {
  const defaultCollection = Object.keys(collections)[0] as CollectionName;
  const [selectedCollection, setSelectedCollection] = useState<CollectionName>(defaultCollection);
  const [nftId, setNftId] = useState('');
  const [selectedOverlayIndex, setSelectedOverlayIndex] = useState(0);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [overlayScale, setOverlayScale] = useState(1); // 1 = 100% original size
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dev mode states
  const [devMode, setDevMode] = useState(false);
  const [customNftImage, setCustomNftImage] = useState<File | null>(null);
  const [customOverlayImage, setCustomOverlayImage] = useState<File | null>(null);
  const [customNftImageUrl, setCustomNftImageUrl] = useState<string | null>(null);
  const [customOverlayImageUrl, setCustomOverlayImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (collections[selectedCollection]) {
      const initialOverlay = collections[selectedCollection].overlays[selectedOverlayIndex];
      
      // Check if the overlay has x and y properties, otherwise use default values
      const x = initialOverlay && typeof initialOverlay.x === 'number' ? initialOverlay.x : 0;
      const y = initialOverlay && typeof initialOverlay.y === 'number' ? initialOverlay.y : 0;
      
      setOverlayPosition({ x, y });
      setOverlayScale(1); // Reset scale when changing overlay
    }
  }, [selectedOverlayIndex, selectedCollection]); // Keep selectedCollection as dependency to handle initialization

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      if (customNftImageUrl && customNftImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customNftImageUrl);
      }
      if (customOverlayImageUrl && customOverlayImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customOverlayImageUrl);
      }
    };
  }, []);

  const resetDevMode = () => {
    // Revoke existing URLs
    if (customNftImageUrl && customNftImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customNftImageUrl);
    }
    if (customOverlayImageUrl && customOverlayImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customOverlayImageUrl);
    }
    
    // Reset state
    setCustomNftImage(null);
    setCustomOverlayImage(null);
    setCustomNftImageUrl(null);
    setCustomOverlayImageUrl(null);
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.__nftImage = undefined;
      canvas.__overlayImage = undefined;
    }
  };

  // Add a function to reset states when collection changes
  const resetCollectionState = (newCollection: CollectionName) => {
    // Reset overlay index to 0 (first overlay in the new collection)
    setSelectedOverlayIndex(0);
    
    // Reset scale to 1 (100%)
    setOverlayScale(1);
    
    // Reset position to the default for the first overlay in the new collection
    if (collections[newCollection] && collections[newCollection].overlays.length > 0) {
      const initialOverlay = collections[newCollection].overlays[0];
      const x = initialOverlay && typeof initialOverlay.x === 'number' ? initialOverlay.x : 0;
      const y = initialOverlay && typeof initialOverlay.y === 'number' ? initialOverlay.y : 0;
      setOverlayPosition({ x, y });
    } else {
      // Fallback to default position if no overlays exist
      setOverlayPosition({ x: 0, y: 0 });
    }
    
    // Clear any previous error messages
    setErrorMessage('');
    
    // Clear debug info
    setDebugInfo(null);
    
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.__nftImage = undefined;
      canvas.__overlayImage = undefined;
    }
  };

  const handleNftImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file');
        return;
      }
      
      // Revoke previous URL if it exists
      if (customNftImageUrl && customNftImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customNftImageUrl);
      }
      
      setCustomNftImage(file);
      
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setCustomNftImageUrl(imageUrl);
      
      // Clear any previous error
      setErrorMessage('');
    }
  };

  const handleOverlayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file');
        return;
      }
      
      // Revoke previous URL if it exists
      if (customOverlayImageUrl && customOverlayImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customOverlayImageUrl);
      }
      
      setCustomOverlayImage(file);
      
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setCustomOverlayImageUrl(imageUrl);
      
      // Clear any previous error
      setErrorMessage('');
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Set a timeout to prevent hanging on bad URLs
      const timeout = setTimeout(() => {
        console.error('Image load timeout for:', src);
        reject(new Error(`Timeout loading image from ${src}`));
      }, 15000); // 15 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = (e) => {
        clearTimeout(timeout);
        console.error('Image load error:', e, 'URL:', src);
        reject(new Error(`Failed to load image from ${src}`));
      };
      
      // Only add cache-busting for non-blob URLs
      if (src.startsWith('blob:')) {
        img.src = src;
      } else {
        // Add cache-busting query parameter to avoid browser caching issues
        const cacheBuster = `?t=${Date.now()}`;
        img.src = src + cacheBuster;
      }
    });
  };

  const convertIpfsUrl = (ipfsUrl: string): string => {
    if (!ipfsUrl) return ipfsUrl;
    
    // Handle ipfs:// protocol URLs
    if (ipfsUrl.startsWith('ipfs://')) {
      // Remove 'ipfs://' or 'ipfs://ipfs/' prefix and add gateway
      return ipfsUrl
        .replace('ipfs://ipfs/', 'https://ipfs.io/ipfs/')
        .replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle ar:// protocol (Arweave)
    if (ipfsUrl.startsWith('ar://')) {
      return ipfsUrl.replace('ar://', 'https://arweave.net/');
    }
    
    return ipfsUrl;
  };

  // Try multiple IPFS gateways
  const tryMultipleGateways = async (cid: string, path: string = ''): Promise<string> => {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://dweb.link/ipfs/',
      'https://ipfs.fleek.co/ipfs/'
    ];
    
    // For each gateway, try a HEAD request
    for (const gateway of gateways) {
      const url = `${gateway}${cid}${path ? '/' + path : ''}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed for ${cid}/${path}`);
      }
    }
    
    // If all gateways fail, return the first one anyway
    return `${gateways[0]}${cid}${path ? '/' + path : ''}`;
  };

  const getAlchemyNftData = async (contractAddress: string, tokenId: string) => {
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTMetadata`;
    const params = new URLSearchParams({
      contractAddress: contractAddress,
      tokenId: tokenId,
      refreshCache: 'false'
    });

    const response = await fetch(`${alchemyUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    return await response.json();
  };

  const getNftImageUrl = async (collection: typeof collections[CollectionName], id: string): Promise<string> => {
    // Check cache first
    const cacheKey = `${collection.contractAddress || collection.baseUrl}-${id}`;
    if (imageUrlCache[cacheKey]) {
      return imageUrlCache[cacheKey];
    }
    
    // If baseUrl is defined, use it directly
    if (collection.baseUrl) {
      const url = `${collection.baseUrl}${id}.${collection.format}`;
      imageUrlCache[cacheKey] = url;
      return url;
    }
    
    // Otherwise, use Alchemy API
    if (!collection.contractAddress || !collection.chain) {
      throw new Error('Collection is missing contractAddress or chain configuration');
    }

    // Get NFT data from Alchemy
    const alchemyData = await getAlchemyNftData(collection.contractAddress, id);
    
    // Store debug info
    setDebugInfo(JSON.stringify(alchemyData, null, 2));
    
    let imageUrl = null;
    
    // If there's a custom image resolver, use it with the Alchemy data
    if (collection.customImageResolver) {
      try {
        imageUrl = await collection.customImageResolver(id, alchemyData);
        if (imageUrl) {
          imageUrlCache[cacheKey] = imageUrl;
          return imageUrl;
        }
      } catch (error) {
        console.error('Custom resolver error:', error);
        // Continue to standard extraction if custom resolver fails
      }
    }
    
    // Standard extraction logic
    // Try media gateway first (usually already HTTP URLs)
    if (alchemyData.media && Array.isArray(alchemyData.media) && alchemyData.media.length > 0) {
      if (alchemyData.media[0].gateway) {
        imageUrl = alchemyData.media[0].gateway;
      } else if (alchemyData.media[0].raw) {
        imageUrl = alchemyData.media[0].raw;
      }
    }
    
    // Try metadata.image as fallback
    if (!imageUrl && alchemyData.metadata && alchemyData.metadata.image) {
      imageUrl = alchemyData.metadata.image;
    }
    
    // Check for tokenUri as last resort
    if (!imageUrl && alchemyData.tokenUri && alchemyData.tokenUri.gateway) {
      try {
        const metadataResponse = await fetch(alchemyData.tokenUri.gateway);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          if (metadata.image) {
            imageUrl = metadata.image;
          }
        }
      } catch (error) {
        console.error('Error fetching token URI metadata:', error);
      }
    }
    
    // Handle special case for The Plague with error
    if (!imageUrl && collection.contractAddress === '0xc379e535caff250a01caa6c3724ed1359fe5c29b') {
      // Try known patterns for The Plague
      const knownPatterns = [
        `https://ipfs.io/ipfs/QmXFaCzoZjc5632b8dzJXWsxK1xhLFrharUfZHTTJVvsPF/${id}.png`,
        `https://ipfs.io/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/${id}.png`,
        `https://ipfs.io/ipfs/QmQ6MDtfjg7LZbPRe7A3ZSPEtvYcVqUTmsuTMM1zhUR8MG/${id}.png`,
      ];
      
      for (const pattern of knownPatterns) {
        try {
          // Just a HEAD request to check if the URL exists
          const response = await fetch(pattern, { method: 'HEAD' });
          if (response.ok) {
            imageUrl = pattern;
            break;
          }
        } catch (error) {
          console.warn(`Failed to access ${pattern}:`, error);
        }
      }
    }
    
    // Convert IPFS URLs to HTTP URLs
    if (imageUrl) {
      imageUrl = convertIpfsUrl(imageUrl);
    } else {
      throw new Error('No image found in NFT metadata');
    }
    
    // Cache the result
    imageUrlCache[cacheKey] = imageUrl;
    return imageUrl;
  };

  // Function to redraw the canvas with current position and scale
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.__nftImage || !canvas.__overlayImage) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get overlay dimensions based on mode
    let overlayWidth, overlayHeight;
    
    if (devMode) {
      // In dev mode, use the actual dimensions of the uploaded image
      overlayWidth = canvas.__overlayImage.width;
      overlayHeight = canvas.__overlayImage.height;
    } else {
      // In normal mode, use the dimensions from the collection config
      const overlay = collections[selectedCollection].overlays[selectedOverlayIndex];
      overlayWidth = overlay.width;
      overlayHeight = overlay.height;
    }
    
    // Calculate scaled dimensions
    const scaledWidth = overlayWidth * overlayScale;
    const scaledHeight = overlayHeight * overlayScale;
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas.__nftImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      canvas.__overlayImage,
      overlayPosition.x,
      overlayPosition.y,
      scaledWidth,
      scaledHeight
    );
  };

  const generateImage = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setDebugInfo(null);
    
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsLoading(false);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsLoading(false);
      return;
    }

    try {
      let nftImage: HTMLImageElement | null = null;
      let overlayImage: HTMLImageElement | null = null;
      
      if (devMode) {
        // In dev mode, use uploaded images
        if (!customNftImageUrl) {
          throw new Error('Please upload an NFT image');
        }
        
        if (!customOverlayImageUrl) {
          throw new Error('Please upload an overlay image');
        }
        
        try {
          nftImage = await loadImage(customNftImageUrl);
        } catch (error) {
          console.error('Failed to load custom NFT image:', error);
          throw new Error('Failed to load the uploaded NFT image. Please try a different image.');
        }
        
        try {
          overlayImage = await loadImage(customOverlayImageUrl);
        } catch (error) {
          console.error('Failed to load custom overlay image:', error);
          throw new Error('Failed to load the uploaded overlay image. Please try a different image.');
        }
      } else {
        // Normal mode - use collections and Alchemy API
        if (!nftId) {
          setErrorMessage('Please enter an NFT ID');
          setIsLoading(false);
          return;
        }
        
        const collection = collections[selectedCollection];
        const overlay = collection.overlays[selectedOverlayIndex];
        
        // Get the NFT image URL
        const nftImageUrl = await getNftImageUrl(collection, nftId);
        
        // Try to load the image
        try {
          nftImage = await loadImage(nftImageUrl);
        } catch (imageError) {
          console.error('Primary image load failed:', imageError);
          
          // If this is The Plague collection, try alternate gateways
          if (collection.contractAddress === '0xc379e535caff250a01caa6c3724ed1359fe5c29b') {
            // Try alternate gateways
            const alternateUrls = [
              `https://cloudflare-ipfs.com/ipfs/QmQ6MDtfjg7LZbPRe7A3ZSPEtvYcVqUTmsuTMM1zhUR8MG/${nftId}.png`,
              `https://gateway.pinata.cloud/ipfs/QmQ6MDtfjg7LZbPRe7A3ZSPEtvYcVqUTmsuTMM1zhUR8MG/${nftId}.png`,
              `https://ipfs.io/ipfs/QmXFaCzoZjc5632b8dzJXWsxK1xhLFrharUfZHTTJVvsPF/${nftId}.png`
            ];
            
            for (const url of alternateUrls) {
              try {
                nftImage = await loadImage(url);
                if (nftImage) break; // Exit loop if we successfully loaded an image
              } catch (altError) {
                console.warn(`Failed to load alternate URL: ${url}`, altError);
              }
            }
          }
          
          // If still no image, throw error
          if (!nftImage) {
            throw new Error(`Failed to load image after trying multiple sources`);
          }
        }
        
        overlayImage = await loadImage(overlay.image);
      }
      
      // At this point, both images should be loaded
      if (!nftImage || !overlayImage) {
        throw new Error('Failed to load images');
      }
      
      // Store the images for reuse during drag operations
      canvas.__nftImage = nftImage;
      canvas.__overlayImage = overlayImage;

      // Calculate scaled dimensions for overlay
      const overlayWidth = devMode ? overlayImage.width : collections[selectedCollection].overlays[selectedOverlayIndex].width;
      const overlayHeight = devMode ? overlayImage.height : collections[selectedCollection].overlays[selectedOverlayIndex].height;
      
      const scaledWidth = overlayWidth * overlayScale;
      const scaledHeight = overlayHeight * overlayScale;

      // Draw the images
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(nftImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        overlayImage, 
        overlayPosition.x, 
        overlayPosition.y, 
        scaledWidth, 
        scaledHeight
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load images');
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = devMode 
      ? `custom-image-with-overlay.png` 
      : `${selectedCollection}-${nftId}-with-hat.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
      if (!blob) throw new Error('Failed to create blob');
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      alert('Image copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image.');
    }
  };

  // ========== DRAG & DROP LOGIC ==========

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setOverlayPosition({ x, y });
    
    // Redraw the canvas with the new position
    redrawCanvas();
  };

  // Handle mouse leaving the canvas
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <section className="flex flex-col items-center gap-8 p-6 md:p-10 bg-gray-50 dark:bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-center">Add a $Grind Hat</h1>

      

      {/* Normal Mode Controls - Only show if not in dev mode */}
      {!devMode && (
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Collection Select */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => {
                const newCollection = e.target.value as CollectionName;
                resetCollectionState(newCollection);
                setSelectedCollection(newCollection);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            >
              {Object.keys(collections).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* NFT ID Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">NFT ID</label>
            <input
              type="text"
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
              placeholder="Enter NFT ID"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
          </div>

          {/* Overlay Select */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Overlay</label>
            {selectedCollection && collections[selectedCollection] && (
              <select
                value={selectedOverlayIndex}
                onChange={(e) => setSelectedOverlayIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={isLoading}
              >
                {collections[selectedCollection]?.overlays.map((overlay, index) => (
                  <option key={index} value={index}>
                    {overlay.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImage}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2 px-4 font-semibold hover:bg-primary/90 transition flex justify-center items-center"
            disabled={!nftId || isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Loading...</span>
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      )}

      {/* Dev Mode Controls */}
      {devMode && (
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* NFT Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Upload NFT Image (Square)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleNftImageUpload}
              className="w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isLoading}
            />
            {customNftImageUrl && (
              <div className="mt-2">
                <img src={customNftImageUrl} alt="Custom NFT" className="h-20 w-20 object-cover rounded-md" />
              </div>
            )}
          </div>
          
          {/* Overlay Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Upload Overlay Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleOverlayImageUpload}
              className="w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isLoading}
            />
            {customOverlayImageUrl && (
              <div className="mt-2">
                <img src={customOverlayImageUrl} alt="Custom Overlay" className="h-20 w-20 object-cover rounded-md" />
              </div>
            )}
          </div>
          
          {/* Position and Scale Controls - Only show in dev mode */}
          <div className="mt-2">
            <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Overlay Controls</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* X Position */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">X Position</label>
                <input
                  type="number"
                  value={Math.round(overlayPosition.x)}
                  onChange={(e) => {
                    const x = Number(e.target.value);
                    setOverlayPosition(prev => ({ ...prev, x }));
                    redrawCanvas();
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              
              {/* Y Position */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Y Position</label>
                <input
                  type="number"
                  value={Math.round(overlayPosition.y)}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setOverlayPosition(prev => ({ ...prev, y }));
                    redrawCanvas();
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              
              {/* Scale */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Scale (%)</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={Math.round(overlayScale * 100)}
                  onChange={(e) => {
                    const scale = Number(e.target.value) / 100;
                    setOverlayScale(scale);
                    redrawCanvas();
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          {/* Generate Button for Dev Mode */}
          <button
            onClick={generateImage}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2 px-4 font-semibold hover:bg-primary/90 transition flex justify-center items-center"
            disabled={!customNftImageUrl || !customOverlayImageUrl || isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Loading...</span>
              </>
            ) : (
              'Generate with Custom Images'
            )}
          </button>
          
          {/* Reset Button */}
          <button
            onClick={resetDevMode}
            className="w-full bg-red-500 text-white rounded-lg py-2 px-4 font-semibold hover:bg-red-600 transition"
            disabled={isLoading}
          >
            Reset Images
          </button>
        </div>
      )}
      {/* Dev Mode Toggle */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Developer Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => {
                const newDevMode = e.target.checked;
                if (!newDevMode && devMode) {
                  // Switching from dev mode to normal mode
                  resetDevMode();
                }
                setDevMode(newDevMode);
              }}
              className="sr-only peer"
              disabled={isLoading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
      {/* Error Message */}
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2 w-full max-w-md">
          {errorMessage}
        </div>
      )}

      {/* Canvas with Loading Overlay */}
      <div className="mt-8 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="border rounded-lg shadow-md cursor-move"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Loading overlay on canvas */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
              <LoadingSpinner />
              <p className="mt-2 text-gray-700 dark:text-gray-300">Loading images...</p>
            </div>
          </div>
        )}
      </div>

      {/* Coordinates - Only show in dev mode */}
      {devMode && (
        <div className="mt-4 text-center text-gray-700 dark:text-gray-300">
          <p>Overlay Position: <span className="font-bold">X: {Math.round(overlayPosition.x)}</span> / <span className="font-bold">Y: {Math.round(overlayPosition.y)}</span> / <span className="font-bold">Scale: {Math.round(overlayScale * 100)}%</span></p>
        </div>
      )}

      {/* Download & Copy Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <button
          onClick={downloadImage}
          className="w-full md:w-auto bg-primary text-primary-foreground rounded-lg py-2 px-4 font-semibold hover:bg-primary/90 transition"
          disabled={isLoading}
        >
          Download
        </button>
        <button
          onClick={copyToClipboard}
          className="w-full md:w-auto bg-primary text-primary-foreground rounded-lg py-2 px-4 font-semibold hover:bg-primary/90 transition"
          disabled={isLoading}
        >
          Copy
        </button>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV !== 'production' && debugInfo && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto max-h-96 w-full max-w-2xl">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </section>
  );
}