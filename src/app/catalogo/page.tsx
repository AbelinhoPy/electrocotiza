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
    setNewAliasText('');
    setAliasModalProduct(null);
    loadData();
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const newId = `prod-${Date.now()}`;
    const newProduct: CanonicalProduct = {
      id: newId,
      category_id: newProdCategory || 'cat-cables',
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newProdName.trim(),
      normalized_name: newProdName.trim().toLowerCase(),
      brand: newProdBrand.trim() || 'Nacional',
      unit: newProdUnit,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catálogo Maestro y Comparador de Precios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Unifica los nombres de materiales de distintas ferreterías y consulta dónde conviene comprar.
          </p>
        </div>

        <button
          onClick={() => setShowNewProductModal(true)}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Producto Maestro</span>
        </button>
      </div>

      {/* BUSCADOR DIFUSO Y FILTROS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, calibre, marca, o alias de ferretería (ej. 'cable 2.5', 'barra cobre 20x3', 'disyuntor 20a')..."
            className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm sm:text-base shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* PILLS DE CATEGORÍAS */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas las Categorías ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTADOS / GRILLA DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const isStale = isPriceStale(p.last_price_date, 60);
          const daysOld = daysSince(p.last_price_date);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-2">
                {/* Categoría y Alerta de Antigüedad */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {p.brand} • {p.unit}
                  </span>

                  {isStale ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      <span>{daysOld} días (Viejo)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>Actualizado</span>
                    </span>
                  )}
                </div>

                {/* Nombre Canónico */}
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {p.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {p.base_description}
                </p>

                {/* ALIAS HOMOLOGADOS */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-amber-500" />
                      <span>Nombres en Ferreterías ({p.aliases.length}):</span>
                    </span>
                    <button
                      onClick={() => setAliasModalProduct(p)}
                      className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                    >
                      + Asociar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.aliases.slice(0, 3).map((alias, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60 font-mono"
                      >
                        {alias}
                      </span>
                    ))}
                    {p.aliases.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{p.aliases.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* COMPARATIVA DE PRECIOS Y ACCIONES */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Último Precio ({p.last_provider_name || 'Proveedor'})
                  </span>
                  <div className="text-lg font-black text-slate-900">
                    {formatPYG(p.last_price_pyg)}{' '}
                    <span className="text-xs font-normal text-slate-500">/ {p.unit}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Registrado el {formatDatePY(p.last_price_date)}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setSelectedProductHistory(p)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Ver Historial de Precios y Proveedores"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No encontramos ningún material con esa descripción</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Puedes intentar con menos palabras o crear un nuevo producto canónico para agregarlo al catálogo maestro.
          </p>
          <button
            onClick={() => setShowNewProductModal(true)}
            className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear "{query}"</span>
          </button>
        </div>
      )}

      {/* MODAL HISTORIAL DE PRECIOS Y VARIACIÓN */}
      {selectedProductHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera */}
            <div className="p-5 bg-[#0F2137] text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-semibold tracking-wider uppercase">Historial Comparativo</span>
                <h3 className="font-bold text-base text-white">{selectedProductHistory.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Registros */}
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Precios Registrados por Ferretería / Fuente:
              </div>

              {selectedProductHistory.history && selectedProductHistory.history.length > 0 ? (
                selectedProductHistory.history.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-sm text-slate-900">{h.provider_name}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Fecha: {formatDatePY(h.date)} • {h.source_ref || h.source_type}
                      </p>
                      {h.notes && (
                        <p className="text-[11px] text-slate-400 italic">{h.notes}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        {formatPYG(h.price_pyg)}
                      </div>
                      <span className="text-[10px] text-slate-500">IVA incluido</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay registros de compras previas.</p>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR ALIAS */}
      {aliasModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Homologar Material</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Agregar nuevo nombre para: <br />
                <span className="text-slate-700 font-normal">{aliasModalProduct.name}</span>
              </h3>
            </div>

            <form onSubmit={handleAddAliasSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre o código tal como aparece en la factura / ferretería:
                </label>
                <input
                  type="text"
                  required
                  value={newAliasText}
                  onChange={(e) => setNewAliasText(e.target.value)}
                  placeholder="Ej: CABLE 1X2.5 ROJO CONDEL PY..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Al guardarlo, el sistema reconocerá automáticamente este nombre en futuras facturas.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAliasModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm"
                >
                  Guardar Homologación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRODUCTO CANÓNICO */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Catálogo Maestro</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Crear Nuevo Material Maestro</h3>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Oficial Estandarizado:</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej: Cable Unipolar 6.0 mm² Cobre"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marca de Referencia:</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="Schneider / Condel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad de Medida:</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="un">Unidad (un)</option>
                    <option value="m">Metro (m)</option>
                    <option value="rollo">Rollo</option>
                    <option value="barra">Barra</option>
                    <option value="caja">Caja</option>
                    <option value="gl">Global (gl)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Unitario (PYG):</label>
                  <input
                    type="number"
                    value={newProdInitialPrice || ''}
                    onChange={(e) => setNewProdInitialPrice(parseInt(e.target.value) || 0)}
                    placeholder="Ej: 35000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ferretería Proveedora:</label>
                  <input
                    type="text"
                    value={newProdProvider}
                    onChange={(e) => setNewProdProvider(e.target.value)}
                    placeholder="Luminotecnia / Enerluz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm"
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
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando catálogo...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}
