'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Author } from '@/types/library';

export default function AuthorsPage() {
  const { isAdmin } = useAuth();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchAuthors() {
    try {
      const { data } = await api.get<Author[]>('/authors');
      setAuthors(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao carregar autores.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuthors();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setNationality('');
    setBirthDate('');
    setError(null);
  }

  function handleEdit(author: Author) {
    setEditingId(author.id);
    setName(author.name);
    setNationality(author.nationality || '');
    setBirthDate(author.birthDate ? author.birthDate.slice(0, 10) : '');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        nationality: nationality || undefined,
        birthDate: birthDate || undefined,
      };

      if (editingId) {
        await api.put(`/authors/${editingId}`, payload);
      } else {
        await api.post('/authors', payload);
      }
      resetForm();
      await fetchAuthors();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao salvar autor.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deseja realmente excluir este autor?')) return;
    setError(null);

    try {
      await api.delete(`/authors/${id}`);
      await fetchAuthors();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Não foi possível excluir o autor.');
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Acesso restrito: apenas administradores podem gerenciar autores.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Autores</h1>
        <p className="text-sm text-slate-500">Cadastre autores para vinculá-los aos livros do acervo.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nome *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Robert C. Martin"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nacionalidade</label>
          <input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Ex: Estadunidense"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nascimento</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Nacionalidade</th>
              <th className="px-4 py-3">Nascimento</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Carregando autores...
                </td>
              </tr>
            ) : authors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nenhum autor cadastrado.
                </td>
              </tr>
            ) : (
              authors.map((author) => (
                <tr key={author.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">#{author.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{author.name}</td>
                  <td className="px-4 py-3 text-slate-600">{author.nationality || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {author.birthDate ? author.birthDate.slice(0, 10) : '—'}
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(author)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(author.id)}
                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



//va