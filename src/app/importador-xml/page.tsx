'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileCode, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Search, 
  Plus, 
  Check, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { XmlInvoiceImporter, ParsedXmlInvoice } from '@/lib/importers/xml-invoice-importer';
import { formatPYG, formatDatePY } from '@/lib/utils';

export default function ImportadorXmlPage() {
  const [parsedInvoice, setParsedInvoice] = useState<ParsedXmlInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedSuccess, setImportedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setImportedSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = XmlInvoiceImporter.parseInvoiceXml(content, file.name);
        setParsedInvoice(result);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al procesar el archivo XML.');
        setParsedInvoice(null);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleXml = () => {
    setErrorMsg(null);
    setImportedSuccess(false);

    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd">
  <dFecFirma>2026-10-25T10:15:30</dFecFirma>
  <gOpeDE>
    <dDesProSer>Facturación Electrónica SIFEN</dDesProSer>
  </gOpeDE>
  <gTimb>
    <dNumTim>16894022</dNumTim>
    <dFeIniT>2026-10-25</dFeIniT>
  </gTimb>
  <gDatGralOpe>
    <dFeEmiDE>2026-10-25T09:30:00</dFeEmiDE>
    <gEmis>
      <dRucEmi>80018944-5</dRucEmi>
      <dNomEmi>ENERLUZ S.A. ILUMINACIÓN Y MATERIALES ELÉCTRICOS</dNomEmi>
    </gEmis>
  </gDatGralOpe>
  <gDtipDE>
    <gCamItem>
      <dDesProSer>BARRAM. COBRE 20X3MM 3/4X1/8 (211A)</dDesProSer>
      <cUniMed>m</cUniMed>
      <dCantProSer>10</dCantProSer>
      <dPUniProSer>82500</dPUniProSer>
      <dTasaIVA>10</dTasaIVA>
      <dTotOpeItem>825000</dTotOpeItem>
    </gCamItem>
    <gCamItem>
      <dDesProSer>DISYUNTOR TERMOMAGNETICO TRIPOLAR 3X63A ABB</dDesProSer>
      <cUniMed>un</cUniMed>
      <dCantProSer>2</dCantProSer>
      <dPUniProSer>245000</dPUniProSer>
      <dTasaIVA>10</dTasaIVA>
      <dTotOpeItem>490000</dTotOpeItem>
    </gCamItem>
    <gCamItem>
      <dDesProSer>CABLE UNIPOLAR COBRE 4.0 MM2 750V PRYSMIAN</dDesProSer>
      <cUniMed>m</cUniMed>
      <dCantProSer>100</dCantProSer>
      <dPUniProSer>4850</dPUniProSer>
      <dTasaIVA>10</dTasaIVA>
      <dTotOpeItem>485000</dTotOpeItem>
    </gCamItem>
  </gDtipDE>
</rDE>`;

    const parsed = XmlInvoiceImporter.parseInvoiceXml(sampleXml, 'ejemplo_sifen_enerluz.xml');
    setParsedInvoice(parsed);
  };

  const handleConfirmImport = () => {
    if (!parsedInvoice) return;

    // 1. Guardar o verificar proveedor
    const providers = StorageService.getProviders();
    let provider = providers.find(p => p.ruc === parsedInvoice.providerRuc);
    if (!provider) {
      provider = {
        id: `prov-${Date.now()}`,
        name: parsedInvoice.providerName,
        ruc: parsedInvoice.providerRuc,
        city: 'Asunción',
        address: 'Paraguay',
        phone: '',
        default_currency: 'PYG',
        is_active: true,
      };
      StorageService.saveProvider(provider);
    }

    // 2. Registrar cada ítem en el historial de precios y homologar alias
    parsedInvoice.items.forEach(it => {
      let targetProdId = it.suggestedCanonicalId;
      if (!targetProdId) {
        // Si no existe, crear producto canónico
        const newProd = {
          id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sku: `SKU-${Date.now()}`,
          internal_code: `SKU-${Date.now()}`,
          name: it.rawDescription,
          category_id: 'cat-tableros',
          brand: 'Estándar',
          unit: it.unit as any,
          is_active: true,
          base_description: it.rawDescription,
          min_price_pyg: it.unitCostPyg,
          max_price_pyg: it.unitCostPyg,
          last_price_pyg: it.unitCostPyg,
          last_price_date: parsedInvoice.issueDate,
          last_provider_name: parsedInvoice.providerName,
          aliases: [it.rawDescription],
          history: [],
        };
        StorageService.createProduct(newProd);
        targetProdId = newProd.id;
      }

      StorageService.recordPrice(targetProdId, {
        canonical_product_id: targetProdId,
        provider_id: provider?.id || 'prov-gen',
        provider_name: parsedInvoice.providerName,
        price_pyg: it.unitCostPyg,
        currency: parsedInvoice.currency,
        includes_iva: true,
        iva_rate_pct: it.ivaRate,
        date: parsedInvoice.issueDate,
        source_type: 'xml_import',
        source_ref: `Factura XML ${parsedInvoice.invoiceNumber} (Timbrado ${parsedInvoice.timbrado})`,
        notes: `Importación automática desde archivo ${parsedInvoice.sourceFilename}`,
      });

      StorageService.addAliasToProduct(targetProdId, it.rawDescription);
    });

    setImportedSuccess(true);
    alert(`¡Factura importada con éxito! Se registraron ${parsedInvoice.items.length} precios actualizados en el catálogo.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <FileCode className="w-4 h-4 text-amber-400" />
            </div>
            <span>Importador Seguro de Facturas Electrónicas XML</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compatible con SIFEN / e-Kuatia (SET Paraguay) • Parsing seguro sin entidades externas (XXE safe) • Detección de duplicados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleXml}
          className="px-3.5 py-2 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-colors"
        >
          Cargar XML de Ejemplo (SIFEN)
        </button>
      </div>

      {/* ÁREA DE CARGA DE ARCHIVO */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors text-center space-y-3">
        <Upload className="w-10 h-10 text-slate-400 mx-auto" />
        <div>
          <label className="cursor-pointer px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm inline-block">
            <span>Seleccionar Factura XML</span>
            <input
              type="file"
              accept=".xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-400 mt-2">
            Arrastra aquí tu archivo .xml de factura electrónica o selecciónalo desde tu computadora.
          </p>
        </div>
      </div>

      {/* MENSAJES DE ERROR */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VISTA PREVIA DEL COMPROBANTE XML PARSEADO */}
      {parsedInvoice && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Archivo: {parsedInvoice.sourceFilename}</span>
              <h2 className="text-base font-bold text-slate-900">{parsedInvoice.providerName}</h2>
              <span className="text-xs text-slate-500 font-mono">
                RUC: {parsedInvoice.providerRuc} • Timbrado: {parsedInvoice.timbrado} • Factura: {parsedInvoice.invoiceNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Factura</span>
              <span className="font-mono font-black text-xl text-blue-900">{formatPYG(parsedInvoice.totalPyg)}</span>
              <span className="text-[10px] text-slate-400 block">Fecha: {formatDatePY(parsedInvoice.issueDate)}</span>
            </div>
          </div>

          {parsedInvoice.isDuplicate && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center space-x-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Advertencia: {parsedInvoice.duplicateMessage}</span>
            </div>
          )}

          {/* TABLA DE ÍTEMS EXTRAÍDOS */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Materiales Extraídos y Sugerencias de Homologación ({parsedInvoice.items.length}):
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Descripción en Factura</th>
                    <th className="py-2.5 px-2 w-16 text-center">Unidad</th>
                    <th className="py-2.5 px-2 w-20 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 w-28 text-right">Costo Unit. (Gs)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total Ítem</th>
                    <th className="py-2.5 px-3">Sugerencia Catálogo Maestro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedInvoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{it.rawDescription}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{it.unit}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatPYG(it.unitCostPyg)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">{formatPYG(it.totalPyg)}</td>
                      <td className="py-2.5 px-3 text-emerald-800">
                        {it.suggestedCanonicalName ? (
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold">{it.suggestedCanonicalName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Se creará nuevo material en catálogo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setParsedInvoice(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Descartar
            </button>
            <button
              type="button"
              disabled={importedSuccess}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all ${
                importedSuccess 
                  ? 'bg-emerald-600 text-white cursor-default' 
                  : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-95'
              }`}
            >
              {importedSuccess ? '✓ Factura Importada' : 'Incorporar Precios al Catálogo'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
