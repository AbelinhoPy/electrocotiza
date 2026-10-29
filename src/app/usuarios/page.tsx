'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Key, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppUser } from '@/lib/auth/user-store';

export default function UsuariosPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'secretaria'>('secretaria');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // New password state
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          password: formPassword,
          phone: formPhone.trim(),
          status: 'active',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Usuario "${data.user.full_name}" creado exitosamente.`);
        setIsAddModalOpen(false);
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormPassword('');
        setFormRole('secretaria');
        fetchUsers();
      } else {
        alert(data.error || 'Error al crear usuario.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          full_name: editingUser.full_name,
          role: editingUser.role,
          status: editingUser.status,
          phone: editingUser.phone,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('Usuario actualizado correctamente.');
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(data.error || 'Error al actualizar usuario.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';
    if (!confirm(`¿Estás seguro de que deseas ${actionText} a ${user.full_name}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}.`);
        fetchUsers();
      } else {
        alert(data.error || 'No se pudo cambiar el estado.');
      }
    } catch {
      alert('Error de conexión.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resettingUser.id,
          new_password: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Contraseña actualizada para ${resettingUser.full_name}.`);
        setResettingUser(null);
        setNewPassword('');
      } else {
        alert(data.error || 'Error al cambiar la contraseña.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Acceso Restringido</h2>
          <p className="text-sm text-slate-500">
            Este módulo es de uso exclusivo para Administradores de Construlogica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Administración de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los accesos del personal administrativo (Secretaria) y técnico de Construlogica S.A.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* NOTIFICACIÓN ÉXITO */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TABLA DE USUARIOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Nombre Completo</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Último Acceso</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentUser?.email?.toLowerCase() === u.email.toLowerCase();
                  const isAdminRole = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdminRole
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isAdminRole ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          <span>{isAdminRole ? 'Administrador' : 'Secretaria'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString('es-PY', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            title="Editar datos"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setNewPassword('');
                            }}
                            title="Cambiar contraseña"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'active' ? 'Desactivar usuario' : 'Activar usuario'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.status === 'active'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: AGREGAR USUARIO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Nuevo Usuario
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. María González"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="maria@construlogica.com.py"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rol *</label>
                  <select
                    value={formRole}
                    onChange={(e: any) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="secretaria">Secretaria</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    placeholder="+595 981 ..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Inicial de Activación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Secr2026!#"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <p className="font-bold">Procedimiento de activación seguro:</p>
                  <p>Al no tener servicio de correo saliente configurado, entrega esta contraseña directamente a la nueva colaboradora para su primer acceso.</p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUARIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Editar Usuario
            </h3>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rol</label>
                  <select
                    value={editingUser.role}
                    onChange={(e: any) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="secretaria">Secretaria</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingUser.status}
                    onChange={(e: any) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTABLECER CONTRASEÑA */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Cambiar Contraseña
            </h3>
            <p className="text-xs text-slate-500">
              Establecer una nueva clave de acceso para <strong>{resettingUser.full_name}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  placeholder="Escribe la nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-sm transition-colors"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
