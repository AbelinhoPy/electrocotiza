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
  Package,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { CanonicalProduct, Category, PriceRecord } from '@/lib/types';
import { formatPYG, formatDatePY, isPriceStale, daysSince } from '@/lib/utils';
import { PricingEngine } from '@/lib/pricing-engine';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProductHistory, setSelectedProductHistory] = useState<CanonicalProduct | null>(null);

  // Modal para agregar nombre alternativo / alias
  const [aliasModalProduct, setAliasModalProduct] = useState<CanonicalProduct | null>(null);
  const [newAliasText, setNewAliasText] = useState('');

  // Modal para agregar producto
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('un');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdInitialPrice, setNewProdInitialPrice] = useState<number>(0);
  const [newProdProvider, setNewProdProvider] = useState('');
  const [newProdMargin, setNewProdMargin] = useState<number>(30);
  const [newProdIncludesIva, setNewProdIncludesIva] = useState<boolean>(true);

  const loadData = () => {
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado por texto y categoría
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
    if (!newProdName.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }

    const newId = `prod-${Date.now()}`;
    const skuCode = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const cost = Number(newProdInitialPrice) || 0;
    const normalizedCost = PricingEngine.normalizePurchaseCost(cost, newProdIncludesIva, 10);
    const today = new Date().toISOString().split('T')[0];

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
      base_description: `Material eléctrico: ${newProdName}`,
      min_price_pyg: normalizedCost,
      max_price_pyg: normalizedCost,
      last_price_pyg: normalizedCost,
      last_price_date: today,
      last_provider_name: newProdProvider.trim() || 'Proveedor local',
      aliases: [newProdName.trim()],
      history: cost ? [
        {
          id: `h-${Date.now()}`,
          canonical_product_id: newId,
          provider_id: 'prov-manual',
          provider_name: newProdProvider.trim() || 'Carga manual',
          price_pyg: normalizedCost,
          currency: 'PYG',
          includes_iva: newProdIncludesIva,
          iva_rate_pct: 10,
          date: today,
          source_type: 'manual',
          notes: 'Precio inicial al registrar producto',
        }
      ] : [],
    };

    StorageService.createProduct(newProduct);
    setShowNewProductModal(false);
    setNewProdName('');
    setNewProdBrand('');
    setNewProdInitialPrice(0);
    setNewProdProvider('');
    loadData();
    alert(`Producto "${newProduct.name}" registrado correctamente.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-900" />
            <span>Productos y Precios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catálogo de materiales eléctricos y servicios con precios de proveedores en Paraguay
          </p>
        </div>

        <button
          onClick={() => setShowNewProductModal(true)}
          className="inline-flex items-center space-x-1.5 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Agregar producto</span>
        </button>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, código, marca (ej: cable 4mm, disyuntor, caño corrugado, cinta aisladora)..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* PILLS DE CATEGORÍAS */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA COMPACTA ADMINISTRATIVA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">No encontramos productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta con otra búsqueda o agrega un nuevo producto al catálogo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0F2137] text-white font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-28">Código</th>
                  <th className="py-2.5 px-3">Producto / Material</th>
                  <th className="py-2.5 px-3 w-24">Marca</th>
                  <th className="py-2.5 px-2 w-16 text-center">Unidad</th>
                  <th className="py-2.5 px-3">Proveedor referencia</th>
                  <th className="py-2.5 px-3 w-28 text-right">Precio compra</th>
                  <th className="py-2.5 px-3 w-28 text-right">Venta sugerida</th>
                  <th className="py-2.5 px-3 w-28 text-center">Cotización</th>
                  <th className="py-2.5 px-3 w-28 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isStale = isPriceStale(p.last_price_date, 60);
                  const daysOld = daysSince(p.last_price_date);
                  const suggestedSaleNet = PricingEngine.calculateSalePriceFromMargin(p.last_price_pyg || 0, 30);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      {/* Código */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                        {p.internal_code || p.sku}
                      </td>

                      {/* Producto */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        {p.aliases && p.aliases.length > 1 && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            Alias: {p.aliases.join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Marca */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {p.brand || 'Nacional'}
                      </td>

                      {/* Unidad */}
                      <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                        {p.unit}
                      </td>

                      {/* Proveedor */}
                      <td className="py-2.5 px-3 text-slate-700">
                        {p.last_provider_name || 'Proveedor local'}
                      </td>

                      {/* Precio de compra */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatPYG(p.last_price_pyg)}
                      </td>

                      {/* Precio de venta neto sugerido (30%) */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                        {formatPYG(suggestedSaleNet)}
                      </td>

                      {/* Antigüedad de precio */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isStale 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isStale ? `${daysOld}d (Revisar)` : 'Vigente'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProductHistory(p)}
                            title="Ver historial de precios"
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAliasModalProduct(p)}
                            title="Agregar nombre alternativo"
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded"
                          >
                            <Tag className="w-3.5 h-3.5" />
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

      {/* MODAL: REGISTRAR PRODUCTO */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Agregar nuevo producto</h3>
                <p className="text-xs text-slate-500">Registra un material con su precio de compra y margen de venta</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Nombre del producto *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="Ej: Llave termomagnética bipolar 25A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Marca</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={e => setNewProdBrand(e.target.value)}
                    placeholder="Ej: ABB, Schneider, Tigre..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Unidad de medida</label>
                  <select
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="un">Unidad (un)</option>
                    <option value="m">Metros (m)</option>
                    <option value="rollo">Rollo</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="juego">Juego</option>
                    <option value="gl">Global</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Precio de compra (Gs.)</label>
                  <input
                    type="number"
                    value={newProdInitialPrice}
                    onChange={e => setNewProdInitialPrice(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Margen venta sugerido (%)</label>
                  <input
                    type="number"
                    value={newProdMargin}
                    onChange={e => setNewProdMargin(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Proveedor habitual</label>
                  <input
                    type="text"
                    value={newProdProvider}
                    onChange={e => setNewProdProvider(e.target.value)}
                    placeholder="Ej: Record Electric, Enerluz..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tratamiento del IVA</label>
                  <select
                    value={newProdIncludesIva ? 'included' : 'net'}
                    onChange={e => setNewProdIncludesIva(e.target.value === 'included')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="included">Precio de compra incluye IVA 10%</option>
                    <option value="net">Precio de compra es Neto (sin IVA)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Guardar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE PRECIOS */}
      {selectedProductHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Historial de cotizaciones</h3>
                <p className="text-xs text-slate-500">{selectedProductHistory.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {(!selectedProductHistory.history || selectedProductHistory.history.length === 0) ? (
                <div className="bg-slate-50 p-6 text-center text-xs text-slate-500 rounded-xl">
                  No hay cotizaciones previas registradas para este producto.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {selectedProductHistory.history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{h.provider_name}</span>
                        <span className="text-[10px] text-slate-500">{formatDatePY(h.date)} • {h.notes || 'Cotización'}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatPYG(h.price_pyg)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductHistory(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR NOMBRE ALTERNATIVO (ALIAS) */}
      {aliasModalProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Nombres alternativos del producto</h3>
                <p className="text-xs text-slate-500">{aliasModalProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAliasModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Nombres reconocidos actualmente:</span>
              <div className="flex flex-wrap gap-1.5">
                {aliasModalProduct.aliases.map((al, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                    {al}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddAliasSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Agregar otro nombre o descripción de factura:</label>
                <input
                  type="text"
                  required
                  value={newAliasText}
                  onChange={e => setNewAliasText(e.target.value)}
                  placeholder="Ej: Termomagnetica 2x25A"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAliasModalProduct(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Guardar nombre
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
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500 font-semibold">
        Cargando catálogo de productos y precios...
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
