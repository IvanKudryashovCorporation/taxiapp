// Icon — lucide-react маппинг. Те же имена, что были в кастомном SVG.
// Использование: <Icon name="search" size={20} className="text-ink" />
import * as React from "react";
import {
  Search, MapPin, ArrowRight, ArrowLeft, X, Menu, MoreHorizontal,
  User, MessageCircle, Phone, Star, CreditCard, Banknote, Car,
  Clock, Home, Briefcase, Heart, Shield, Bell, Settings,
  List, LayoutGrid, TrendingUp, Filter, Download, Plus, Check,
  Timer, Locate, Send, Square, CircleDollarSign, Navigation,
  AlertCircle, ChevronRight, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  search: Search, pin: MapPin, arrow: ArrowRight, back: ArrowLeft,
  close: X, menu: Menu, more: MoreHorizontal, user: User,
  chat: MessageCircle, phone: Phone, star: Star, card: CreditCard,
  cash: Banknote, car: Car, clock: Clock, home: Home,
  briefcase: Briefcase, heart: Heart, shield: Shield, bell: Bell,
  settings: Settings, list: List, grid: LayoutGrid, trend: TrendingUp,
  filter: Filter, download: Download, plus: Plus, check: Check,
  shift: Timer, loc: Locate, send: Send, zone: Square,
  money: CircleDollarSign, nav: Navigation, warn: AlertCircle,
  chevron: ChevronRight, chevronDown: ChevronDown,
};

export type IconName = keyof typeof MAP;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 20, strokeWidth = 1.5, className, style }: IconProps) {
  const Comp = MAP[name];
  if (!Comp) return null;
  return <Comp size={size} strokeWidth={strokeWidth} className={className} style={{ flexShrink: 0, ...style }} aria-hidden />;
}

export default Icon;
