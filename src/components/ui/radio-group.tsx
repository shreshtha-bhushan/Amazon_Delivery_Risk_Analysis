"use client";

import { RadioGroup } from "@ark-ui/react/radio-group";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface RadioGridOption {
  value: string;
  label: string;
  icon?: string | LucideIcon;
}

interface RadioGridProps {
  options: RadioGridOption[];
  value?: string;
  onChange?: (value: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function RadioGrid({
  options,
  value,
  onChange,
  columns = 2,
  className,
}: RadioGridProps) {
  const colClass =
    columns === 3 ? "grid-cols-3" : columns === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <RadioGroup.Root
      className={cn(`grid ${colClass} gap-2 w-full`, className)}
      value={value}
      onValueChange={(details) => { if (details.value) onChange?.(details.value) }}
    >
      {options.map((opt) => {
        const isEmoji = typeof opt.icon === "string";
        const IconComp = !isEmoji ? (opt.icon as LucideIcon) : null;

        return (
          <RadioGroup.Item
            key={opt.value}
            value={opt.value}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-white/[0.03] border border-white/[0.08] rounded-xl cursor-pointer hover:bg-white/[0.06] hover:border-white/15 data-[state=checked]:border-amazon-orange/40 data-[state=checked]:bg-amazon-orange/[0.06] transition-all duration-200"
          >
            {isEmoji && (
              <span className="text-xl emoji-mono">{opt.icon as string}</span>
            )}
            {IconComp && (
              <IconComp className="w-4 h-4 text-white/40" />
            )}
            <RadioGroup.ItemText className="text-[11px] font-medium text-white/50">
              {opt.label}
            </RadioGroup.ItemText>
            <RadioGroup.ItemHiddenInput />
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
