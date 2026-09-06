/// <reference types="vite/client" />

declare module 'lucide-react' {
  import * as React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = React.FC<IconProps>;
  export const Tv: Icon;
  export const Radio: Icon;
  export const Smartphone: Icon;
  export const Clock: Icon;
  export const ScrollText: Icon;
  export const ExternalLink: Icon;
  export const Pin: Icon;
  export const Settings: Icon;
  export const Sparkles: Icon;
  export const Layers: Icon;
  export const Play: Icon;
  export const Pause: Icon;
  export const RotateCcw: Icon;
  export const SkipBack: Icon;
  export const SkipForward: Icon;
  export const Video: Icon;
  export const Timer: Icon;
  export const AlertCircle: Icon;
  export const Eye: Icon;
  export const FlipHorizontal: Icon;
  export const Sliders: Icon;
  export const Type: Icon;
  export const FastForward: Icon;
  export const Wand2: Icon;
  export const BookOpen: Icon;
  export const Plus: Icon;
  export const Trash2: Icon;
  export const FileText: Icon;
  export const ArrowRight: Icon;
  export const Check: Icon;
  export const X: Icon;
  export const CheckCircle2: Icon;
  export const AlertTriangle: Icon;
  export const HelpCircle: Icon;
  export const Copy: Icon;
  export const Wifi: Icon;
  export const Film: Icon;
  export const HardDrive: Icon;
  export const FolderOpen: Icon;
}
