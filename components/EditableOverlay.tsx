'use client'

import { Rnd } from 'react-rnd'

type Props = {
  src: string
}

export function EditableOverlay({ src }: Props) {
  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      }}
      bounds="window"
      enableResizing
      lockAspectRatio
    >
      <img src={src} alt="Overlay" className="w-full h-full object-contain pointer-events-none" />
    </Rnd>
  )
}