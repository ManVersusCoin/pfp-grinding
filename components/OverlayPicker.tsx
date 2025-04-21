'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

type Props = {
  onSelect: (url: string) => void
  onAddText: () => void
}

export function OverlayPicker({ onSelect, onAddText }: Props) {
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
      '/overlays/Head01.png',
      '/overlays/Head02.png',
      '/overlays/Head03.png',
      '/overlays/Head04.png',
      '/overlays/Head05.png',
      '/overlays/Head06.png',
      '/overlays/Head07.png',
      '/overlays/Head08.png',
      '/overlays/Head09.png',
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
    <div className="flex flex-wrap gap-2 items-center w-full justify-start">
      {images.map((src) => (
        <img
          key={src}
          src={src}
          className="w-16 h-16 cursor-pointer border border-gray-300 hover:border-blue-500 rounded"
          onClick={() => onSelect(src)}
        />
      ))}

      {/* Upload overlay */}
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

      {/* Add text overlay */}
      <button
        onClick={onAddText}
        className="w-16 h-16 border border-dashed border-gray-400 rounded flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-500 bg-white dark:bg-gray-800"
        title="Add text overlay"
      >
        <span className="text-2xl font-bold">T</span>
      </button>
    </div>
  )
}
