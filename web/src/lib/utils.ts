import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return score.toFixed(2)
}

export function getLikelihood(current: number, target: number): { label: string; color: string } {
  if (current >= target + 2) return { label: 'Chắc chắn', color: 'text-green-600' }
  if (current >= target) return { label: 'Có thể đậu', color: 'text-yellow-600' }
  if (current >= target - 1.5) return { label: 'Cần thêm điểm', color: 'text-orange-500' }
  return { label: 'Khó đậu', color: 'text-red-500' }
}

export function averageScore(scores: (number | null)[]): number {
  const valid = scores.filter((s): s is number => s !== null && !isNaN(s))
  if (valid.length === 0) return 0
  return valid.reduce((a, b) => a + b, 0) / valid.length
}