#!/usr/bin/env bash
# Corre backend (node:test) y todas las suites de Playwright como en CI, en una base _test nueva
# y con el backend de prueba en 3401, sin tocar los servidores ni la base de desarrollo.
set -u
RAIZ="$1"; OUT="$RAIZ/docs/06-pruebas-atributos-calidad"
mkdir -p "$OUT/backend" "$OUT/playwright"
BASE="qatu_calidad_$(date +%s)_test"
docker exec qatu-local-db-1 psql -U qatu -d postgres -qc "CREATE DATABASE $BASE" || exit 1
docker exec qatu-local-db-1 psql -U qatu -d "$BASE" -qc "CREATE EXTENSION IF NOT EXISTS postgis" 2>/dev/null
export DATABASE_URL="postgresql://qatu:qatu_local@127.0.0.1:5433/$BASE" TEST_DATABASE_URL="postgresql://qatu:qatu_local@127.0.0.1:5433/$BASE"
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") DOCUMENTOS_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export APP_ORIGIN=http://127.0.0.1:3100 QATU_E2E_API_PORT=3401 QATU_TEST_PORT=3300

cd "$RAIZ/backend"
npm run -s migrate | tail -1
# Las suites arrancan el backend desde dist/ (npm run start): se compila para probar el código actual.
npm run -s build && echo "backend compilado"
# El backend (node:test) usa su propia base, como en CI; aquí solo los recorridos de navegador.
# El frontend consulta la API desde el servidor en tiempo de ejecución: QATU_API_URL debe apuntar al backend de prueba.
export QATU_API_URL=http://127.0.0.1:3401

cd "$RAIZ/frontend"
npx next build > /dev/null 2>&1 && echo "frontend compilado"
for s in test test:acceso test:usuarios test:proveedores test:catalogo test:reservas test:pagos test:resenas; do
  nombre=$( [ "$s" = test ] && echo descubrimiento || echo "${s#test:}" )
  echo "== playwright: $nombre"
  PLAYWRIGHT_JSON_OUTPUT_NAME="$OUT/playwright/$nombre.json" npx playwright test $(node -e "const s=require('./package.json').scripts['$s'];console.log(s.replace(/^playwright test ?/,''))") \
    --reporter=list,json --output="$RAIZ/frontend/test-results/calidad-$nombre" > "$OUT/playwright/$nombre.txt" 2>&1
  grep -E "^\s+[0-9]+ (passed|failed|flaky|skipped)" "$OUT/playwright/$nombre.txt" | tr '\n' ' '; echo
done
docker exec qatu-local-db-1 psql -U qatu -d postgres -qc "DROP DATABASE IF EXISTS $BASE WITH (FORCE)" && echo "base $BASE eliminada"
