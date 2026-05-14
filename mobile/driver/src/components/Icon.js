/**
 * Icon — lucide-react-native маппинг.
 * Использование: <Icon name="search" size={20} color={T.paper2} />
 */
import React from "react";
import {
  Search, MapPin, ArrowRight, ArrowLeft, X, Menu, MoreHorizontal,
  User, MessageCircle, Phone, Star, CreditCard, Banknote, Car,
  Clock, Home, Briefcase, Heart, Shield, Bell, Settings,
  List, LayoutGrid, TrendingUp, Filter, Download, Plus, Check,
  Timer, Locate, Send, Square, CircleDollarSign, Navigation,
  AlertCircle, ChevronRight, ChevronDown, Mic, Paperclip,
  LogOut, Moon, Sun, Info, Zap, MapPinned,
} from "lucide-react-native";

const MAP = {
  search: Search, pin: MapPin, arrow: ArrowRight, back: ArrowLeft,
  close: X, menu: Menu, more: MoreHorizontal, user: User,
  chat: MessageCircle, phone: Phone, star: Star, card: CreditCard,
  cash: Banknote, car: Car, clock: Clock, home: Home,
  briefcase: Briefcase, heart: Heart, shield: Shield, bell: Bell,
  settings: Settings, list: List, grid: LayoutGrid, trend: TrendingUp,
  filter: Filter, download: Download, plus: Plus, check: Check,
  shift: Timer, loc: Locate, send: Send, zone: Square,
  money: CircleDollarSign, nav: Navigation, warn: AlertCircle,
  chevron: ChevronRight, chevronDown: ChevronDown, mic: Mic,
  paperclip: Paperclip, logout: LogOut, moon: Moon, sunIcon: Sun,
  info: Info, zap: Zap, pinned: MapPinned,
};

export function Icon({ name, size = 20, color = "#FBF9F4", strokeWidth = 1.8, style }) {
  const Comp = MAP[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}

export default Icon;
