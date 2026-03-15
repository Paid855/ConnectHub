// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Translation dictionary with dating-specific phrases
 */
export const en = {
  loading: "Finding your perfect match...",
  error: "Oops! Something went wrong in the love department",
  success: "Success! Sparks are flying!",
  common: {
    today: "Today",
    yesterday: "Yesterday",
    online: "Online now",
    lastSeen: "Last seen {time}",
    newMatch: "New match!",
    mutualLike: "It's a match!",
    messageReceived: "New message",
  },
  profile: {
    incomplete: "Complete your profile to get more matches",
    completePercentage: "Profile {percentage}% complete",
  },
  // Add more translations as needed
};

/**
 * Advanced className merger with Tailwind optimization
 * Better alternative to your cn() function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Dating-specific color palette utilities
 */
export const datingColors = {
  primary: "bg-rose-500 hover:bg-rose-600 text-white",
  secondary: "bg-pink-100 hover:bg-pink-200 text-rose-700",
  success: "bg-emerald-500 hover:bg-emerald-600 text-white",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  info: "bg-sky-500 hover:bg-sky-600 text-white",
  premium: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  getRandomGradient: () => {
    const gradients = [
      "bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500",
      "bg-gradient-to-r from-amber-400 to-pink-500",
      "bg-gradient-to-r from-emerald-400 to-cyan-500",
      "bg-gradient-to-r from-violet-400 to-purple-500",
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  },
};

/**
 * Enhanced date formatting for dating app
 */
export const formatDatingDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return format(dateObj, "'Today at' h:mm a");
  }
  if (isYesterday(dateObj)) {
    return format(dateObj, "'Yesterday at' h:mm a");
  }
  return format(dateObj, "MMM d, yyyy 'at' h:mm a");
};

/**
 * Relative time for last seen/messages
 */
export const relativeTime = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthdate: Date | string): number => {
  const birthDate = typeof birthdate === "string" ? new Date(birthdate) : birthdate;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Delay with progress simulation
 */
export const sleep = (ms: number, withProgress = false): Promise<void> => {
  if (!withProgress) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return new Promise(resolve => {
    const interval = setInterval(() => {
      // Simulate progress (could be used with loading indicators)
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, ms);
  });
};

/**
 * Generate a placeholder avatar URL with customizable options
 */
export const generateAvatar = (options?: {
  seed?: string;
  size?: number;
  type?: 'identicon' | 'bottts' | 'avataaars' | 'jdenticon';
}): string => {
  const {
    seed = Math.random().toString(36).substring(7),
    size = 200,
    type = 'avataaars'
  } = options || {};
  
  return `https://avatars.dicebear.com/api/${type}/${seed}.svg?size=${size}`;
};

/**
 * Calculate match percentage (simplified example)
 */
export const calculateMatchPercentage = (
  user1Interests: string[],
  user2Interests: string[]
): number => {
  const commonInterests = user1Interests.filter(interest =>
    user2Interests.includes(interest)
  ).length;
  
  const maxPossible = Math.max(user1Interests.length, user2Interests.length);
  return Math.round((commonInterests / maxPossible) * 100);
};

/**
 * Format distance for dating profiles
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <F extends (...args: any[]) => void>(
  func: F,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Generate a random love quote (for empty states or loading)
 */
export const randomLoveQuote = (): string => {
  const quotes = [
    "Love is composed of a single soul inhabiting two bodies.",
    "The best thing to hold onto in life is each other.",
    "We are most alive when we're in love.",
    "Love isn't something you find. Love is something that finds you.",
    "To love and be loved is to feel the sun from both sides.",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};