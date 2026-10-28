'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Tag, 
  History, 
  Plus, 
  Check, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  PlusCircle,
  X,
  Sparkles
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, Category, PriceRecord } from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale, daysSince } from '@/lib/utils';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProductHistory, setSelectedProductHistory] = useState<CanonicalProduct | null>(null);

  // Modal para agregar alias nuevo
  const [aliasModalProduct, setAliasModalProduct] = useState<CanonicalProduct | null>(null);
  const [newAliasText, setNewAliasText] = useState('');

  // Modal para nuevo producto canónico
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('un');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdInitialPrice, setNewProdInitialPrice] = useState<number>(0);
  const [newProdProvider, setNewProdProvider] = useState('');

  const loadData = () => {
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado difuso y por categoría
  const filteredProducts = useMemo(() => {
    let result = products;

    if (query.trim()) {
      const searchResults = StorageService.searchProducts(query.trim(), 50);
      result = searchResults.map(r => r.product);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category_id === selectedCategory);
    }

    return result;
  }, [products, query, selectedCategory]);

  const handleAddAliasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasModalProduct || !newAliasText.trim()) return;

    StorageService.addAliasToProduct(aliasModalProduct.id, newAliasText.trim());
    setAliasModalProduct(null);
    setNewAliasText('');
    loadData();
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newId = `prod-${Date.now()}`;
    const skuCode = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProduct: CanonicalProduct = {
      id: newId,
      internal_code: skuCode,
      category_id: newProdCategory || 'cat-cables',
      sku: skuCode,
      name: newProdName.trim(),
      normalized_name: newProdName.trim().toLowerCase(),
      brand: newProdBrand.trim() || 'Nacional',
      unit: newProdUnit,
      is_active: true,
      base_description: `Producto registrado en obra: ${newProdName}`,
      min_price_pyg: newProdInitialPrice || 0,
      max_price_pyg: newProdInitialPrice || 0,
      last_price_pyg: newProdInitialPrice || 0,
      last_price_date: '2026-10-16',
      last_provider_name: newProdProvider || 'Proveedor local',
      aliases: [newProdName.trim()],
      history: newProdInitialPrice ? [
        {
          id: `h-${Date.now()}`,
          canonical_product_id: newId,
          provider_id: 'prov-manual',
          provider_name: newProdProvider || 'Carga manual',
          price_pyg: newProdInitialPrice,
          currency: 'PYG',
          includes_iva: true,
          iva_rate_pct: 10,
          date: '2026-10-16',
          source_type: 'manual',
          notes: 'Precio inicial al crear producto',
        }
      ] : [],
    };

    StorageService.createProduct(newProduct);
    setShowNewProductModal(false);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdInitialPrice(0);
    loadData();
  };

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* ENCABEZADO MÓVIL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Search className="w-5 h-5 text-amber-400" />
            <span>Precios y Materiales</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Catálogo unificado de ferreterías de CDE y Asunción
          </p>
        </div>

        <button
          onClick={() => setShowNewProductModal(true)}
          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Crear</span>
        </button>
      </div>

      {/* BUSCADOR DIFUSO Y FILTROS */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por calibre, marca, o nombre de ticket..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 text-white rounded-2xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs sm:text-sm placeholder-slate-500 shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* PILLS DE CATEGORÍAS */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-[#0F1E33] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#0F1E33] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLA DE TARJETAS MÓVILES DE MATERIALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((p) => {
          const isStale = isPriceStale(p.last_price_date, 60);
          const daysOld = daysSince(p.last_price_date);

          return (
            <div
              key={p.id}
              className="bg-[#0F1E33] rounded-3xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                {/* Categoría y Alerta de Antigüedad */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                    {p.brand} • {p.unit}
                  </span>

                  {isStale ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      <span>{daysOld}d (Viejo)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>Actual</span>
                    </span>
                  )}
                </div>

                {/* Nombre Canónico */}
                <h3 className="font-black text-white text-sm leading-snug">
                  {p.name}
                </h3>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {p.base_description}
                </p>

                {/* ALIAS HOMOLOGADOS */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      <span>Nombres en Ferreterías ({p.aliases.length}):</span>
                    </span>
                    <button
                      onClick={() => setAliasModalProduct(p)}
                      className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                    >
                      + Vincular
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.aliases.slice(0, 2).map((alias, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800 font-mono truncate max-w-[200px]"
                      >
                        {alias}
                      </span>
                    ))}
                    {p.aliases.length > 2 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{p.aliases.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PRECIO Y ACCIONES */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {p.last_provider_name || 'Proveedor local'}
                  </span>
                  <div className="text-base font-black text-amber-400">
                    {formatPYG(p.last_price_pyg)}{' '}
                    <span className="text-[11px] font-normal text-slate-400">/ {p.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProductHistory(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 border border-slate-700 active:scale-95 transition-all"
                  title="Ver comparativa de ferreterías"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Precios</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL HISTORIAL DE PRECIOS */}
      {selectedProductHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1E33] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-[#0A1526] text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase">Historial de Compras en CDE</span>
                <h3 className="font-bold text-sm sm:text-base text-white">{selectedProductHistory.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5">
              {selectedProductHistory.history && selectedProductHistory.history.length > 0 ? (
                selectedProductHistory.history.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-xs text-white">{h.provider_name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {formatDatePY(h.date)} • {h.notes || h.source_type}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-amber-400">
                        {formatPYG(h.price_pyg)}
                      </div>
                      <span className="text-[9px] text-slate-500">IVA incluido</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No hay compras previas registradas.</p>
              )}
            </div>

            <div className="p-3 bg-[#0A1526] border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="px-4 py-2 bg-amber-400 text-slate-950 font-black rounded-xl text-xs active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR ALIAS */}
      {aliasModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1E33] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-700 space-y-4">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Homologar Material</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Vincular nombre para: <br />
                <span className="text-amber-300 font-extrabold">{aliasModalProduct.name}</span>
              </h3>
            </div>

            <form onSubmit={handleAddAliasSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nombre en la factura o ticket:
                </label>
                <input
                  type="text"
                  required
                  value={newAliasText}
                  onChange={(e) => setNewAliasText(e.target.value)}
                  placeholder="Ej: CABLE 1X2.5 ROJO CONDEL PY..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAliasModalProduct(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO CANÓNICO */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1E33] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-700 space-y-3.5">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Catálogo Maestro</span>
              <h3 className="text-sm font-black text-white mt-0.5">Crear Nuevo Material Maestro</h3>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre Oficial Estandarizado:</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej: Cable Unipolar 6.0 mm² Cobre"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Marca / Procedencia:</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="Condel / Nexans"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Unidad de Medida:</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="un">un (unidad)</option>
                    <option value="m">m (metro)</option>
                    <option value="rollo">rollo</option>
                    <option value="barra">barra</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Precio Unitario Inicial (₲ con IVA):</label>
                <input
                  type="number"
                  value={newProdInitialPrice || ''}
                  onChange={(e) => setNewProdInitialPrice(Number(e.target.value))}
                  placeholder="3500"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Ferretería / Proveedor:</label>
                <input
                  type="text"
                  value={newProdProvider}
                  onChange={(e) => setNewProdProvider(e.target.value)}
                  placeholder="Enerluz / Fixopar"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95"
                >
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">
        Cargando catálogo maestro...
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
