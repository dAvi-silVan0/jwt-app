'use client';
//L

import { FormEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { Book, Loan, Reader } from '@/types/library';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  const [statusFilter, setStatusFilter] = useState<string>('');

  const [readerId, setReaderId] = useState('');
  const [bookId, setBookId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get<Loan[]>('/loans', { params });
      setLoans(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao carregar empréstimos.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCatalogs = useCallback(async () => {
    try {
      const [booksRes, readersRes] = await Promise.all([
        api.get<Book[]>('/books', { params: { available: 'true' } }),
        api.get<Reader[]>('/readers'),
      ]);
      setBooks(booksRes.data);
      setReaders(readersRes.data);
    } catch {
      // vazio
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  async function handleCreateLoan(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.post('/loans', {
        bookId: Number(bookId),
        readerId: Number(readerId),
      });

      setReaderId('');
      setBookId('');
      setSuccessMsg('Empréstimo registrado com sucesso!');

      await Promise.all([fetchLoans(), fetchCatalogs()]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Não foi possível registrar o empréstimo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturnLoan(loan: Loan) {
    if (!confirm(`Confirmar devolução do livro "${loan.Book?.title || `#${loan.bookId}`}"?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const { data } = await api.patch<Loan>(`/loans/${loan.id}/return`);
      const fineValue = Number(data.fine || 0);

      if (fineValue > 0) {
        setSuccessMsg(
          `Devolução registrada com atraso. Multa calculada: R$ ${fineValue.toFixed(2).replace('.', ',')}.`
        );
      } else {
        setSuccessMsg('Devolução registrada dentro do prazo (sem multa).');
      }

      await Promise.all([fetchLoans(), fetchCatalogs()]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao registrar devolução.');
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Empréstimos e Devoluções</h1>
        <p className="text-sm text-slate-500">
          Registre retiradas de exemplares, acompanhe prazos e realize baixas de devolução.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMsg}
        </div>
      )}

      {}
      <form
        onSubmit={handleCreateLoan}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Leitor *</label>
            <select
              required
              value={readerId}
              onChange={(e) => setReaderId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="">Selecione o leitor...</option>
              {readers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.cpf})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Livro Disponível *
            </label>
            <select
              required
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="">Selecione o livro...</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.availableCopies} disp.)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Registrando...' : 'Registrar Empréstimo'}
            </button>
          </div>
        </div>

        <p className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-800">
          <strong>Regra de empréstimo:</strong> O prazo padrão de devolução é fixo em{' '}
          <strong>7 dias</strong> a partir da retirada. Após o vencimento, incide multa de{' '}
          <strong>R$ 1,00 por dia de atraso</strong>.
        </p>
      </form>

      {}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'Todos', value: '' },
          { label: 'Ativos', value: 'ATIVO' },
          { label: 'Atrasados', value: 'ATRASADO' },
          { label: 'Devolvidos', value: 'DEVOLVIDO' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Livro</th>
              <th className="px-4 py-3">Leitor</th>
              <th className="px-4 py-3">Retirada</th>
              <th className="px-4 py-3">Prevista</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Multa</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Carregando empréstimos...
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum empréstimo encontrado.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const isOverdue = loan.status === 'ATRASADO';
                const canReturn = loan.status === 'ATIVO' || loan.status === 'ATRASADO';

                return (
                  <tr
                    key={loan.id}
                    className={isOverdue ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-slate-50'}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {loan.Book?.title || `Livro #${loan.bookId}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{loan.Reader?.name || `Leitor #${loan.readerId}`}</div>
                      <div className="text-xs text-slate-400">{loan.Reader?.cpf || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(loan.loanDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isOverdue
                            ? 'bg-red-100 text-red-700'
                            : loan.status === 'ATIVO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      R$ {Number(loan.fine || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canReturn ? (
                        <button
                          type="button"
                          onClick={() => handleReturnLoan(loan)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Registrar Devolução
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Devolvido em{' '}
                          {loan.returnDate
                            ? new Date(loan.returnDate).toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


