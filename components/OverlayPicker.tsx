'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  onSelect: (url: string) => void
}

export function OverlayPicker({ onSelect }: Props) {
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSelect(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto items-center">
      {images.map((src) => (
        <img
          key={src}
          src={src}
          className="w-16 h-16 cursor-pointer border border-gray-300 hover:border-blue-500 rounded"
          onClick={() => onSelect(src)}
        />
      ))}

      {/* Custom upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-16 h-16 border border-dashed border-gray-400 rounded flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 bg-white dark:bg-gray-800"
        title="Add your overlay"
      >
        <Plus className="w-6 h-6" />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </button>
    </div>
  )
}
