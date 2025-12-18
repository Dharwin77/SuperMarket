import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string with ₹ symbol
 */
export function formatCurrency(
  amount: number,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    useThousandSeparator?: boolean;
  }
): string {
  const {
    decimals = 2,
    showSymbol = true,
    useThousandSeparator = true,
  } = options || {};

  const formattedNumber = useThousandSeparator
    ? amount.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : amount.toFixed(decimals);

  return showSymbol ? `₹${formattedNumber}` : formattedNumber;
}
