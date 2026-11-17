import { Banknote, Landmark, PiggyBank, Smartphone, Wallet } from 'lucide-react';

const ICONS = {
  bank: Landmark,
  mobile_money: Smartphone,
  cash: Banknote,
  savings: PiggyBank,
  other: Wallet,
};

export default function AccountIcon({ type, className = 'h-4 w-4' }) {
  const Icon = ICONS[type] ?? Wallet;
  return <Icon className={className} aria-hidden="true" />;
}
