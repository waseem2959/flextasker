import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Label } from "./label";
import { Input } from "./input";

interface DateTimePickerProps {
  readonly date: Date | undefined;
  readonly setDate: (date: Date | undefined) => void;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly showTime?: boolean;
  readonly label?: string;
  readonly error?: string;
}

export function DateTimePicker({
  date,
  setDate,
  className,
  disabled = false,
  showTime = true,
  label,
  error,
}: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = useState<string>(
    date ? format(date, "HH:mm") : ""
  );

  // Update time when date changes
  useEffect(() => {
    if (date) {
      setSelectedTime(format(date, "HH:mm"));
    }
  }, [date]);

  // Combine date and time
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (showTime && selectedTime) {
        const [hours, minutes] = selectedTime.split(":").map(Number);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
      }
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);

    if (date && newTime) {
      const newDate = new Date(date);
      const [hours, minutes] = newTime.split(":").map(Number);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-[hsl(206,33%,16%)]">
          {label}
        </Label>
      )}
      
      <div className="flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start text-left font-normal border-[hsl(215,16%,80%)]",
                !date && "text-[hsl(220,14%,46%)]",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-[hsl(196,80%,43%)]" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              defaultMonth={date}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>

        {showTime && (
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(196,80%,43%)]" />
            <Input
              type="time"
              value={selectedTime}
              onChange={handleTimeChange}
              className="pl-10 border-[hsl(215,16%,80%)]"
              disabled={disabled || !date}
            />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-[hsl(354,70%,54%)]">{error}</p>
      )}
    </div>
  );
}

export default DateTimePicker;
