import { ClipboardCheck, LayoutDashboard } from 'lucide-react';

export const NAV_ICONS = {
  examenes: ClipboardCheck,
};

export const NavIcon = ({ name, ...props }) => {
  const Icon = NAV_ICONS[name] || LayoutDashboard;
  return <Icon {...props} />;
};
