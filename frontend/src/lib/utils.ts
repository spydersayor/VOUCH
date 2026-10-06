import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupees(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return "Rs " + num.toLocaleString("en-IN");
}
