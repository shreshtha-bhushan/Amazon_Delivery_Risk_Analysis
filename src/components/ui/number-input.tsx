"use client"

import { useId, useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function NumberInput({
  value,
  onChange,
  label,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className,
}: NumberInputProps) {
  const id = useId()
  // raw string so user can type "-" or "12." without snapping
  const [raw, setRaw] = useState(String(value))

  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const commit = (s: string) => {
    const p = parseFloat(s)
    const final = isNaN(p) ? value : clamp(+p.toFixed(6))
    setRaw(String(final))
    onChange(final)
  }

  const increment = () => {
    const next = clamp(+(value + step).toFixed(6))
    setRaw(String(next))
    onChange(next)
  }
  const decrement = () => {
    const next = clamp(+(value - step).toFixed(6))
    setRaw(String(next))
    onChange(next)
  }

  const hasValue = raw !== "" && raw !== "-" && raw !== "."

  return (
    <div className={cn("w-full group", className)}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={raw}
          onChange={(e) => {
            const v = e.target.value
            setRaw(v)
            const p = parseFloat(v)
            if (!isNaN(p)) onChange(clamp(+p.toFixed(6)))
          }}
          onBlur={(e) => commit(e.target.value)}
          className={cn(
            "peer w-full h-11 pl-4 pr-10 text-white bg-transparent",
            "border border-white/12 rounded-xl",
            "focus:outline-none focus:ring-1 focus:ring-amazon-orange/40 focus:border-amazon-orange/50",
            "transition-all text-sm tabular-nums placeholder-transparent"
          )}
          placeholder=" "
        />

        {/* Floating label — floats when focused OR has value */}
        <label
          htmlFor={id}
          className={cn(
            "absolute left-4 pointer-events-none select-none transition-all duration-200",
            // floated state
            "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-amazon-orange/70 peer-focus:px-1 peer-focus:bg-[#0d0d0d]",
            hasValue
              ? "top-0 -translate-y-1/2 text-[10px] text-white/40 px-1 bg-[#0d0d0d] uppercase tracking-widest"
              : "top-1/2 -translate-y-1/2 text-xs text-white/35 uppercase tracking-widest"
          )}
        >
          {label}
        </label>

        {/* Chevron buttons */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col h-9 justify-between">
          <button
            type="button"
            tabIndex={-1}
            onClick={increment}
            className="flex items-center justify-center w-8 h-[18px] rounded hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <ChevronUp size={11} className="text-white/50 group-hover:text-white/70 transition-colors" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={decrement}
            className="flex items-center justify-center w-8 h-[18px] rounded hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <ChevronDown size={11} className="text-white/50 group-hover:text-white/70 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
