import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatSchoolGrade(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/profissional/i.test(text)) return text;
  if (/^\d+\.º(?:\s+Ano)?$/i.test(text)) return text.includes("Ano") ? text : `${text} Ano`;
  if (/^\d+$/.test(text)) return `${text}.º`;
  const match = text.match(/^(\d+)(?:\s*o|º)?(?:\s+Ano)?$/i);
  if (match) return `${match[1]}.º`;
  return text;
}
