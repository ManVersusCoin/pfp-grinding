export function normalizeImageUrl(url: string): string {
  if (!url) return ""

  // Trim whitespace
  url = url.trim()

  // Handle IPFS URLs
  if (url.startsWith("ipfs://")) {
    // Use a reliable IPFS gateway
    return url.replace("ipfs://", "https://ipfs.io/ipfs/")
  }

  // Handle Arweave URLs
  if (url.startsWith("ar://")) {
    return url.replace("ar://", "https://arweave.net/")
  }

  // Handle HTTP URLs that might not be secure
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://")
  }

  // Handle relative URLs that might be missing the protocol
  if (url.startsWith("//")) {
    return `https:${url}`
  }

  // Handle URLs that might be encoded in metadata
  try {
    // Check if the URL is a JSON string containing an image URL
    if (url.startsWith("{") && url.endsWith("}")) {
      const parsed = JSON.parse(url)
      if (parsed.image) return normalizeImageUrl(parsed.image)
      if (parsed.url) return normalizeImageUrl(parsed.url)
    }
  } catch (e) {
    // Not a valid JSON string, continue with original URL
  }

  return url
}

