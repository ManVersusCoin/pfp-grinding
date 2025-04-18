// hooks/use-account.ts
'use client'

import { useState } from 'react'

export function useAccount(initialAddress: string | null = null) {
  const [address, setAddress] = useState<string | null>(initialAddress)

  const updateAddress = (newAddress: string) => {
    setAddress(newAddress)
  }

  return { address, updateAddress }
}
