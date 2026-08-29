import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformLogoName = "meta" | "tiktok" | "google" | "delivery";

export function PlatformLogo({
  platform,
  className,
  muted = false,
}: {
  platform: PlatformLogoName;
  className?: string;
  muted?: boolean;
}) {
  const classes = cn("shrink-0", muted && "grayscale opacity-60", className);

  if (platform === "meta") {
    return (
      <svg viewBox="0 0 48 28" aria-label="Meta" role="img" className={classes} fill="none">
        <path
          d="M4.4 23.2C6.8 13.4 10.1 5.1 15.8 5.1c6.6 0 8.8 12.2 12.6 12.2 3.3 0 5.8-6.2 8.7-12.2 1.3-2.6 3.1-3.9 5.2-3.9 2.3 0 3.8 1.9 3.8 5.2v16.8h-5.7V9.1c0-1.2-.3-1.7-.8-1.7-.7 0-1.4 1.1-2.1 2.5-2.7 5.3-5.4 12.9-10.5 12.9-5.7 0-7.4-11.9-11.4-11.9-3.1 0-5.8 6.5-7.8 12.3H2.1c.7 0 1.5 0 2.3 0Z"
          fill="#0081FB"
        />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg viewBox="0 0 32 32" aria-label="TikTok" role="img" className={classes} fill="none">
        <path d="M18.7 4.2v15.1a5.4 5.4 0 1 1-4.2-5.3v4.1a1.5 1.5 0 1 0 1.2 1.5V4.2h3Z" fill="#25F4EE" transform="translate(-1 1)" />
        <path d="M18.7 4.2v15.1a5.4 5.4 0 1 1-4.2-5.3v4.1a1.5 1.5 0 1 0 1.2 1.5V4.2h3Z" fill="#FE2C55" transform="translate(1 -1)" />
        <path d="M18.7 4.2v15.1a5.4 5.4 0 1 1-4.2-5.3v4.1a1.5 1.5 0 1 0 1.2 1.5V4.2h3c.9 2.5 2.7 4 5.6 4.4v3.2c-2.2-.1-4.2-.8-5.6-2v9.8a5.4 5.4 0 1 1-4.2-5.3v4.1a1.5 1.5 0 1 0 1.2 1.5V4.2h3Z" fill="#fff" />
      </svg>
    );
  }

  if (platform === "google") {
    return (
      <svg viewBox="0 0 48 48" aria-label="Google" role="img" className={classes}>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5Z" />
        <path fill="#FF3D00" d="M6.3 14.7 12.9 19.5C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.2 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7Z" />
        <path fill="#4CAF50" d="M24 44c5.1 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44Z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 3.9-4 5.2l.1-.1 6.2 5.2C37.2 38.7 44 34 44 24c0-1.2-.1-2.4-.4-3.5Z" />
      </svg>
    );
  }

  return <Truck aria-label="Delivery marketplaces" className={classes} />;
}
