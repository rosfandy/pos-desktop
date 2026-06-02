import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarBlank } from "@phosphor-icons/react"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
  disabled?: boolean
}

function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setRange(value)
  }, [value])

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)
    if (newRange?.from && newRange?.to) {
      onChange?.(newRange)
      setOpen(false)
    } else {
      onChange?.(newRange)
    }
  }

  const displayText = React.useMemo(() => {
    if (!range?.from) return "Pilih rentang tanggal"
    if (!range?.to)
      return `${format(range.from, "dd MMM yyyy", { locale: id })} - Pilih akhir`
    return `${format(range.from, "dd MMM yyyy", { locale: id })} - ${format(range.to, "dd MMM yyyy", { locale: id })}`
  }, [range])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal",
          !range?.from && "text-muted-foreground",
          className
        )}
      >
        <CalendarBlank className="mr-2 size-4 shrink-0" />
        <span className="truncate">{displayText}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} align="start" positionMethod="fixed" className="z-[9999]">
          <Popover.Popup className="rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-md outline-none">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              defaultMonth={range?.from}
              numberOfMonths={2}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

DateRangePicker.displayName = "DateRangePicker"

export { DateRangePicker }
