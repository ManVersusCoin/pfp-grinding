"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"

interface FallbackNFTImageProps {
  src: string
  alt: string
  className?: string
}

export function FallbackNFTImage({ src, alt, className = "" }: FallbackNFTImageProps) {
  const [hasError, setHasError] = useState(false)

  return hasError ? (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
        <ImageOff className="h-8 w-8 mb-2" />
        <span className="text-xs text-center">{alt || "Image not available"}</span>
      </div>
    </div>
  ) : (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}

