'use client';
//dasboard, funcione


import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { Loan, Reader } from '@/types/library';

export default function ReadersPage() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  //  histórico de nu
  const [historyReader, setHistoryReader] = useState<Reader | null>(null);
  const [historyLoans, setHistoryLoans] = useState<Loan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function fetchReaders() {
    try {
      const { data } = await api.get<Reader[]>('/readers');
      setReaders(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao carregar leitores.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReaders();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setError(null);
  }

  function handleEdit(reader: Reader) {
    setEditingId(reader.id);
    setName(reader.name);
    setCpf(reader.cpf);
    setEmail(reader.email || '');
    setPhone(reader.phone || '');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        cpf,
        email: email || undefined,
        phone: phone || undefined,
      };

      if (editingId) {
        await api.put(`/readers/${editingId}`, payload);
      } else {
        await api.post('/readers', payload);
      }

      resetForm();
      await fetchReaders();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao salvar leitor.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(reader: Reader) {
    setHistoryReader(reader);
    setLoadingHistory(true);
    setHistoryLoans([]);

    try {
      const { data } = await api.get<Loan[]>(`/readers/${reader.id}/loans`);
      setHistoryLoans(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao buscar histórico do leitor.');
      }
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leitores</h1>
        <p className="text-sm text-slate-500">
          Gerencie leitores cadastrados e consulte seu histórico de empréstimos.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:grid-cols-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nome *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">CPF *</label>
          <input
            type="text"
            required
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="leitor@email.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Telefone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(44) 99999-9999"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Carregando leitores...
                </td>
              </tr>
            ) : readers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Nenhum leitor cadastrado.
                </td>
              </tr>
            ) : (
              readers.map((reader) => (
                <tr key={reader.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{reader.name}</td>
                  <td className="px-4 py-3 text-slate-600">{reader.cpf}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{reader.email || '—'}</div>
                    <div className="text-xs text-slate-400">{reader.phone || ''}</div>
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openHistory(reader)}
                      className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Histórico
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(reader)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {historyReader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Histórico — {historyReader.name}
                </h2>
                <p className="text-xs text-slate-500">CPF: {historyReader.cpf}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryReader(null)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>

            {loadingHistory ? (
              <p className="py-6 text-center text-sm text-slate-500">Carregando histórico...</p>
            ) : historyLoans.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Este leitor ainda não possui empréstimos registrados.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Livro</th>
                      <th className="px-3 py-2">Retirada</th>
                      <th className="px-3 py-2">Prevista</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Multa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLoans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {loan.Book?.title || `Livro #${loan.bookId}`}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {new Date(loan.loanDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              loan.status === 'ATRASADO'
                                ? 'bg-red-100 text-red-700'
                                : loan.status === 'ATIVO'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          R$ {Number(loan.fine || 0).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


