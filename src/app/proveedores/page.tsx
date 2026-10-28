'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Phone, MapPin, Globe, FileText, CheckCircle2, X } from 'lucide-react';
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
      default_currency: 'PYG',
      is_active: true,
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
    <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* ENCABEZADO MÓVIL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Proveedores</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ferreterías y distribuidores eléctricos en CDE y Asunción
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nuevo</span>
        </button>
      </div>

      {/* GRILLA DE TARJETAS MÓVILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((p) => (
          <div
            key={p.id}
            className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-sm text-white">{p.name}</h3>
                  {p.fantasy_name && p.fantasy_name !== p.name && (
                    <span className="text-[11px] text-amber-400 font-bold block">{p.fantasy_name}</span>
                  )}
                </div>
                <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-800 font-bold">
                  {p.city}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-500 text-[11px]">RUC:</span>
                  <strong className="text-slate-200 font-mono">{p.ruc}</strong>
                </div>

                {p.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300">{p.phone}</span>
                  </div>
                )}

                {p.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{p.address}</span>
                  </div>
                )}

                {p.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline truncate"
                    >
                      {p.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Habilitado para Compras</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO PROVEEDOR */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1E33] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Red de Proveedores</span>
                <h3 className="text-sm font-black text-white mt-0.5">Registrar Proveedor</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Razón Social:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ferretería El Rayo S.A."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">RUC:</label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="80012345-6"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Ciudad:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad del Este"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+595 61 570000"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Avda. San Blas Km 2"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
