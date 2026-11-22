'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Empréstimos', href: '/loans' },
  { label: 'Livros', href: '/books' },
  { label: 'Leitores', href: '/readers' },
  { label: 'Categorias', href: '/categories', adminOnly: true },
  { label: 'Autores', href: '/authors', adminOnly: true },
  { label: 'Atendentes', href: '/users', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex w-64 flex-col justify-between border-r border-slate-200 bg-slate-900 text-slate-100">
      <div>
        <div className="border-b border-slate-800 px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-white">Biblioteca Digital</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {isAdmin ? 'Perfil: Administrador' : 'Perfil: Atendente'}
          </p>
        </div>

        <nav className="space-y-1 p-4">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-semibold text-white">{user?.name || 'Usuário'}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-red-600 hover:border-red-600 hover:text-white"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}



