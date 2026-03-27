# HashCrack

Herramienta de cracking de hashes con interfaz web moderna. Funciona 100% offline, sin enviar datos a ningún servidor externo.

![hashcrack-1](https://github.com/user-attachments/assets/4480e73d-ec57-4188-a7f5-2043bd432cc2)

---

## Índice

- [Descripción](#descripción)
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Interfaz de usuario](#interfaz-de-usuario)
- [Motor de cracking](#motor-de-cracking)
- [Tipos de hash soportados](#tipos-de-hash-soportados)
- [Gestión de wordlists](#gestión-de-wordlists)
- [Generador de hashes (CyberChef)](#generador-de-hashes-cyberchef)
- [Internacionalización](#internacionalización)
- [Tema claro / oscuro](#tema-claro--oscuro)
- [API REST](#api-rest)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

---

## Descripción

HashCrack es una aplicación de escritorio (frontend web + backend local) diseñada para identificar y crackear hashes de contraseñas en entornos locales. No requiere conexión a internet en ningún momento. Todos los datos, resultados y wordlists residen en la máquina del usuario.

### Arquitectura

```
┌────────────────────────────────────────────────────────┐
│                       HashCrack                        │
│                                                        │
│  ┌──────────────┐   HTTP/WS   ┌──────────────────────┐ │
│  │  Frontend    │ ◄─────────► │  Backend (FastAPI)   │ │
│  │  React+Vite  │             │  puerto 8000         │ │
│  │  puerto 3000 │             └──────────┬───────────┘ │
│  └──────────────┘                        │             │
│                                          ▼             │
│                               ┌──────────────────────┐ │
│                               │  SQLite (resultados) │ │
│                               │  Wordlists (disco)   │ │
│                               └──────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

| Componente | Tecnología | Función |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Interfaz de usuario |
| Backend | FastAPI (Python) | API REST + WebSocket |
| Base de datos | SQLite | Resultados y caché |
| Estado | Zustand | Estado global del frontend |
| Progreso en vivo | WebSocket | Actualizaciones en tiempo real |
| i18n | Sistema propio (ES/EN) | Traducciones en toda la interfaz |
| Tema | CSS data-theme + Zustand | Modo claro y oscuro |

---

## Características

- **100% local** — ningún dato sale del equipo
- **Detección automática** de más de 50 tipos de hash con variantes (MD5/NTLM/MD4/LM se muestran como posibilidades simultáneas)
- **Rainbow table** integrada con ~700+ contraseñas comunes × 12 algoritmos (lookup instantáneo)
- **Dictionary attack** con cualquier wordlist, procesamiento por streaming
- **Rules attack** con ~75 transformaciones (l33t, capitalización, sufijos, años, símbolos, etc.)
- **Brute force** — fuerza bruta para contraseñas cortas (dígitos hasta 8 chars, letras hasta 4 chars)
- **Motor con fallback integrado** — si no hay wordlist, el engine prueba automáticamente ~700 contraseñas comunes + todas las reglas
- **Detección inteligente de variantes** — para hashes ambiguos (misma longitud hex) se prueban todos los algoritmos posibles y se devuelve el tipo correcto
- **Gestión de wordlists** — escaneo automático del sistema, carga por drag & drop, estadísticas de efectividad
- **Filtros por categoría** — en Kali Linux las wordlists se clasifican automáticamente (SecLists, Metasploit, Dirb, Dirbuster, Wfuzz, John, Nmap, SQLMap, Rockyou, etc.)
- **Procesamiento por lotes** — miles de hashes simultáneamente
- **Progreso en tiempo real** vía WebSocket
- **Exportación** en JSON, CSV, TXT y formato potfile (compatible con Hashcat / John)
- **Persistencia** — los hashes crackeados se guardan en SQLite para consultas posteriores
- **Generador de hashes** — enlaces directos a CyberChef para generar MD5, SHA1, SHA256, NT Hash, bcrypt y más
- **Estadísticas avanzadas** — distribución por tipo/estrategia, hashes expandibles, filtros por tipo de hash y estrategia
- **Interfaz dark / light** — tema oscuro y claro con cambio instantáneo
- **Bilingüe (ES/EN)** — español por defecto, inglés disponible desde el header
- **Docker** — despliegue en un solo comando con `docker compose` (recomendado)

---

## Requisitos

### Docker (recomendado)

| Software | Versión mínima |
|---|---|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |

> No necesitas instalar Python ni Node.js si usas Docker.

### Instalación nativa

| Software | Versión mínima |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

### Hardware recomendado

| Componente | Mínimo | Recomendado |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disco | 500 MB | 10+ GB (para wordlists grandes) |

### Compatibilidad de SO

- Windows 10 / 11
- Linux (Ubuntu 20.04+, Kali Linux, Parrot OS)
- macOS 11+

---

## Instalación

### Docker (recomendado)

```bash
docker compose up -d
```

Esto construye la imagen, instala todas las dependencias y levanta el servicio. Accede a `http://localhost:3000`.

Para reconstruir tras cambios en el código:

```bash
docker compose up -d --build
```

Para detener:

```bash
docker compose down
```

> El volumen `./data` se monta automáticamente, así que wordlists, resultados y la base de datos SQLite persisten entre reinicios.

### Windows (nativo)

```bat
install.bat
```

### Linux / macOS (nativo)

```bash
chmod +x install.sh start.sh
./install.sh
```

### Instalación manual (cualquier SO)

```bash
# Backend
cd backend
python -m pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Directorios de datos
mkdir -p ../data/wordlists ../data/results ../data/tmp
```

El instalador realiza automáticamente:
1. `pip install -r backend/requirements.txt`
2. `npm install` en el directorio `frontend/`
3. Creación de los directorios `data/wordlists`, `data/results`, `data/tmp`

### Dependencias Python instaladas

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
websockets==12.0
aiofiles==23.2.1
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
watchdog==3.0.0
```

---

## Inicio rápido

### Docker (recomendado)

```bash
docker compose up -d
```

Accede a `http://localhost:3000`. La API está en `http://localhost:8000/docs`.

### Windows (nativo)

```bat
start.bat
```

### Linux / macOS (nativo)

```bash
./start.sh
```

Ambos scripts nativos:
1. Lanzan el backend en `http://localhost:8000`
2. Lanzan el frontend en `http://localhost:3000`
3. Abren el navegador automáticamente

### Inicio manual

```bash
# Terminal 1 — Backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Accede desde el navegador a `http://localhost:3000`.

La documentación interactiva de la API está disponible en `http://localhost:8000/docs`.

---

## Interfaz de usuario

La aplicación tiene tres secciones principales accesibles desde la barra de navegación superior. El header incluye además un selector de **idioma** (ES/EN), un botón de **tema** (☀/🌙) y un indicador de estado.

### Pestaña Cracker

<img width="2772" height="1772" alt="image" src="https://github.com/user-attachments/assets/7a6825f8-d681-46b0-9bf5-494b190ff515" />

Flujo de trabajo principal:

1. **Entrada de hashes** — pega hashes directamente en el área de texto, cárgalos desde un archivo `.txt` o arrástralos con drag & drop. La detección automática se ejecuta en tiempo real y muestra **variantes** cuando la confianza es baja (p.ej. `md5 / ntlm / md4 / lm 50%`).
2. **Opciones de cracking** — selecciona las estrategias a usar y la wordlist activa.
3. **Iniciar / Detener** — el botón principal lanza la tarea. El progreso se muestra en tiempo real.
4. **Resultados** — tabla con cada hash crackeado, tipo detectado real, contraseña encontrada, estrategia utilizada y tiempo de resolución.
5. **Generador de hashes** — panel con botones que abren CyberChef directamente con la receta del tipo de hash seleccionado (MD5, SHA1, NT Hash, etc.).

```
┌─────────────────────────────────────────────────────────┐
│  HASHCRACK                    [ES/EN] [☀/🌙] LOCAL     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Hashes de Entrada ───────────────────────────────┐  │
│  │  [área de texto / drag & drop]                   │  │
│  │  [Cargar archivo] [Pegar]                        │  │
│  │  Detección: md5 / ntlm / md4 / lm 50%            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Resultados ──────────────────────────────────────┐  │
│  │  Hash           Tipo    Contraseña   Estrategia   │  │
│  │  5f4dcc3b...    md5     password     rainbow      │  │
│  └──────────────────────────────────────────────────┘  │
│                                         │               │
│  ┌─ Generador ──────────────────────────┤               │
│  │  [MD5] [SHA1] [SHA256] [NT Hash]    │               │
│  │  [SHA3-256] [Bcrypt] [Whirlpool]    │               │
│  │  → abre CyberChef con la receta     │               │
│  └──────────────────────────────────────┘               │
│            ┌─ Opciones ─────────────────┤               │
│            │  ☑ Rainbow Tables          │               │
│            │  ☑ Dictionary Attack       │               │
│            │  ☑ Rules Attack            │               │
│            │  ☐ Brute Force             │               │
│            │  Wordlist: rockyou.txt ▼   │               │
│            │                            │               │
│            │  [INICIAR CRACKING]        │               │
│            │  Progreso: 8.432 / 50.000  │               │
│            │  Crackeados: 1.234 (14.6%) │               │
│            └────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Pestaña Wordlists

<img width="2674" height="1386" alt="image" src="https://github.com/user-attachments/assets/82957a2b-0cad-4ebd-9124-41b2d1059e0c" />

Gestión completa de wordlists:

- **Cargar wordlist** — arrastra un archivo o usa el selector. Soporta `.txt`, `.gz`, `.zip`, `.lst`, `.dict`.
- **Escanear sistema** — detecta automáticamente wordlists en rutas comunes del sistema operativo.
- **Previsualizar** — muestra las primeras 20 palabras de cualquier wordlist sin cargarla completa.
- **Estadísticas** — tasa de éxito histórica, total de cracks y fecha de último uso.
- **Selección activa** — marca la wordlist que se usará en la siguiente tarea de cracking.

Rutas escaneadas automáticamente:

```
/usr/share/wordlists/                          (Kali Linux, Parrot OS)
/usr/share/seclists/                           (SecLists completo)
/usr/share/metasploit-framework/data/wordlists/ (Metasploit)
/usr/share/dirb/wordlists/                     (Dirb)
/usr/share/dirbuster/wordlists/                (Dirbuster)
/usr/share/wfuzz/wordlist/                     (Wfuzz)
/usr/share/john/                               (John the Ripper)
/usr/share/nmap/nselib/data/                   (Nmap NSE scripts)
/usr/share/sqlmap/data/txt/                    (SQLMap)
/usr/share/dict/                               (diccionarios del sistema)
~/wordlists/
~/Documents/wordlists/
./data/wordlists/                              (directorio local de HashCrack)
```

#### Filtros por categoría

En sistemas con muchas wordlists (como Kali Linux), las wordlists se clasifican automáticamente por **categoría** según su ruta de origen:

| Categoría | Fuente detectada |
|---|---|
| SecLists | `/usr/share/seclists/` |
| Metasploit | `/usr/share/metasploit-framework/` |
| Dirb | `/usr/share/dirb/` |
| Dirbuster | `/usr/share/dirbuster/` |
| Wfuzz | `/usr/share/wfuzz/` |
| John | `/usr/share/john/` |
| Nmap | `/usr/share/nmap/` |
| SQLMap | `/usr/share/sqlmap/` |
| Rockyou | Archivos con "rockyou" en el nombre |
| System | `/usr/share/dict/` |
| Custom | Wordlists subidas manualmente |

Los filtros aparecen como botones con colores diferenciados y conteo de wordlists por categoría. Solo se muestran las categorías que existen en el sistema.

### Pestaña Estadísticas

<img width="2878" height="1926" alt="image" src="https://github.com/user-attachments/assets/ccb5f967-13bb-498c-bfce-efe3694ca12c" />

- Total de hashes crackeados, tareas completadas, top wordlists
- Distribución por tipo de hash (barras de progreso)
- Distribución por estrategia (barras de progreso)
- Top wordlists más efectivas (tabla con % éxito)
- Historial de los últimos cracks con:
  - **Hashes expandibles** — clic en el chevron para ver el hash completo en monospace
  - **Filtros** — dropdown por tipo de hash y por estrategia, mostrando "Todos" por defecto

---

## Motor de cracking

Las estrategias se ejecutan en orden de velocidad decreciente. Si una estrategia encuentra la contraseña, las siguientes se omiten para ese hash.

### Detección inteligente de variantes

Cuando un hash puede coincidir con múltiples algoritmos (por ejemplo, 32 caracteres hex puede ser MD5, NTLM, MD4 o LM), el detector devuelve todas las **variantes** posibles con un nivel de confianza. El motor de cracking prueba cada variante hasta encontrar una coincidencia, devolviendo el tipo real en el resultado.

```json
{
  "hash": "5f4dcc3b5aa765d61d8327deb882cf99",
  "detected_type": "md5",
  "confidence": 0.5,
  "variants": ["md5", "ntlm", "md4", "lm"]
}
```

### 1. Rainbow Tables

Tabla precomputada integrada con ~700+ contraseñas comunes (`password`, `123456`, `admin`, `qwerty`, etc.) hasheadas con 12 algoritmos: MD5, SHA1, SHA256, SHA512, SHA224, SHA384, NTLM, SHA3-256, SHA3-512, RIPEMD-160, Whirlpool y MySQL 3.23.

- **Velocidad**: instantáneo (lookup en diccionario Python)
- **Cobertura**: contraseñas extremadamente comunes, todos los algoritmos soportados
- **Sin dependencia** de wordlist externa

### 2. Dictionary Attack

Lee la wordlist seleccionada línea por línea y compara el hash calculado con el objetivo. Prueba **todas las variantes** de algoritmo detectadas.

- **Velocidad**: depende del algoritmo y el tamaño de la wordlist
- **Memoria**: streaming — no carga todo el archivo en RAM
- **Recomendación**: usar `rockyou.txt` como primera wordlist

### 3. Rules Attack

Aplica ~75 transformaciones a cada palabra de la wordlist antes de hashear. También prueba **todas las variantes** de algoritmo.

| Transformación | Ejemplo |
|---|---|
| Sin cambio | `password` |
| Capitalizar | `Password` |
| Mayúsculas / Minúsculas / SwapCase | `PASSWORD` / `password` / `PASSWORD` |
| Añadir dígitos | `password1`, `password12`, `password123`, `password69` |
| Añadir símbolos | `password!`, `password@`, `password#`, `password$` |
| Añadir año | `password2024`, `password2023`, `password2022` |
| Capitalizar + sufijo | `Password!`, `Password123`, `Password1!`, `Password2024!` |
| Prepend | `1password`, `!password`, `123password`, `@password` |
| L33tspeak (múltiples variantes) | `p@55w0rd`, `p4ssw0rd`, `p@$$word` |
| Invertir | `drowssap` |
| Duplicar (≤6 chars) | `passpass` |
| Repetir primer/último carácter | `passwordd`, `passwordp` |
| Toggle first char | `Password` ↔ `password` |

### 4. Brute Force

Prueba todas las combinaciones posibles de caracteres cortos:

- **Fase 1**: Todos los dígitos (`0`-`9`) de 1 a 8 caracteres
- **Fase 2**: Todas las letras minúsculas (`a`-`z`) de 1 a 4 caracteres
- **Velocidad**: depende del algoritmo y longitud — rápido para hashes de 1-4 dígitos
- **Ideal para**: PINs, códigos numéricos cortos, contraseñas triviales

### 5. Motor con fallback integrado

Cuando se seleccionan las estrategias Dictionary o Rules, el motor ejecuta automáticamente un **ataque de fallback** con ~700 contraseñas comunes integradas + todas las reglas, incluso si no hay wordlist seleccionada. Esto maximiza la cobertura sin depender de archivos externos.

### Algoritmos de verificación soportados

| Familia | Algoritmos |
|---|---|
| Estándar | MD5, SHA1, SHA224, SHA256, SHA384, SHA512, SHA3-256, SHA3-512, RIPEMD-160 |
| Windows | NTLM (MD4), LM, MD4, NTLMv1, NTLMv2 |
| Unix | md5crypt (`$1$`), sha256crypt (`$5$`), sha512crypt (`$6$`) |
| Modernos | bcrypt (`$2a$`, `$2b$`, `$2y$`) |
| Base de datos | MySQL 3.23 (16 hex) |

---

## Tipos de hash soportados

La detección automática identifica el tipo basándose en longitud, charset y prefijos característicos.

| Tipo | Longitud | Ejemplo de prefijo | Modo Hashcat |
|---|---|---|---|
| MD5 | 32 hex | — | `-m 0` |
| NTLM | 32 hex | — | `-m 1000` |
| MD4 | 32 hex | — | `-m 900` |
| LM | 32 hex | — | `-m 3000` |
| SHA1 | 40 hex | — | `-m 100` |
| SHA224 | 56 hex | — | `-m 1300` |
| SHA256 | 64 hex | — | `-m 1400` |
| SHA384 | 96 hex | — | `-m 10800` |
| SHA512 | 128 hex | — | `-m 1700` |
| SHA3-256 | 64 hex | — | `-m 17300` |
| SHA3-512 | 128 hex | — | `-m 17600` |
| RIPEMD-160 | 40 hex | — | `-m 6000` |
| Whirlpool | 128 hex | — | `-m 6100` |
| MySQL 3.23 | 16 hex | — | `-m 200` |
| MySQL 4.1+ | 41 chars | `*` | `-m 300` |
| md5crypt | variable | `$1$` | `-m 500` |
| sha256crypt | variable | `$5$` | `-m 7400` |
| sha512crypt | variable | `$6$` | `-m 1800` |
| bcrypt | 60+ chars | `$2a$` / `$2b$` | `-m 3200` |
| Argon2i | variable | `$argon2i$` | `-m 13400` |
| Argon2id | variable | `$argon2id$` | `-m 13400` |
| scrypt | variable | `$scrypt$` | `-m 8900` |
| WordPress / phpass | variable | `$P$` / `$H$` | `-m 400` |
| Drupal 7 | variable | `$S$` | `-m 7900` |
| Joomla | 32+32 hex | — | `-m 11` |
| Django SHA1 | variable | `sha1$` | `-m 124` |
| Django PBKDF2 | variable | `pbkdf2_sha256$` | `-m 10900` |
| MSSQL 2000 | variable | `0x0100` | `-m 131` |
| MSSQL 2005 | variable | `0x0100` | `-m 132` |
| Oracle 11g | 62 chars | `S:` | `-m 112` |
| Cisco Type 7 | variable | `\d{2}` | `-m 2` |
| Cisco Type 5 | variable | `$1$` | `-m 500` |
| NTLMv1 | variable | — | `-m 5500` |
| NTLMv2 | variable | — | `-m 5600` |
| Kerberos 5 TGS | variable | `$krb5tgs$` | `-m 13100` |
| Kerberos 5 AS-REP | variable | `$krb5asrep$` | `-m 18200` |
| WPA | 64 hex | — | `-m 2500` |

> Los tipos con la misma longitud en hexadecimal (MD5, NTLM, MD4, LM) se devuelven como variantes con nivel de confianza del 50%. El detector muestra todas las posibilidades y el motor prueba cada una.

---

## Gestión de wordlists

### Formatos soportados

| Formato | Descripción |
|---|---|
| `.txt` | Texto plano, una contraseña por línea |
| `.lst` / `.dict` | Igual que `.txt` |
| `.gz` | Gzip — se descomprime automáticamente |
| `.zip` | Zip — se extrae el primer `.txt` encontrado |

### Wordlists recomendadas

| Nombre | Contraseñas | Descripción |
|---|---|---|
| [CrackStation](https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm) | 64 M+ | Compilación masiva de contraseñas filtradas reales — **recomendada** |
| rockyou.txt | 14.3 M | Contraseñas reales de la brecha RockYou (2009) |
| rockyou-2021.txt | ~8.4 GB | Compilación moderna de múltiples brechas |
| SecLists/Passwords | varios | Colección curada para pentesting |
| fasttrack.txt | 200 K | Contraseñas cortas muy comunes |
| xato-net-10-million | 10 M | Top 10 millones de contraseñas |

> **Wordlist recomendada**: [CrackStation](https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm) ofrece +64 millones de contraseñas reales filtradas. Descarga el archivo, descomprímelo y cárgalo desde la pestaña **Wordlists**.

En Kali Linux, `rockyou.txt` suele estar comprimida:

```bash
sudo gunzip /usr/share/wordlists/rockyou.txt.gz
```

### Carga de wordlist personalizada

1. Ve a la pestaña **Wordlists**
2. Arrastra el archivo al área de carga o haz clic en **Cargar Wordlist**
3. La wordlist se indexa automáticamente y aparece en la lista
4. Selecciónala como activa con el botón de radio

### Estadísticas de efectividad

Cada vez que se usa una wordlist en una tarea, HashCrack registra:

- Número total de cracks atribuidos a esa wordlist
- Número total de intentos (tareas que la usaron)
- Tasa de éxito = `total_cracks / total_attempts × 100`
- Fecha del último uso

---

## Generador de hashes (CyberChef)

La pestaña **Cracker** incluye un panel con enlaces directos a [CyberChef](https://gchq.github.io/CyberChef/) para generar hashes de distintos tipos. Cada botón abre CyberChef en una nueva pestaña del navegador con la receta pre-cargada:

| Tipo | URL de CyberChef |
|---|---|
| MD5 | `https://gchq.github.io/CyberChef/#recipe=MD5()` |
| MD4 | `https://gchq.github.io/CyberChef/#recipe=MD4()` |
| SHA1 | `https://gchq.github.io/CyberChef/#recipe=SHA1()` |
| SHA-224 | `https://gchq.github.io/CyberChef/#recipe=SHA2('224')` |
| SHA-256 | `https://gchq.github.io/CyberChef/#recipe=SHA2('256')` |
| SHA-384 | `https://gchq.github.io/CyberChef/#recipe=SHA2('384')` |
| SHA-512 | `https://gchq.github.io/CyberChef/#recipe=SHA2('512')` |
| SHA3-256 | `https://gchq.github.io/CyberChef/#recipe=SHA3('256')` |
| SHA3-512 | `https://gchq.github.io/CyberChef/#recipe=SHA3('512')` |
| NT Hash | `https://gchq.github.io/CyberChef/#recipe=NT_Hash()` |
| LM Hash | `https://gchq.github.io/CyberChef/#recipe=LM_Hash()` |
| Bcrypt | `https://gchq.github.io/CyberChef/#recipe=Bcrypt(10)` |
| Whirlpool | `https://gchq.github.io/CyberChef/#recipe=Whirlpool()` |

> CyberChef se ejecuta enteramente en el navegador — no envía datos a ningún servidor.

---

## Internacionalización

La interfaz soporta **español** (por defecto) e **inglés**. El cambio se realiza desde el botón **ES/EN** en la barra de navegación y es instantáneo — no requiere recargar la página.

Todas las cadenas de texto están centralizadas en `frontend/src/i18n.js`. Para añadir un nuevo idioma, basta con añadir un nuevo bloque de traducciones en ese archivo.

---

## Tema claro / oscuro

La aplicación soporta dos temas visuales:

- **Tema oscuro** (por defecto) — paleta cyberpunk con fondos `#06060b`, acentos cyan y efectos de glow.
- **Tema claro** — fondos blancos/grises, texto oscuro, badges y acentos ajustados para contraste.

El cambio se realiza con el botón ☀/🌙 en la barra de navegación. El estado se mantiene en el store de Zustand y se aplica mediante el atributo `data-theme` en el `<html>`.

---

## API REST

El backend expone una API REST documentada en `http://localhost:8000/docs`.

### Endpoints principales

#### Detectar tipos de hash

```http
POST /api/detect
Content-Type: application/json

{
  "hashes": ["5f4dcc3b5aa765d61d8327deb882cf99", "anotherHash"]
}
```

Respuesta:

```json
[
  {
    "hash": "5f4dcc3b5aa765d61d8327deb882cf99",
    "detected_type": "md5",
    "confidence": 0.5,
    "variants": ["md5", "ntlm", "md4", "lm"],
    "hashcat_mode": "0"
  }
]
```

#### Iniciar tarea de cracking

```http
POST /api/crack
Content-Type: application/json

{
  "hashes": ["5f4dcc3b5aa765d61d8327deb882cf99"],
  "strategies": ["rainbow", "dictionary", "rules"],
  "wordlist_id": 1,
  "timeout": 300,
  "max_length": 12
}
```

Respuesta:

```json
{
  "task_id": "abc-123-def-456",
  "status": "queued",
  "total_hashes": 1,
  "wordlist_used": "rockyou.txt"
}
```

#### Seguimiento de progreso (WebSocket)

```
ws://localhost:8000/ws/{task_id}
```

Mensajes recibidos:

```json
{
  "status": "running",
  "total": 100,
  "processed": 47,
  "cracked": 12,
  "results": [
    {
      "hash": "5f4dcc3b...",
      "hash_type": "md5",
      "plaintext": "password",
      "strategy": "rainbow",
      "time_ms": 0.12
    }
  ]
}
```

El campo `status` puede ser: `queued`, `running`, `completed`, `stopped`.

#### Detener una tarea

```http
POST /api/crack/{task_id}/stop
```

#### Listar wordlists

```http
GET /api/wordlists
```

#### Listar categorías de wordlists

```http
GET /api/wordlists/categories
```

Devuelve un array de strings con las categorías disponibles: `["SecLists", "Metasploit", "Dirb", "Custom", ...]`

#### Escanear wordlists del sistema

```http
POST /api/wordlists/scan
```

#### Subir una wordlist

```http
POST /api/wordlists/upload
Content-Type: multipart/form-data

file=<archivo>
name=mi_wordlist (opcional)
```

#### Previsualizar wordlist

```http
GET /api/wordlists/{id}/preview?limit=100&offset=0
```

#### Eliminar wordlist

```http
DELETE /api/wordlists/{id}
```

#### Estadísticas globales

```http
GET /api/stats
```

#### Exportar resultados

```http
GET /api/results/export/json
GET /api/results/export/csv
GET /api/results/export/txt
GET /api/results/export/potfile
```

---

## Estructura del proyecto

```
HashCrack/
├── Dockerfile                     Imagen multi-stage (build + runtime)
├── docker-compose.yml             Despliegue con un solo comando
├── .dockerignore                  Exclusiones del build de Docker
├── backend/
│   ├── main.py                    Aplicación FastAPI, CORS, WebSocket, startup
│   ├── requirements.txt
│   └── app/
│       ├── config.py              Rutas base, directorios, constantes
│       ├── database.py            SQLite — init y helpers
│       ├── models.py              Modelos Pydantic (request/response)
│       ├── core/
│       │   ├── detector.py        Detección de 50+ tipos de hash + variantes
│       │   ├── cracker.py         Rainbow table, dictionary, rules attack
│       │   └── wordlist_manager.py Escaneo, registro, estadísticas
│       └── api/
│           ├── ws_manager.py      Gestor de conexiones WebSocket
│           └── routes/
│               ├── crack.py       /api/crack, /api/detect, /api/results/export
│               ├── wordlists.py   /api/wordlists (CRUD + upload + scan)
│               └── statistics.py  /api/stats, /api/tasks
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js             Proxy /api y /ws → localhost:8000
│   ├── tailwind.config.js         Paleta cyberpunk personalizada
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx               Entry point React
│       ├── App.jsx                Layout principal, 3 tabs, sincronización tema
│       ├── index.css              Clases Tailwind globales + overrides light mode
│       ├── i18n.js                Traducciones ES/EN (~100+ claves)
│       ├── store/
│       │   └── useStore.js        Estado global Zustand (tema, idioma, tarea, etc.)
│       └── components/
│           ├── Header.jsx         Barra de navegación + selector idioma + tema
│           ├── InputArea.jsx      Textarea + drag & drop + detección con variantes
│           ├── CrackingOptions.jsx Estrategias + selector de wordlist
│           ├── ProgressPanel.jsx   Botón inicio/parada + progreso live
│           ├── Results.jsx         Tabla de resultados + exportación
│           ├── HashGenerator.jsx   Generador de hashes → CyberChef
│           ├── WordlistManager.jsx Gestión completa de wordlists
│           └── StatsView.jsx       Estadísticas, filtros, hashes expandibles
│
├── data/
│   ├── wordlists/                 Wordlists personalizadas locales
│   ├── results/                   Exportaciones guardadas
│   ├── tmp/                       Archivos temporales (uploads)
│   └── hashcrack.db               Base de datos SQLite
│
├── install.bat                    Instalador Windows (nativo)
├── install.sh                     Instalador Linux/macOS (nativo)
├── start.bat                      Inicio Windows (nativo)
├── start.sh                       Inicio Linux/macOS (nativo)
└── docker-entrypoint.sh           Script de arranque para Docker
```

---

## Solución de problemas

### Docker: el contenedor no arranca

**Síntoma**: `docker compose up` falla durante el build.

**Solución**: asegúrate de tener Docker Engine 20.10+ y Docker Compose v2:

```bash
docker --version
docker compose version
```

Si cambias código, reconstruye:

```bash
docker compose up -d --build
```

---

### El backend no arranca (nativo)

**Síntoma**: error al ejecutar `uvicorn` o `python`.

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solución**: las dependencias no están instaladas.

```bat
cd backend
python -m pip install -r requirements.txt
```

Verifica que usas Python 3.10+:

```bash
python --version
```

---

### El frontend no arranca (nativo)

**Síntoma**: error `npm: command not found` o `Cannot find module`.

**Solución**:

```bash
node --version   # debe ser >= 18
npm --version    # debe ser >= 9

cd frontend
npm install
```

---

### "Wordlist file not found on disk"

**Causa**: la wordlist está registrada en la base de datos pero el archivo fue movido o eliminado.

**Solución**: elimina la entrada desde la pestaña **Wordlists** y vuelve a cargarla o a escanear.

---

### rockyou.txt no se detecta en Kali

**Causa**: el archivo está comprimido como `.gz`.

```bash
sudo gunzip /usr/share/wordlists/rockyou.txt.gz
```

Luego pulsa **Escanear Sistema** en la pestaña **Wordlists**.

---

### El cracking es muy lento

- Usa primero la estrategia **Rainbow Tables** (instantánea) — actívala en Opciones.
- Para contraseñas simples, `rockyou.txt` con **Dictionary** es suficiente y rápido.
- **Rules Attack** es más lento porque multiplica el espacio de búsqueda. Úsala cuando Dictionary falla.
- En equipos con pocos cores, reduce el número de hashes por lote.

---

### El WebSocket no conecta

**Causa**: el backend no está corriendo o hay un bloqueo de firewall local.

Verifica que el backend responde:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Asegúrate de que el backend se lanzó antes que el frontend.

---

### Error de permisos al leer una wordlist

```bash
# Linux/macOS
chmod +r /ruta/a/wordlist.txt

# O copia el archivo a data/wordlists/
cp /ruta/a/wordlist.txt data/wordlists/
```

---

### El tema claro no se aplica

**Causa**: si abres la app por primera vez, el tema por defecto es oscuro.

**Solución**: haz clic en el icono ☀/🌙 del header. El cambio es inmediato. El atributo `data-theme` del `<html>` controla los estilos.

---

## Aviso legal

Esta herramienta está diseñada para uso en entornos de seguridad autorizados: pruebas de penetración con permiso explícito, auditorías internas, recuperación de contraseñas propias y aprendizaje en laboratorios controlados. El uso contra sistemas sin autorización es ilegal. El autor no se responsabiliza del uso indebido.

---

## Licencia

MIT License — uso libre con atribución.
