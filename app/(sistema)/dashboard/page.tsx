'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardStats } from '@/types/library';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    async function loadDashboard() {
      try {
        const { data } = await api.get<DashboardStats>('/reports/dashboard');
        setStats(data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || 'Não foi possível carregar os indicadores.');
        } else {
          setError('Erro inesperado ao carregar o painel.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {user?.name}
        </h1>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? 'Visão geral do acervo, circulação de exemplares e multas da biblioteca.'
            : 'Painel operacional de atendimento, empréstimos e consulta de acervo.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdmin && (
        <>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Títulos</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalBooks}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Exemplares Totais</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCopies}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Exemplares Disponíveis</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.availableCopies}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Empréstimos Ativos</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.activeLoans}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Empréstimos Atrasados</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.overdueLoans}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-medium uppercase text-slate-400">Total de Multas</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  R$ {Number(stats.totalFines || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Acesso Rápido</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/loans"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/40"
          >
            <p className="font-semibold text-slate-900">Empréstimos e Devoluções</p>
            <p className="mt-1 text-xs text-slate-500">Registrar retiradas e baixar devoluções</p>
          </Link>

          <Link
            href="/books"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/40"
          >
            <p className="font-semibold text-slate-900">Consultar Acervo</p>
            <p className="mt-1 text-xs text-slate-500">Filtrar livros por título, categoria ou autor</p>
          </Link>

          <Link
            href="/readers"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/40"
          >
            <p className="font-semibold text-slate-900">Leitores</p>
            <p className="mt-1 text-xs text-slate-500">Cadastrar leitores e consultar histórico</p>
          </Link>
        </div>
      </div>
    </div>
  );
}







