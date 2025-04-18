// hooks/use-nfts.ts
'use client'

import { useEffect, useState } from 'react'
import { fetchNFTs } from '@/app/actions/nft-actions' 

export function useNFTs(walletAddresses: string[]) {
  const [nfts, setNfts] = useState<any[]>([]) 
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (walletAddresses.length > 0) {
      const getNFTs = async () => {
        setLoading(true)
        setError(null)

        const { success, data, error } = await fetchNFTs(walletAddresses)

        if (success) {
          setNfts(data)
        } else {
          setError(error || 'Unknown error')
        }

        setLoading(false)
      }

      getNFTs()
    }
  }, [walletAddresses]) // Re-fetch NFTs when walletAddresses change

  return { nfts, loading, error }
}
