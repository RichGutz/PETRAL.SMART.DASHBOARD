import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

interface MonthPickerProps {
  value: string; // "YYYY-MM" format
  onChange: (value: string) => void;
  minDate?: string; // "YYYY-MM"
  maxDate?: string; // "YYYY-MM"
  placeholder?: string;
  className?: string;
}

export function MonthPicker({ value, onChange, minDate, maxDate, placeholder, className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse current value or fallback to current year
  const initialDate = value ? new Date(value + "-01T00:00:00") : new Date();
  const [year, setYear] = React.useState(initialDate.getFullYear());

  // Whenever the popover opens, sync the year to the selected value
  React.useEffect(() => {
    if (open && value) {
      setYear(new Date(value + "-01T00:00:00").getFullYear());
    }
  }, [open, value]);

  const handleMonthSelect = (monthIndex: number) => {
    // Format Month as "MM"
    const mStr = String(monthIndex + 1).padStart(2, '0');
    onChange(`${year}-${mStr}`);
    setOpen(false);
  };

  const isMonthDisabled = (monthIndex: number) => {
    const currentStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    if (minDate && currentStr < minDate) return true;
    if (maxDate && currentStr > maxDate) return true;
    return false;
  };

  const displayValue = value 
    ? `${MONTHS[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
    : placeholder || "Seleccionar";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        className={`flex items-center w-full h-8 justify-between px-3 text-xs font-normal bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors ${className || ''}`}
      >
        {displayValue}
        <CalendarIcon className="h-3 w-3 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 z-50 bg-white" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold text-sm text-slate-800">{year}</div>
          <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((m, i) => {
            const disabled = isMonthDisabled(i);
            const isSelected = value === `${year}-${String(i + 1).padStart(2, '0')}`;
            return (
              <Button
                key={m}
                variant={isSelected ? "default" : "ghost"}
                className={`h-9 text-xs font-medium ${isSelected ? 'bg-petral-blue text-white hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} ${disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled) handleMonthSelect(i);
                }}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
