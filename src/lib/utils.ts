import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
) {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "decimal",
    maximumFractionDigits: 2,
    ...options,
  };
  
  return new Intl.NumberFormat("en-US", defaultOptions).format(value);
}
