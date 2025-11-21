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
  
  const locale = options.currency === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, defaultOptions).format(value);
}
