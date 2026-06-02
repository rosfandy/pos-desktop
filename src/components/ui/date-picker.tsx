import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { CalendarBlank } from "@phosphor-icons/react"

interface DatePickerProps {
  value?: Date | undefined
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | undefined>(value)

  React.useEffect(() => {
    setSelected(value)
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    setSelected(date)
    onChange?.(date)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          "flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1 text-left text-sm font-normal transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
          !selected && "text-muted-foreground",
          className
        )}
      >
        <CalendarBlank className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">
          {selected ? (
            format(selected, "dd MMM yyyy", { locale: id })
          ) : (
            <>{placeholder}</>
          )}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} align="start">
          <Popover.Popup className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none" style={{ zIndex: 2147483647, isolation: 'isolate' }}>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleSelect}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

DatePicker.displayName = "DatePicker"

export { DatePicker }
