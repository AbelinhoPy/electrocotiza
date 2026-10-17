# Guía de Despliegue en Producción - ElectroCotiza ⚡
### Construlogica Emprendimientos S.A.

Esta guía detalla paso a paso cómo subir el proyecto a **GitHub**, desplegarlo en **Vercel** (la opción recomendada para Next.js con coste cero) o en **Docker / VPS**, y configurar la base de datos en la nube de **Supabase**.

---

## 📌 Opción 1: Subir el Proyecto a GitHub

El proyecto ya está inicializado con Git y tiene todos los commits listos en la rama `master`.

### Método A: Usando GitHub CLI (`gh`) - Recomendado

1. Autenticarte en tu cuenta de GitHub desde la terminal:
   ```bash
   gh auth login
   ```
   *(Sigue las instrucciones: selecciona `GitHub.com` -> `HTTPS` -> Iniciar sesión con un navegador web).*

2. Crear el repositorio y subir el código automáticamente:
   ```bash
   gh repo create electrocotiza --public --source=. --remote=origin --push
   ```
   *(Si prefieres que sea privado, reemplaza `--public` por `--private`).*

---

### Método B: Usando Git Tradicional

1. Crea un repositorio vacío en [GitHub.com/new](https://github.com/new) llamado `electrocotiza`.
2. Vincula el repositorio remoto y sube el código:
   ```bash
   # Renombrar rama a main si lo prefieres
   git branch -M main

   # Vincular tu repositorio remoto (sustituye TU_USUARIO)
   git remote add origin https://github.com/TU_USUARIO/electrocotiza.git

   # Subir los commits
   git push -u origin main
   ```

---

## 🚀 Opción 2: Despliegue en Vercel (Recomendado)

Vercel es la plataforma nativa de los creadores de Next.js. Provee servidores perimetrales (Edge), HTTPS automático, optimización móvil y cero coste de servidor en plan hobby.

### Pasos para Desplegar:

1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona el repositorio **`electrocotiza`** y haz clic en **"Import"**.
4. En la pantalla de configuración:
   - **Framework Preset:** `Next.js` (detectado automáticamente).
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. *(Opcional)* En la sección **Environment Variables**, puedes agregar:
   - `NEXT_PUBLIC_APP_URL`: La URL de tu dominio en Vercel (ej. `https://electrocotiza.vercel.app`).
   - `GEMINI_API_KEY`: Tu clave de Google Gemini para OCR inteligente (si la vas a activar).
6. Haz clic en **"Deploy"**.
7. En menos de **90 segundos**, tu aplicación estará viva en internet con certificado SSL y disponible para celulares y PCs.

> [!TIP]
> Cada vez que hagas un `git push` a la rama `main` o `master`, Vercel compilará y actualizará la aplicación de forma 100% automática.

---

## 🐳 Opción 3: Despliegue con Docker (Servidor Propio / VPS / Railway / Render)

El repositorio incluye un [`Dockerfile`](Dockerfile) optimizado de multi-etapa con salida `standalone` que produce una imagen de menos de 150MB.

### 1. Construir y Ejecutar Localmente:

```bash
# Construir la imagen
docker build -t electrocotiza:latest .

# Ejecutar el contenedor en el puerto 3000
docker run -d -p 3000:3000 --name electrocotiza-app electrocotiza:latest
```

Abre en tu navegador `http://localhost:3000`.

### 2. Despliegue en Railway / Render:
1. Conecta el repositorio de GitHub.
2. La plataforma detectará el `Dockerfile` automáticamente.
3. Expón el puerto `3000`.

---

## 🗄️ Opción 4: Aprovisionamiento de Base de Datos Supabase (Opcional)

ElectroCotiza funciona **Local-First** por defecto (con almacenamiento persistente en el dispositivo del usuario), pero el código y esquema SQL están 100% listos para conectarse a una base de datos PostgreSQL en la nube:

1. Ingresa a [Supabase.com](https://supabase.com) y crea un proyecto nuevo.
   - **Región recomendada para Paraguay:** `sa-east-1` (São Paulo, Brasil) para una latencia menor a 40ms.
2. Ve al **SQL Editor** en el panel de Supabase:
   - Abre y copia el contenido de [`supabase/schema.sql`](supabase/schema.sql). Pégalo y ejecútalo. Esto creará todas las tablas, los triggers de precios, el aislamiento RLS y la extensión `pg_trgm`.
   - Abre y copia el contenido de [`supabase/seed.sql`](supabase/seed.sql). Pégalo y ejecútalo para cargar los proveedores, categorías y catálogo maestro inicial.
3. En **Project Settings** -> **API**, copia:
   - `Project URL` -> Configúralo como `NEXT_PUBLIC_SUPABASE_URL` en Vercel.
   - `anon public key` -> Configúralo como `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel.

---

## ✅ Verificación Post-Despliegue

Una vez desplegada la aplicación, realiza las siguientes comprobaciones rápidas desde tu celular o PC:

1. **Ingreso y Sesión:**
   - Entra a `/login` y haz clic en *"Dueño / Jefe de Obra"*. Verifica que tu nombre (*Ing. Abel K.*) y cargo aparezcan en la barra superior.
2. **Mi Empresa:**
   - Entra a `/empresa` y confirma los datos de *Construlogica Emprendimientos S.A.* y las cuentas bancarias SIPAP.
3. **Presupuestos y PDF:**
   - Entra a `/presupuestos`, abre una cotización y pulsa *"PDF Cliente (Marco Dorado)"*. Comprueba que el archivo PDF se descargue con el logotipo, filete dorado y sin mostrar costos internos.
4. **WhatsApp:**
   - Pulsa el botón *"WhatsApp"* para comprobar que abre la app de mensajería con el texto listo para enviar al cliente.
5. **Copia de Seguridad:**
   - Entra a `/configuracion` y pulsa *"Descargar Respaldo Completo (.JSON)"* para verificar que se genere la copia de seguridad.

---

¡Listo! ElectroCotiza está preparado para venderse y operar en producción con máxima estabilidad y seguridad.
