import { EyeOff } from 'lucide-react'

export default function DesensitizedInfo({ value, label }: { value: string; label?: string }) {
  if (!value) return <span className="text-slate-400">-</span>
  return (
    <span className="inline-flex items-center gap-1.5 group relative">
      <span className="text-slate-700">{value}</span>
      <EyeOff className="w-3.5 h-3.5 text-amber-500" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label || '该信息已脱敏处理'}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}
