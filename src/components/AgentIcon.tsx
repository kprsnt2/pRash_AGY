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
  Bot,
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
    case 'Sparkles':
    default:
      return <Sparkles {...props} />;
  }
}
