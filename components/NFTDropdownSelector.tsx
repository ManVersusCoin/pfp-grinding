import { useState } from 'react';
import Image from 'next/image';

type NFT = {
  id: string;
  name: string;
  image: string;
  collection: string;
};

export default function NFTDropdownSelector({
  filteredNFTs,
  onSelect,
}: {
  filteredNFTs: NFT[];
  onSelect: (url: string) => void; 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  const visibleNFTs = filteredNFTs.filter((nft) =>
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsOpen(false);
    onSelect(nft.image); // Passer l'URL de l'image
  };

  const handleLoadNFTs = () => {
    setSelectedNFT(null); // Réinitialiser la sélection
    setIsOpen(false); // Fermer la liste déroulante
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold mb-2">Select Your NFT</h2>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-sm shadow-sm dark:text-white dark:border-gray-600"
      >
        {selectedNFT ? (
          <div className="flex items-center gap-2 truncate">
            <Image
              src={selectedNFT.image}
              alt={selectedNFT.name}
              width={24}
              height={24}
              className="rounded-sm"
            />
            <span className="truncate">{selectedNFT.name}</span>
          </div>
        ) : (
          <span className="text-gray-400">Choose an NFT ({visibleNFTs.length} found)...</span>
        )}
        <svg
          className="w-4 h-4 text-gray-500 dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-1 border rounded-md shadow-md bg-white dark:bg-gray-700 z-10 max-h-60 overflow-y-auto dark:border-gray-600">
          <input
            type="text"
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 border-b text-sm focus:outline-none dark:bg-gray-800 dark:text-white"
          />
          {visibleNFTs.length > 0 ? (
            visibleNFTs.map((nft) => (
              <button
                key={nft.id}
                onClick={() => handleNFTSelect(nft)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Image
                  src={nft.image}
                  alt={nft.name}
                  width={24}
                  height={24}
                  className="rounded-sm mr-2"
                />
                {nft.collection} - {nft.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No NFTs found</div>
          )}
        </div>
      )}

    </div>
  );
}
