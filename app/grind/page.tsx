'use client'

import { useState } from 'react'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { EditableOverlay } from '@/components/EditableOverlay'
import { ExportButtons } from '@/components/ExportButtons'
import { NftSelector } from '@/components/NftSelector'
import { OverlayPicker } from '@/components/OverlayPicker'

export default function GrindPage() {
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff')
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)

  return (
    <main className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold">🎨 PFP Grinder</h1>

      <NftSelector onSelect={setSelectedNft} />

      {selectedNft && (
        <>
          <BackgroundPicker value={backgroundColor} onChange={setBackgroundColor} />
          <OverlayPicker onSelect={setSelectedOverlay} />

          <div
            id="canvas"
            className="relative w-[400px] h-[400px] rounded-xl overflow-hidden shadow-lg"
            style={{ backgroundColor }}
          >
            <img src={selectedNft} alt="Selected NFT" className="w-full h-full object-contain" />
            {selectedOverlay && <EditableOverlay src={selectedOverlay} />}
          </div>

          <ExportButtons exportTargetId="canvas" />
        </>
      )}
    </main>
  )
}