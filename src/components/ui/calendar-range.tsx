import * as React from "react"
import { addDays } from "date-fns"
import { type DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"

interface CalendarRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
}

function CalendarRange({
  value,
  onChange,
}: CalendarRangeProps) {
  const [internal, setInternal] = React.useState<DateRange | undefined>(
    value ?? {
      from: new Date(new Date().getFullYear(), 0, 12),
      to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
    }
  )

  const range = value ?? internal

  const handleSelect = (newRange: DateRange | undefined) => {
    if (onChange) {
      onChange(newRange)
    } else {
      setInternal(newRange)
    }
  }

  return (
    <Card className="w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
        />
      </CardContent>
    </Card>
  )
}

CalendarRange.displayName = "CalendarRange"

export { CalendarRange }
