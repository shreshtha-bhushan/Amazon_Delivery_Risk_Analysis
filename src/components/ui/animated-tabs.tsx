"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedTabsProps {
  tabs: { label: string; value?: string }[]
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function AnimatedTabs({ tabs, value, onChange, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(value || tabs[0]?.value || tabs[0]?.label)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (value !== undefined) setActiveTab(value)
  }, [value])

  useEffect(() => {
    const container = containerRef.current
    if (container && activeTab) {
      const activeTabElement = activeTabRef.current
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement
        const clipLeft = offsetLeft + 16
        const clipRight = offsetLeft + offsetWidth + 16
        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100,
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100,
        ).toFixed()}% round 17px)`
      }
    }
  }, [activeTab])

  const handleClick = (tab: { label: string; value?: string }) => {
    const val = tab.value || tab.label
    setActiveTab(val)
    onChange?.(val)
  }

  return (
    <div className={cn(
      "relative bg-white/[0.04] border border-white/[0.08] mx-auto flex w-fit flex-col items-center rounded-full py-2 px-4",
      className
    )}>
      <div
        ref={containerRef}
        className="absolute z-10 w-full overflow-hidden [clip-path:inset(0px_75%_0px_0%_round_17px)] [transition:clip-path_0.25s_ease]"
      >
        <div className="relative flex w-full justify-center bg-primary">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleClick(tab)}
              className="flex h-8 items-center rounded-full p-3 text-sm font-medium text-primary-foreground"
              tabIndex={-1}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex w-full justify-center">
        {tabs.map((tab, index) => {
          const val = tab.value || tab.label
          const isActive = activeTab === val

          return (
            <button
              key={index}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleClick(tab)}
              className="flex h-8 items-center cursor-pointer rounded-full p-3 text-sm font-medium text-muted-foreground"
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
