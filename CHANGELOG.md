# Changelog

## v2.0 — 2026-03-30

### Nuevas funcionalidades
- **Cracking NTLMv1/NTLMv2**: soporte completo para hashes de challenge-response Net-NTLM (modo 5500/5600). Pipeline dedicado con verificación HMAC-MD5 (v2) y DES (v1).
- **Buscador en selector de wordlists**: el desplegable de wordlists en el panel de métodos de cracking ahora incluye un campo de búsqueda con filtrado por nombre, ruta y categoría.
- **Progreso real por fases**: la barra de progreso refleja el avance real proporcional al trabajo estimado de cada fase (rainbow, diccionario, reglas, fuerza bruta), avanzando de forma monotónica de 0% a 100%.

### Mejoras
- **Iconos Phosphor**: migración completa de `lucide-react` a `@phosphor-icons/react` en los 9 componentes de la interfaz (36 iconos reemplazados).
- **Pesos proporcionales de progreso**: cada fase del cracking se pondera según el número estimado de candidatos a probar, evitando saltos bruscos o retrocesos en la barra de progreso.
- **Traducciones i18n**: añadidas etiquetas para la fase `Net-NTLM` en español e inglés.

### Correcciones
- Corregido el progreso que saltaba al 50% instantáneamente y luego avanzaba muy lento.
- Corregido el progreso que se reiniciaba a 0% al cambiar de fase.
- Eliminada dependencia `lucide-react`.

---

## v1.0

- Versión inicial.
- Detección automática de tipo de hash (MD5, SHA1, SHA256, SHA512, NTLM, bcrypt, etc.).
- Cracking multi-hilo con estrategias: rainbow tables, diccionario, reglas y fuerza bruta.
- Generador de hashes.
- Gestor de wordlists con escaneo de categorías.
- Interfaz web con progreso en tiempo real vía WebSocket.
- Soporte Docker.
- 100% offline.
