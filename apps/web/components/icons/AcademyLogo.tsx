import Image from 'next/image';
import logoImg from '@/public/icons/all-stars-hi-res.jpg';

interface AcademyLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function AcademyLogo({
  className = 'w-16 h-16',
  width = 512,
  height = 512,
  priority = true,
}: AcademyLogoProps) {
  return (
    <Image
      src={logoImg}
      alt="Academy Logo"
      width={width}
      height={height}
      className={`object-contain rounded-full ${className}`}
      priority={priority}
      unoptimized
    />
  );
}