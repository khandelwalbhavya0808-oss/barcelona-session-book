import * as React from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfToday,
  endOfToday,
} from "date-fns";
import { Calendar as CalendarIcon, Clock, CalendarDays, CalendarRange } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ className, date, setDate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetSelect = (value: string) => {
    const today = new Date();
    switch (value) {
      case "today":
        setDate({ from: startOfToday(), to: endOfToday() });
        break;
      case "this-week":
        setDate({ from: startOfWeek(today), to: endOfWeek(today) });
        break;
      case "this-month":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "last-7-days":
        setDate({ from: subDays(today, 7), to: today });
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-transparent",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-3 flex flex-col gap-2 min-w-[150px]">
              <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Presets
              </div>
              <Button
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => handlePresetSelect("today")}
              >
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Today
              </Button>
              <Button
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => handlePresetSelect("this-week")}
              >
                <CalendarDays className="mr-2 h-4 w-4 text-emerald-500" />
                This Week
              </Button>
              <Button
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => handlePresetSelect("this-month")}
              >
                <CalendarRange className="mr-2 h-4 w-4 text-purple-500" />
                This Month
              </Button>
              <Button
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => handlePresetSelect("last-7-days")}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                Last 7 Days
              </Button>
              <Button
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => {
                  setDate(undefined);
                  setIsOpen(false);
                }}
              >
                Clear Filter
              </Button>
            </div>
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
