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

## 🗄️ Opción 4: Base de Datos Serverless en la Nube (Neon PostgreSQL - Recomendado)

ElectroCotiza cuenta con soporte nativo para **Neon Serverless Postgres** (PostgreSQL 18 en la nube con `pg_trgm` y `uuid-ossp`):

1. **Aprovisionar o Usar Base de Datos Neon Existente:**
   - Si creas una base de datos nueva en [neon.tech](https://neon.tech), copia el `connection string` (`postgresql://neondb_owner:...`).
2. **Migración Automática con un Solo Comando:**
   ```bash
   node scripts/migrate-neon.mjs
   ```
   *Este script ejecuta las 34 sentencias DDL de `schema.sql` y las 10 sentencias de inserción de datos maestros de `seed.sql`.*
3. **Configuración en Vercel:**
   - En tu proyecto de Vercel ve a **Settings** -> **Environment Variables**.
   - Agrega:
     - **`DATABASE_URL`**: `postgresql://neondb_owner:npg_fs48GgIkHlVe@ep-weathered-lab-b4ub6git-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - Realiza un nuevo deploy o espera al siguiente push a GitHub. La aplicación conectará automáticamente con tu base de datos Neon Serverless.

---

## 🗄️ Opción 5: Aprovisionamiento en Supabase (Alternativa)

Si prefieres usar Supabase en lugar de Neon:

1. Ingresa a [Supabase.com](https://supabase.com) y crea un proyecto nuevo (`sa-east-1` São Paulo).
2. Ve al **SQL Editor** en el panel de Supabase y ejecuta [`supabase/schema.sql`](supabase/schema.sql) y [`supabase/seed.sql`](supabase/seed.sql).
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
