'use client'

import { useState } from 'react'
import { Rnd } from 'react-rnd'

type Props = {
  src: string
}

export function EditableOverlay({ src }: Props) {
  const [rotation, setRotation] = useState(0)

  const handleRotate = () => {
    
    setRotation((prev) => (prev + 2) % 360)
  }

  return (
    <div className="relative">
      {/* Bouton de rotation */}
      <button
        onClick={handleRotate}
        className="absolute top-0 right-0 bg-gray-500 text-white p-2 rounded-full"
        style={{ zIndex: 10 }}
      >
        Rotate
      </button>

      {/* Rnd composant pour gérer le redimensionnement et le déplacement */}
      <Rnd
        default={{
          x: 100,
          y: 100,
          width: 150,
          height: 150,
        }}
        bounds="parent"
        enableResizing
        lockAspectRatio
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <img
          src={src}
          alt="Overlay"
          className="w-full h-full object-contain pointer-events-none"
        />
      </Rnd>
    </div>
  )
}
