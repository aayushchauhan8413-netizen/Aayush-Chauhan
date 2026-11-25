import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import type { JobSector } from '../types';

export const HERO_WORKPLACE_IMAGE =
  '/src/assets/images/hero_future_workplace_1795611087881.jpg';

export const SECTOR_IMAGES: Record<JobSector, { src: string; alt: string }> = {
  'AI & Software Systems': {
    src: '/src/assets/images/hero_future_workplace_1795611087881.jpg',
    alt: 'Engineers collaborating on next-generation software and hardware prototypes in a sunlit studio',
  },
  'Clean Energy & Grid': {
    src: '/src/assets/images/sector_clean_energy_1795611088822.jpg',
    alt: 'Engineers testing solid-state battery modules inside a clean energy laboratory',
  },
  'Autonomous Robotics': {
    src: '/src/assets/images/sector_autonomous_robotics_1795611091549.jpg',
    alt: 'Articulated white robotic arm calibrating precision optical sensors in a modern robotics bay',
  },
  'Quantum Computing': {
    src: '/src/assets/images/sector_quantum_bio_1795611088762.jpg',
    alt: 'Researchers aligning optical mounts on a quantum photonics bench',
  },
  'Healthcare & Bio-Engineering': {
    src: '/src/assets/images/sector_quantum_bio_1795611088762.jpg',
    alt: 'Precision microfluidic and optical bench in a bio-engineering facility',
  },
  'Cybersecurity & Digital Trust': {
    src: '/src/assets/images/hero_future_workplace_1795611087881.jpg',
    alt: 'Security engineers reviewing system architecture in a modern studio',
  },
  'Spatial & XR Design': {
    src: '/src/assets/images/hero_future_workplace_1795611087881.jpg',
    alt: 'Designers and engineers inspecting prototype spatial hardware in a daylight studio',
  },
  'Climate Finance & Policy': {
    src: '/src/assets/images/sector_clean_energy_1795611088822.jpg',
    alt: 'Clean energy engineering laboratory supporting climate transition programs',
  },
  'AI Safety & Governance': {
    src: '/src/assets/images/hero_future_workplace_1795611087881.jpg',
    alt: 'Researchers reviewing technical systems in a modern studio',
  },
  'Space & Smart Logistics': {
    src: '/src/assets/images/sector_autonomous_robotics_1795611091549.jpg',
    alt: 'Precision autonomous hardware calibration bay for aerospace and logistics systems',
  },
};

interface EditorialImageProps {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
}

export function EditorialImage({
  src,
  alt,
  fallbackLabel,
  className = 'w-full h-full object-cover',
}: EditorialImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-600 p-6 text-center ${className}`}
      >
        <Briefcase className="w-7 h-7 text-slate-400 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium tracking-tight text-slate-600">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
