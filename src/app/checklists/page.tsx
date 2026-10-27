'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileCheck, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  User, 
  Briefcase, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { StorageService } from '@/lib/data/storage';
import { ChecklistTemplate, ChecklistExecution, Project } from '@/lib/types';
import { formatDatePY } from '@/lib/utils';

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Modal Ejecutar Checklist
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [inspectorName, setInspectorName] = useState('Ramón Fleitas (Supervisor)');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState('');

  const loadData = () => {
    setTemplates(StorageService.getChecklistTemplates());
    setExecutions(StorageService.getChecklistExecutions());
    const proys = StorageService.getProjects();
    setProjects(proys);
    if (proys.length > 0 && !selectedProjectId) {
      setSelectedProjectId(proys[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenExecution = (template: ChecklistTemplate) => {
    setActiveTemplate(template);
    const initialAnswers: Record<string, string> = {};
    template.sections.forEach(sec => {
      sec.questions.forEach(q => {
        initialAnswers[q.id] = q.response_type === 'yes_no_na' ? 'SI' : '';
      });
    });
    setAnswers(initialAnswers);
    setObservations('');
  };

  const handleSaveExecution = () => {
    if (!activeTemplate) return;

    const answersList = Object.entries(answers).map(([qid, val]) => ({
      question_id: qid,
      answer_value: val,
    }));

    const execution: ChecklistExecution = {
      id: `chke-${Date.now()}`,
      template_id: activeTemplate.id,
      template_title: activeTemplate.title,
      project_id: selectedProjectId || undefined,
      inspector_name: inspectorName,
      execution_date: new Date().toISOString().split('T')[0],
      answers: answersList,
      general_status: 'aprobado',
      observations: observations.trim() || 'Inspección completada conforme según normativa técnica.',
      created_at: new Date().toISOString(),
    };

    StorageService.saveChecklistExecution(execution);
    loadData();
    setActiveTemplate(null);
    alert('¡Protocolo de Checklist completado y registrado con éxito!');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <span>Protocolos y Checklists Técnicos Normativos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspección de tableros, puesta a tierra (Normas ANDE) y comisionamiento electromecánico.
          </p>
        </div>
      </div>

      {/* PLANTILLAS DISPONIBLES */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Plantillas de Inspección Disponibles:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  {tpl.category}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-2">{tpl.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Contiene {tpl.sections.length} secciones y {tpl.sections.reduce((acc, s) => acc + s.questions.length, 0)} puntos de verificación técnica.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Listo para aplicar</span>
                <button
                  type="button"
                  onClick={() => handleOpenExecution(tpl)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ejecutar Inspección</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HISTORIAL DE EJECUCIONES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Historial de Protocolos Ejecutados en Obra ({executions.length})
        </h2>

        <div className="space-y-3">
          {executions.map(ex => {
            const proy = projects.find(p => p.id === ex.project_id);

            return (
              <div key={ex.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-400 text-[10px]">{formatDatePY(ex.execution_date)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ex.general_status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{ex.template_title}</h4>
                  <p className="text-slate-600 mt-0.5">
                    Inspector: <strong>{ex.inspector_name}</strong> • Obra: <strong>{proy?.name || 'Obra General'}</strong>
                  </p>
                  {ex.observations && (
                    <p className="text-slate-500 italic text-[11px] mt-1 bg-white p-2 rounded border border-slate-200">
                      &quot;{ex.observations}&quot;
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-700 block">{ex.answers.length} puntos validados</span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1 justify-end mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Conforme Normas Técnicas</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL EJECUCIÓN DE CHECKLIST */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase">Ejecución de Protocolo</span>
                <h3 className="font-bold text-sm text-slate-900">{activeTemplate.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTemplate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proyecto / Obra Vinculada</label>
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspector / Supervisor</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={e => setInspectorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {activeTemplate.sections.map((sec, sIdx) => (
                <div key={sec.id} className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                    {sec.title}
                  </h4>

                  <div className="space-y-2">
                    {sec.questions.map((q) => (
                      <div key={q.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 flex-1">{q.prompt}</span>

                        {q.response_type === 'yes_no_na' ? (
                          <div className="flex items-center space-x-1 shrink-0">
                            {['SI', 'NO', 'N/A'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                className={`px-2.5 py-1 rounded font-bold text-xs ${
                                  answers[q.id] === opt 
                                    ? opt === 'SI' ? 'bg-emerald-600 text-white' : opt === 'NO' ? 'bg-red-600 text-white' : 'bg-slate-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-600'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type={q.response_type === 'number' ? 'number' : 'text'}
                            value={answers[q.id] || ''}
                            onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                            placeholder="Valor medido..."
                            className="w-32 px-2 py-1 border border-slate-300 rounded bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones Finales del Inspector</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Detalles sobre mediciones, comisionamiento o ajustes realizados..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTemplate(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveExecution}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Guardar Protocolo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
