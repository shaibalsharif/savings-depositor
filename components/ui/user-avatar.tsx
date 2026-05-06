"use client";

import { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

export function UserAvatar({ src, name, className = "w-8 h-8" }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className={`${className} rounded-full overflow-hidden border bg-muted/30 flex items-center justify-center text-xs font-bold select-none flex-shrink-0`}>
      {(src && !hasError) ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
