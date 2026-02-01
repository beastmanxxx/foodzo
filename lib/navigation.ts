export type BottomNavItem = {
  label: string;
  icon: string;
  href?: string;
};

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: "Home", icon: "🏠", href: "/home" },
  { label: "Favorite", icon: "❤️" },
  { label: "Orders", icon: "🛒" },
  { label: "Profile", icon: "👤", href: "/profile" },
];
