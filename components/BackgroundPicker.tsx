'use client'

type Props = {
  value: string
  onChange: (color: string) => void
}

export function BackgroundPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="bg-color">Background:</label>
      <input
        id="bg-color"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 p-0 border border-gray-300 rounded"
      />
    </div>
  )
}