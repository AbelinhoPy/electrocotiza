'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  FileText 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Client } from '@/lib/types';

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Campos formulario
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ruc, setRuc] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Asunción');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setClients(StorageService.getClients());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setName('');
    setBusinessName('');
    setRuc('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setCity('Asunción');
    setAddress('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setBusinessName(c.business_name || '');
    setRuc(c.ruc_or_ci);
    setContactPerson(c.contact_person || '');
    setPhone(c.phone);
    setEmail(c.email);
    setCity(c.city);
    setAddress(c.address);
    setNotes(c.notes || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Ingresa el nombre del cliente.');
      return;
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: name.trim(),
      business_name: businessName.trim() || undefined,
      ruc_or_ci: ruc.trim() || 'Sin RUC',
      contact_person: contactPerson.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || 'Asunción',
      address: address.trim(),
      notes: notes.trim() || undefined,
      is_active: editingClient ? editingClient.is_active : true,
    };

    StorageService.saveClient(clientToSave);
    loadData();
    setShowModal(false);
    alert(editingClient ? 'Cliente actualizado.' : 'Cliente registrado.');
  };

  const handleToggleActive = (id: string) => {
    StorageService.toggleClientActive(id);
    loadData();
  };

  const filteredClients = clients.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.business_name || '').toLowerCase().includes(q) ||
        (c.ruc_or_ci || '').toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <span>Directorio de Clientes y Cuentas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión comercial de clientes de Paraguay • RUC, contactos y vinculación histórica a presupuestos.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, razón social, RUC o contacto..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
          Total: {filteredClients.length} clientes
        </span>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0F2137] text-white font-bold">
              <tr>
                <th className="py-3 px-3">Cliente / Razón Social</th>
                <th className="py-3 px-3 w-32">RUC / C.I.</th>
                <th className="py-3 px-3">Persona de Contacto</th>
                <th className="py-3 px-3 w-36">Teléfono</th>
                <th className="py-3 px-3">Ciudad / Dirección</th>
                <th className="py-3 px-2 w-24 text-center">Estado</th>
                <th className="py-3 px-3 w-28 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    {c.business_name && (
                      <span className="text-[11px] text-slate-400 block">{c.business_name}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {c.ruc_or_ci}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">
                    {c.contact_person || '-'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {c.phone || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="font-semibold text-slate-800 block">{c.city}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-xs">{c.address || '-'}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        title="Editar Cliente"
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c.id)}
                        title={c.is_active ? 'Desactivar Cliente' : 'Activar Cliente'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-700" />
              <span>{editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Nombre Comercial *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Frigorífico Chortitzer"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Razón Social</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ej: Cooperativa Chortitzer Ltda."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">RUC / C.I. *</label>
                <input
                  type="text"
                  value={ruc}
                  onChange={e => setRuc(e.target.value)}
                  placeholder="Ej: 80014522-1"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Persona de Contacto</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Ej: Ing. Pedro Giesbrecht"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ej: +595 981 123456"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contacto@empresa.com.py"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-0.5">Dirección / Ubicación de Obra</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej: Avda. Transchaco Km 14.5, Mariano Roque Alonso"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
