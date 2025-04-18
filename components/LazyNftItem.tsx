import { useInView } from 'react-intersection-observer'

export function LazyNftItem({ nft, onSelect }: { nft: any; onSelect: (url: string) => void }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className="min-h-[64px]">
      {inView && (
        <div onClick={() => onSelect(nft.image)} className="flex items-center cursor-pointer">
          <img
            src={nft.image}
            alt={nft.tokenId}
            className="w-16 h-16 object-cover rounded-full mr-4"
          />
          <div>
            <h4 className="text-sm font-semibold">{nft.collection}</h4>
            <p className="text-xs text-gray-500">{nft.name} - {nft.tokenId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
