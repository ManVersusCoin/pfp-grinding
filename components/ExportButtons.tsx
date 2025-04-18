'use client'

import html2canvas from 'html2canvas'

interface Props {
  exportTargetId: string
}

export function ExportButtons({ exportTargetId }: Props) {
  const handleExport = async () => {
    const node = document.getElementById(exportTargetId)
    if (!node) return

    const canvas = await html2canvas(node)
    const url = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = 'custom-nft.png'
    link.href = url
    link.click()
  }

  const handleCopy = async () => {
    const node = document.getElementById(exportTargetId)
    if (!node) return

    const canvas = await html2canvas(node)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
    })
  }

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded shadow">
        Download
      </button>
      <button onClick={handleCopy} className="px-4 py-2 bg-gray-300 rounded shadow">
        Copy to Clipboard
      </button>
    </div>
  )
}
