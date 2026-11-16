#!/usr/bin/env bash
# AC05 Mantenibilidad: cobertura del backend (node:test con cobertura de V8) y análisis estático con SonarQube Community en Docker.
# Las pruebas usan una base _test nueva. SonarQube se levanta en un contenedor temporal y se elimina al final.
# Uso: bash docs/06-pruebas-atributos-calidad/scripts/sonarqube.sh "$(pwd)"
set -u
RAIZ="$1"; OUT="$RAIZ/docs/06-pruebas-atributos-calidad/sonarqube/${2:-}"   # $2: subcarpeta de la corrida (opcional)
mkdir -p "$OUT"

# 1. Cobertura de las pruebas unitarias y de integración del backend.
BASE="qatu_cobertura_$(date +%s)_test"
docker exec qatu-local-db-1 psql -U qatu -d postgres -qc "CREATE DATABASE $BASE" || exit 1
docker exec qatu-local-db-1 psql -U qatu -d "$BASE" -qc "CREATE EXTENSION IF NOT EXISTS postgis" 2>/dev/null
export NODE_ENV=test DATABASE_URL="postgresql://qatu:qatu_local@127.0.0.1:5433/$BASE" TEST_DATABASE_URL="postgresql://qatu:qatu_local@127.0.0.1:5433/$BASE"
cd "$RAIZ/backend"
npm run -s migrate | tail -1
mkdir -p coverage
node --enable-source-maps --import tsx --test --test-concurrency=1 --experimental-test-coverage \
  --test-coverage-include='src/**' --test-coverage-exclude='test/**' \
  --test-reporter=spec --test-reporter-destination="$OUT/pruebas-con-cobertura.txt" \
  --test-reporter=lcov --test-reporter-destination=coverage/lcov.info \
  test/usuarios/*.test.ts test/proveedores/*.test.ts test/catalogo/*.test.ts test/reservas/*.test.ts test/pagos/*.test.ts test/resenas/*.test.ts
echo "pruebas con cobertura: código $?"
docker exec qatu-local-db-1 psql -U qatu -d postgres -qc "DROP DATABASE IF EXISTS $BASE WITH (FORCE)"
# Rutas del informe relativas a la raíz del repositorio, para que SonarQube (en Docker) las encuentre.
node -e "
const fs=require('fs'),path=require('path');const raiz=path.resolve('..');
const t=fs.readFileSync('coverage/lcov.info','utf8').replace(/^SF:(.*)$/gm,(_,p)=>'SF:'+path.relative(raiz,path.resolve(p)).split(path.sep).join('/'));
fs.writeFileSync('coverage/lcov.info',t);"

# 2. SonarQube Community en un contenedor temporal (desde aquí, Git Bash no debe convertir las rutas que recibe Docker).
export MSYS_NO_PATHCONV=1
docker network create qatu-sonar >/dev/null 2>&1
docker rm -f qatu-sonarqube >/dev/null 2>&1
docker run -d --name qatu-sonarqube --network qatu-sonar -p 127.0.0.1:9000:9000 sonarqube:community >/dev/null
until curl -s http://127.0.0.1:9000/api/system/status | grep -q '"status":"UP"'; do sleep 5; done
CLAVE=$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url')+'Aa1!')")
curl -s -u admin:admin -X POST "http://127.0.0.1:9000/api/users/change_password" --data-urlencode "login=admin" --data-urlencode "previousPassword=admin" --data-urlencode "password=$CLAVE"
TOKEN=$(curl -s -u "admin:$CLAVE" -X POST "http://127.0.0.1:9000/api/user_tokens/generate" --data-urlencode "name=qatu" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")
RAIZ_W=$(cygpath -w "$RAIZ")
docker run --rm --network qatu-sonar -v "$RAIZ_W:/usr/src" -e SONAR_HOST_URL=http://qatu-sonarqube:9000 -e SONAR_TOKEN="$TOKEN" sonarsource/sonar-scanner-cli \
  -Dsonar.projectKey=qatu -Dsonar.projectName=Qatu \
  -Dsonar.sources=backend/src,frontend/src -Dsonar.tests=backend/test,frontend/tests \
  -Dsonar.exclusions='**/node_modules/**,**/*.css,**/*.svg' \
  -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info \
  -Dsonar.coverage.exclusions='frontend/**' \
  -Dsonar.qualitygate.wait=true -Dsonar.scm.disabled=true -Dsonar.working.directory=/tmp/scannerwork > "$OUT/escaner.txt" 2>&1
echo "análisis: código $? (detalle en sonarqube/escaner.txt)"

# 3. Métricas e incidencias.
M=coverage,line_coverage,branch_coverage,duplicated_lines_density,duplicated_blocks,ncloc,bugs,vulnerabilities,security_hotspots,code_smells,reliability_rating,security_rating,sqale_rating,sqale_index,cognitive_complexity
curl -s -u "$TOKEN:" "http://127.0.0.1:9000/api/measures/component?component=qatu&metricKeys=$M" > "$OUT/metricas.json"
curl -s -u "$TOKEN:" "http://127.0.0.1:9000/api/qualitygates/project_status?projectKey=qatu" > "$OUT/puerta-de-calidad.json"
curl -s -u "$TOKEN:" "http://127.0.0.1:9000/api/issues/search?componentKeys=qatu&resolved=false&ps=500&facets=severities,types,rules" > "$OUT/incidencias.json"
curl -s -u "$TOKEN:" "http://127.0.0.1:9000/api/hotspots/search?projectKey=qatu&ps=500" > "$OUT/puntos-sensibles.json"
curl -s -u "$TOKEN:" "http://127.0.0.1:9000/api/measures/component_tree?component=qatu&metricKeys=coverage,duplicated_lines_density,ncloc&qualifiers=DIR&ps=500" > "$OUT/por-carpeta.json"
curl -s "http://127.0.0.1:9000/api/server/version" > "$OUT/version-sonarqube.txt"
cp "$RAIZ/backend/coverage/lcov.info" "$OUT/lcov-backend.info"
docker rm -f qatu-sonarqube >/dev/null; docker network rm qatu-sonar >/dev/null
echo "listo"
