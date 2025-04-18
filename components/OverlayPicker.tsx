'use client'

import { useState, useEffect } from 'react'

type Props = {
  onSelect: (url: string) => void
}

export function OverlayPicker({ onSelect }: Props) {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    setImages([
      '/overlays/hat.png',
      '/overlays/glasses.png',
      '/overlays/sparkle.png',
    ])
  }, [])

  return (
    <div className="flex gap-2 overflow-x-auto">
      {images.map((src) => (
        <img
          key={src}
          src={src}
          className="w-16 h-16 cursor-pointer border border-gray-300 hover:border-blue-500 rounded"
          onClick={() => onSelect(src)}
        />
      ))}
    </div>
  )
}