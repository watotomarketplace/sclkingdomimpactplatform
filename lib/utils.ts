import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name.split(" ")[0]}`;
  if (hour < 17) return `Good afternoon, ${name.split(" ")[0]}`;
  return `Good evening, ${name.split(" ")[0]}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export const MONTH_TITLES: Record<number, string> = {
  1: "Discovery",
  2: "MVP Design",
  3: "Prototype",
  4: "Pilot",
  5: "Launch",
  6: "Impact",
};

export const MONTH_SUBTITLES: Record<number, string> = {
  1: "Mapping your world, naming your burden",
  2: "Building the smallest thing that proves your idea",
  3: "Putting something real in people's hands",
  4: "Testing in the real world",
  5: "Going live with purpose",
  6: "Measuring what matters to the Kingdom",
};
