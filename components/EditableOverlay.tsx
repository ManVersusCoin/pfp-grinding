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
      <button
        onClick={handleRotate}
        className="absolute -top-4 -right-4 bg-blue-600 text-white p-1 rounded-full shadow z-10"
      >
        ↻
      </button>

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
          border: '2px dashed #ccc',
        }}
        resizeHandleStyles={{
          bottomRight: {
            width: '12px',
            height: '12px',
            background: '#333',
            borderRadius: '2px',
            position: 'absolute',
            right: '0',
            bottom: '0',
            cursor: 'se-resize',
          },
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
