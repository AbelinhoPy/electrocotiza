import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { image, fileName, apiKey: clientApiKey } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No se recibió ninguna imagen para procesar.' },
        { status: 400 }
      );
    }

    // 1. Limpiar el formato Base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    // 2. Si hay clave de Gemini API, invocar Gemini Vision AI
    if (apiKey) {
      try {
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
        let geminiRes: Response | null = null;
        let lastErr = '';

        for (const model of models) {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Eres un asistente contable y especialista en facturas comerciales y comprobantes electrónicos KuDE de Paraguay para obras y materiales eléctricos.
Analiza con total precisión esta imagen de factura o ticket de ferretería paraguayo.
Extrae TODOS los materiales listados con sus cantidades, precios unitarios y totales en guaraníes.

REGLAS CRÍTICAS DE PARAGUAY:
- Los precios en guaraníes (PYG) NO tienen centavos ni decimales. Si ves puntos como separadores de miles (ejemplo: 465.600 o 1.500.831), conviértelos a números enteros puros (465600 o 1500831).
- Extrae CADA material o ítem individual en el arreglo "items".
- Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "provider_name": "Nombre o Razón Social del proveedor/ferretería (ej: ENERLUZ S.A., ELECTRO SYSTEM S.R.L., etc.)",
  "ruc": "RUC del proveedor con dígito verificador (ej: 80022415-9)",
  "invoice_number": "Número legal de factura (ej: 001-001-0033088)",
  "timbrado": "Número de timbrado de 8 dígitos",
  "issue_date": "Fecha en formato YYYY-MM-DD",
  "payment_condition": "contado o credito",
  "total_pyg": 1650000,
  "items": [
    {
      "raw_description": "Nombre claro del material o conductor",
      "quantity": 1,
      "unit": "un, m, barra, rollo, caja, kg",
      "unit_cost_pyg": 825000,
      "total_pyg": 825000
    }
  ]
}`,
                      },
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  response_mime_type: 'application/json',
                },
              }),
            }
          );

          if (res.ok) {
            geminiRes = res;
            break;
          } else {
            const errText = await res.text();
            lastErr = `${model} status ${res.status}: ${errText}`;
          }
        }

        if (geminiRes && geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);

            // Sanitizador robusto para números guaraníes (quita puntos de miles)
            const cleanNumber = (val: any): number => {
              if (typeof val === 'number') return Math.round(val);
              if (typeof val === 'string') {
                const digits = val.replace(/\D/g, '');
                return digits ? parseInt(digits, 10) : 0;
              }
              return 0;
            };

            const sanitizedItems = (parsed.items || []).map((it: any) => {
              const qty = cleanNumber(it.quantity) || 1;
              const unitCost = cleanNumber(it.unit_cost_pyg);
              const lineTotal = cleanNumber(it.total_pyg) || (unitCost * qty);
              return {
                raw_description: String(it.raw_description || 'Material Eléctrico'),
                quantity: qty,
                unit: String(it.unit || 'un'),
                unit_cost_pyg: unitCost,
                total_pyg: lineTotal,
              };
            });

            const calculatedTotal = cleanNumber(parsed.total_pyg) || sanitizedItems.reduce((acc: number, it: any) => acc + it.total_pyg, 0);

            return NextResponse.json({
              success: true,
              method: 'gemini_vision_ai',
              invoice: {
                provider_name: parsed.provider_name || 'Proveedor Detectado',
                ruc: parsed.ruc || '',
                invoice_number: parsed.invoice_number || '',
                timbrado: parsed.timbrado || '',
                issue_date: parsed.issue_date || new Date().toISOString().split('T')[0],
                payment_condition: parsed.payment_condition || 'contado',
                total_pyg: calculatedTotal,
                items: sanitizedItems,
              },
            });
          }
        } else {
          console.warn('Gemini API Error:', lastErr);
        }
      } catch (geminiErr: any) {
        console.warn('Excepción en llamada a Gemini Vision:', geminiErr);
      }
    }

    // 3. Si no hay clave de API configurada en Vercel o en la App
    return NextResponse.json({
      success: true,
      method: 'no_api_key',
      warning: !apiKey ? 'missing_api_key' : 'gemini_error',
      invoice: {
        provider_name: '',
        ruc: '',
        invoice_number: '',
        timbrado: '',
        issue_date: new Date().toISOString().split('T')[0],
        payment_condition: 'contado',
        total_pyg: 0,
        items: [
          {
            raw_description: '',
            quantity: 1,
            unit: 'un',
            unit_cost_pyg: 0,
            total_pyg: 0,
          },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
