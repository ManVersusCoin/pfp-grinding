export interface NFT {
  id: string
  name: string
  tokenId: string
  collection: string
  collectionAddress: string
  image: string
  owner: string
  blockchain: string // Added blockchain field
  description?: string
  attributes?: any[]
}

