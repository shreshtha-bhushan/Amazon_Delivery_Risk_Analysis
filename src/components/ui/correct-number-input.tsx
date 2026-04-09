"use client"

import { useState, useId } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CorrectNumberInputProps {
  value?: number
  onChange?: (value: number) => void
  label?: string
  min?: number
  className?: string
}

export default function CorrectNumberInput({
  value: externalValue,
  onChange,
  label = "Amount",
  min = 0,
  className,
}: CorrectNumberInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? 0)
  const value = externalValue ?? internalValue
  const id = useId()

  const set = (n: number) => {
    const clamped = Math.max(min, n)
    setInternalValue(clamped)
    onChange?.(clamped)
  }

  const increment = () => set(value + 1)
  const decrement = () => set(value - 1)
  const hasValue = value !== 0

  return (
    <div className={cn("w-full", className)}>
      <div className="relative group">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hasValue ? value : ""}
          onChange={(e) => {
            const v = e.target.value
            set(v === "" ? 0 : Number(v))
          }}
          className={cn(
            "peer w-full h-11 pl-4 pr-10 text-white bg-transparent placeholder-transparent",
            "border border-white/12 rounded-xl",
            "focus:outline-none focus:ring-1 focus:ring-amazon-orange/40 focus:border-amazon-orange/50",
            "transition-all text-sm tabular-nums"
          )}
          placeholder=" "
        />

        {/* Floating label */}
        <label
          htmlFor={id}
          className={cn(
            "absolute left-4 pointer-events-none select-none transition-all duration-200 uppercase tracking-widest",
            hasValue
              ? "top-0 -translate-y-1/2 text-[10px] text-white/40 px-1 bg-[#0d0d0d]"
              : "top-1/2 -translate-y-1/2 text-xs text-white/35 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-amazon-orange/70 peer-focus:px-1 peer-focus:bg-[#0d0d0d]"
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
