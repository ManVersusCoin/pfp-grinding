// components/NftSelector.tsx
import React from 'react'

type NftSelectorProps = {
  nfts: any[]
  onSelect: (nft: string) => void
}

export const NftSelector: React.FC<NftSelectorProps> = ({ nfts, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {nfts.map((nft) => (
        <div
          key={nft.id}
          className="cursor-pointer"
          onClick={() => onSelect(nft.image)}
        >
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-auto rounded-lg border-2 border-gray-300"
          />
          <div className="text-center mt-2">
            <span className="text-sm">{nft.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
