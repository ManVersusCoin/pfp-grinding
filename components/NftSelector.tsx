// components/NftSelector.tsx
import { useState } from 'react'
import { useAccount } from '@/hooks/use-account'
import { useNFTs } from '@/hooks/use-nfts'

export function NftSelector({ onSelect }: { onSelect: (nft: string) => void }) {
  const { address, updateAddress } = useAccount()  // Récupère le hook pour gérer l'adresse manuelle
  const [inputAddress, setInputAddress] = useState<string>(address || '') // état pour le champ d'entrée
  const { nfts, loading, error } = useNFTs(address ? [address] : [])

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputAddress(e.target.value)
  }

  const handleAddressSubmit = () => {
    updateAddress(inputAddress)  // Met à jour l'adresse avec l'entrée de l'utilisateur
  }

  if (loading) return <div>Loading NFTs...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Select Your NFT</h2>

      {/* Champ de saisie d'adresse */}
      <div className="mb-4">
        <input
          type="text"
          value={inputAddress}
          onChange={handleAddressChange}
          placeholder="Enter wallet address"
          className="p-2 border rounded-md"
        />
        <button
          onClick={handleAddressSubmit}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Load NFTs
        </button>
      </div>

      {/* Affichage des NFTs */}
      {nfts.length > 0 ? (
        nfts.map((nft) => (
          <div key={nft.id} onClick={() => onSelect(nft.image)} className="cursor-pointer">
            <img src={nft.image} alt={nft.name} width={100} height={100} />
            <p>{nft.name}</p>
          </div>
        ))
      ) : (
        <p>No NFTs found</p>
      )}
    </div>
  )
}
