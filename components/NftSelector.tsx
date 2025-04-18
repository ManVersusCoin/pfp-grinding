'use client'

import { useEffect, useState } from 'react'
import { useAccount, useNFTs } from '@/hooks/use-nfts'

type Props = {
  onSelect: (url: string) => void
}

export function NftSelector({ onSelect }: Props) {
  const { address } = useAccount()
  const { nfts, loading } = useNFTs(address)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (selected) onSelect(selected)
  }, [selected])

  if (loading) return <p>Loading NFTs...</p>
  if (!nfts?.length) return <p>No NFTs found. Connect your wallet.</p>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <img
          key={nft.tokenId}
          src={nft.image}
          alt="NFT"
          className={`cursor-pointer rounded-xl border-4 transition-all ${
            selected === nft.image ? 'border-blue-500' : 'border-transparent'
          }`}
          onClick={() => setSelected(nft.image)}
        />
      ))}
    </div>
  )
}
