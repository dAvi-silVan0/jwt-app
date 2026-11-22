'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Author, Book, Category } from '@/types/library';

export default function BooksPage() {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de consulta
  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterAuthorId, setFilterAuthorId] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  // Formulário de cadastro / edição (Admin)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [year, setYear] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterTitle.trim()) params.title = filterTitle.trim();
      if (filterCategoryId) params.categoryId = filterCategoryId;
      if (filterAuthorId) params.authorId = filterAuthorId;
      if (filterAvailable) params.available = 'true';

      const { data } = await api.get<Book[]>('/books', { params });
      setBooks(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao buscar livros.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterTitle, filterCategoryId, filterAuthorId, filterAvailable]);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [catRes, autRes] = await Promise.all([
          api.get<Category[]>('/categories'),
          api.get<Author[]>('/authors'),
        ]);
        setCategories(catRes.data);
        setAuthors(autRes.data);
      } catch {
        // Falha silenciosa se algum catálogo estiver vazio
      }
    }
    loadAuxData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setIsbn('');
    setYear('');
    setTotalCopies('1');
    setCategoryId('');
    setSelectedAuthorIds([]);
    setError(null);
  }

  function handleEdit(book: Book) {
    setEditingId(book.id);
    setTitle(book.title);
    setIsbn(book.isbn);
    setYear(book.year ? String(book.year) : '');
    setTotalCopies(String(book.totalCopies));
    setCategoryId(String(book.categoryId));
    setSelectedAuthorIds(book.Authors ? book.Authors.map((a) => a.id) : []);
    setShowForm(true);
    setError(null);
  }

  function toggleAuthor(id: number) {
    setSelectedAuthorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        isbn,
        year: year ? Number(year) : undefined,
        totalCopies: Number(totalCopies),
        categoryId: Number(categoryId),
        authorIds: selectedAuthorIds,
      };

      if (editingId) {
        await api.put(`/books/${editingId}`, payload);
      } else {
        await api.post('/books', payload);
      }

      resetForm();
      await fetchBooks();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao salvar livro.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deseja realmente excluir este livro do acervo?')) return;
    setError(null);

    try {
      await api.delete(`/books/${id}`);
      await fetchBooks();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Não foi possível excluir o livro.');
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Acervo de Livros</h1>
          <p className="text-sm text-slate-500">
            Consulte disponibilidade e filtre por título, categoria ou autor.
          </p>
        </div>

        {isAdmin && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Novo Livro
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulário de Cadastro / Edição (Admin) */}
      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-blue-200 bg-white p-6 shadow-xs"
        >
          <h2 className="text-base font-semibold text-slate-800">
            {editingId ? `Editando Livro #${editingId}` : 'Cadastrar Novo Livro'}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Título *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Código Limpo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">ISBN *</label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-8576082675"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2009"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Categoria *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Total de Exemplares *
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalCopies}
                onChange={(e) => setTotalCopies(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Autores Vinculados (selecione um ou mais)
              </label>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-300 p-2.5">
                {authors.length === 0 ? (
                  <span className="text-xs text-slate-400">Nenhum autor cadastrado.</span>
                ) : (
                  authors.map((author) => {
                    const checked = selectedAuthorIds.includes(author.id);
                    return (
                      <label
                        key={author.id}
                        className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                          checked
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAuthor(author.id)}
                          className="mr-1.5"
                        />
                        {author.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Livro'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-4">
        <input
          type="text"
          value={filterTitle}
          onChange={(e) => setFilterTitle(e.target.value)}
          placeholder="Buscar por título..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />

        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={filterAuthorId}
          onChange={(e) => setFilterAuthorId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">Todos os autores</option>
          {authors.map((aut) => (
            <option key={aut.id} value={aut.id}>
              {aut.name}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.checked)}
          />
          Apenas disponíveis
        </label>
      </div>

      {/* Tabela do Acervo */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título / ISBN</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Autores</th>
              <th className="px-4 py-3">Disponibilidade</th>
              {isAdmin && <th className="px-4 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                  Carregando acervo...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                  Nenhum livro encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <p className="text-xs text-slate-500">
                      ISBN: {book.isbn} {book.year ? `• ${book.year}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {book.Category?.name || `#${book.categoryId}`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {book.Authors && book.Authors.length > 0
                      ? book.Authors.map((a) => a.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        book.availableCopies > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {book.availableCopies} / {book.totalCopies} disp.
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="space-x-2 px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(book)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(book.id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

//negócio gigante
//título

//professor, passa mais isso n, faz mal pra corrigir