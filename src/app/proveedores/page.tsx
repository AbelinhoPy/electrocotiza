'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Phone, MapPin, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { Provider } from '@/lib/types';

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [ruc, setRuc] = useState('');
  const [city, setCity] = useState('Ciudad del Este');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const loadProviders = () => {
    setProviders(StorageService.getProviders());
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProv: Provider = {
      id: `prov-${Date.now()}`,
      name: name.trim(),
      fantasy_name: fantasyName.trim() || name.trim(),
      ruc: ruc.trim() || 'S/D',
      city,
      address: address.trim(),
      phone: phone.trim(),
      website: website.trim(),
      notes: notes.trim(),
    };

    StorageService.addProvider(newProv);
    setShowModal(false);
    setName('');
    setFantasyName('');
    setRuc('');
    setPhone('');
    setAddress('');
    setNotes('');
    loadProviders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Proveedores y Ferreterías
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Red de proveedores locales en Asunción, Gran Asunción y Ciudad del Este.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* GRILLA DE PROVEEDORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                  {p.fantasy_name && p.fantasy_name !== p.name && (
                    <span className="text-xs text-amber-600 font-semibold block">{p.fantasy_name}</span>
                  )}
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                  {p.city}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-400">RUC:</span>
                  <strong className="text-slate-800">{p.ruc}</strong>
                </div>

                {p.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.phone}</span>
                  </div>
                )}

                {p.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.address}</span>
                  </div>
                )}

                {p.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {p.website}
                    </a>
                  </div>
                )}
              </div>

              {p.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                  {p.notes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Proveedor Habilitado</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO PROVEEDOR */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Ferretería</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Registrar Nuevo Proveedor</h3>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Razón Social:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ferretería El Rayo S.A."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RUC:</label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="80012345-6"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad:</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Ciudad del Este">Ciudad del Este</option>
                    <option value="Asunción">Asunción</option>
                    <option value="Minga Guazú">Minga Guazú</option>
                    <option value="Hernandarias">Hernandarias</option>
                    <option value="San Lorenzo">San Lorenzo</option>
                    <option value="Encarnación">Encarnación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="061 555-123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sitio Web / Catálogo:</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Avda. San Blas km 3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
