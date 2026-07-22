'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  getUserInitials,
  resolveUserAvatarUrl,
  withAvatarCacheBust,
} from '@/lib/user/resolve-user-avatar';

const SIZE_CLASSES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg',
} as const;

export type UserAvatarSize = keyof typeof SIZE_CLASSES;

export interface UserAvatarProps {
  profilePicture?: string | null;
  image?: string | null;
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: UserAvatarSize;
  className?: string;
  fallbackClassName?: string;
  /** Bump when photo changes to bust browser cache */
  cacheVersion?: string | number | null;
  alt?: string;
}

export default function UserAvatar({
  profilePicture,
  image,
  name,
  email,
  firstName,
  lastName,
  size = 'md',
  className,
  fallbackClassName,
  cacheVersion,
  alt,
}: UserAvatarProps) {
  const resolved = resolveUserAvatarUrl(profilePicture, image);
  const src = withAvatarCacheBust(resolved, cacheVersion);
  const initials = getUserInitials(name, email, firstName, lastName);

  return (
    <Avatar
      className={cn(
        'shrink-0 overflow-hidden rounded-full',
        SIZE_CLASSES[size],
        className
      )}
    >
      {src ? (
        <AvatarImage src={src} alt={alt || name || 'Profile photo'} />
      ) : null}
      <AvatarFallback
        className={cn(
          'rounded-full bg-gradient-to-br from-teal-500 via-indigo-600 to-violet-600 font-semibold text-white',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export { UserAvatar };
