'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/library';

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

 
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchUsers() {
    try {
      const { data } = await api.get<User[]>('/user');
      setUsers(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao carregar usuários.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setNewIsAdmin(false);
  }

  function handleEdit(targetUser: User) {
    setEditingId(targetUser.id);
    setName(targetUser.name);
    setUsername(targetUser.username);
    setEmail(targetUser.email);
    setPassword('');
    setNewIsAdmin(Boolean(targetUser.isAdmin));
    setError(null);
    setSuccessMsg(null);
  }

  async function handleSubmitUser(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingId) {
        const payload: {
          name: string;
          username: string;
          email: string;
          isAdmin: boolean;
          password?: string;
        } = {
          name,
          username,
          email,
          isAdmin: newIsAdmin,
        };

        if (password.trim()) {
          payload.password = password;
        }

        await api.put(`/user/${editingId}`, payload);
        setSuccessMsg('Usuário atualizado com sucesso!');
      } else {
        await api.post('/user', {
          name,
          username,
          email,
          password,
          isAdmin: newIsAdmin,
        });
        setSuccessMsg('Usuário cadastrado com sucesso!');
      }

      resetForm();
      await fetchUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            (editingId ? 'Erro ao atualizar usuário.' : 'Erro ao cadastrar usuário.')
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(targetUser: User) {
    const actionLabel = targetUser.active ? 'desativar' : 'ativar';
    if (!confirm(`Deseja realmente ${actionLabel} o acesso de ${targetUser.name}?`)) return;

    setError(null);
    setSuccessMsg(null);

    try {
      await api.patch(`/user/${targetUser.id}/active`, {
        active: !targetUser.active,
      });
      setSuccessMsg(
        `Usuário ${targetUser.name} ${!targetUser.active ? 'ativado' : 'desativado'} com sucesso.`
      );
      await fetchUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Erro ao alterar status do usuário.');
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Acesso restrito: apenas administradores podem gerenciar atendentes e permissões.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Atendentes e Usuários</h1>
        <p className="text-sm text-slate-500">
          Cadastre, edite e controle o status de acesso de administradores e atendentes.
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

      <form
        onSubmit={handleSubmitUser}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs md:grid-cols-6"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Nome *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana Atendente"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Usuário *</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ana.atendente"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">E-mail *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@biblioteca.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            {editingId ? 'Nova Senha (opcional)' : 'Senha *'}
          </label>
          <input
            type="password"
            required={!editingId}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={editingId ? 'Manter senha atual' : 'Mín. 6 caracteres'}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
            />
            Perfil Admin
          </label>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
              <th className="px-4 py-3">Nome / Usuário</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Carregando usuários...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.isAdmin
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.isAdmin ? 'Administrador' : 'Atendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      {isSelf ? (
                        <span className="text-xs text-slate-400">Sessão atual</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                            u.active
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? 'Desativar' : 'Ativar'}
                        </button>
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



