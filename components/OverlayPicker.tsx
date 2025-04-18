'use client'

import { useState, useEffect } from 'react'

type Props = {
  onSelect: (url: string) => void
}

export function OverlayPicker({ onSelect }: Props) {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    setImages([
      '/overlays/01.png',
      '/overlays/Pose02.png',
      '/overlays/Hat01.png',
      '/overlays/Hat02.png',
      '/overlays/Hat03.png',
      '/overlays/Hat04.png',
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