/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Heart, 
  MessageSquare, 
  MessageCircle, 
  Baby, 
  ShieldAlert, 
  EyeOff, 
  Store, 
  Coins, 
  MapPin, 
  Award, 
  Headphones, 
  Users, 
  HandHeart, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  Clock, 
  Home, 
  PiggyBank, 
  Sparkles, 
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle,
  Menu,
  X,
  Compass,
  Check,
  AlertCircle,
  Shuffle,
  RefreshCw,
  UserCheck
} from 'lucide-react';

const iconMap = {
  Heart,
  MessageSquare,
  MessageCircle,
  Baby,
  ShieldAlert,
  EyeOff,
  Store,
  Coins,
  MapPin,
  Award,
  Headphones,
  Users,
  HandHeart,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Clock,
  Home,
  PiggyBank,
  Sparkles,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle,
  Menu,
  X,
  Compass,
  Check,
  AlertCircle,
  Shuffle,
  RefreshCw,
  UserCheck
};

export type IconName = keyof typeof iconMap;

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 24 }: LucideIconProps) {
  const IconComponent = iconMap[name as IconName] || Sparkles;
  return <IconComponent className={className} size={size} />;
}
