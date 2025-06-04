import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";
import { DayPicker } from "react-day-picker";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // Layout
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium font-primary text-[hsl(206,33%,16%)]",
        
        // Navigation
        nav: "space-x-1 flex items-center",
        nav_button: "hidden", // Hide default nav buttons since we're using custom ones
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        
        // Table
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-[hsl(220,14%,46%)] rounded-md w-9 font-normal text-[0.8rem] font-primary",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[hsl(196,80%,95%)]/50 [&:has([aria-selected])]:bg-[hsl(196,80%,95%)] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        
        // Day states
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-[hsl(196,80%,43%)] text-white hover:bg-[hsl(192,84%,26%)] hover:text-white focus:bg-[hsl(196,80%,43%)] focus:text-white",
        day_today: "bg-[hsl(196,80%,95%)] text-[hsl(196,80%,43%)]",
        day_outside: "day-outside text-[hsl(220,14%,46%)] opacity-50 aria-selected:bg-[hsl(196,80%,95%)]/50 aria-selected:text-[hsl(220,14%,46%)] aria-selected:opacity-30",
        day_disabled: "text-[hsl(220,14%,46%)] opacity-50",
        day_range_middle: "aria-selected:bg-[hsl(196,80%,95%)] aria-selected:text-[hsl(196,80%,43%)]",
        day_hidden: "invisible",
        
        // Merge any additional classNames
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
