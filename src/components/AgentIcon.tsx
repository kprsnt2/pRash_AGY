import React from 'react';
import {
  BookOpen,
  GraduationCap,
  FileCheck,
  BarChart3,
  Stethoscope,
  HeartPulse,
  Compass,
  Sparkles,
  Utensils,
  Scale,
  Mail,
  Wallet,
  Code2,
  Plane,
  Dumbbell,
  ShieldCheck,
  LucideProps,
} from 'lucide-react';

interface AgentIconProps extends LucideProps {
  name: string;
}

export function AgentIcon({ name, ...props }: AgentIconProps) {
  switch (name) {
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'FileCheck':
      return <FileCheck {...props} />;
    case 'BarChart3':
      return <BarChart3 {...props} />;
    case 'Stethoscope':
      return <Stethoscope {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Compass':
      return <Compass {...props} />;
    case 'Utensils':
      return <Utensils {...props} />;
    case 'Scale':
      return <Scale {...props} />;
    case 'Mail':
      return <Mail {...props} />;
    case 'Wallet':
      return <Wallet {...props} />;
    case 'Code2':
      return <Code2 {...props} />;
    case 'Plane':
      return <Plane {...props} />;
    case 'Dumbbell':
      return <Dumbbell {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Sparkles':
    default:
      return <Sparkles {...props} />;
  }
}
