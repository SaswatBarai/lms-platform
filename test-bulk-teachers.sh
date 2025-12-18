#!/bin/bash

# ===========================
# CONFIGURATION
# ===========================
BASE_URL="http://localhost:8000"

TOKEN="v4.public.eyJpZCI6ImNtajh5dHgxMTAwMDBwOTM4anFkZGcwcWEiLCJlbWFpbCI6ImpvaG4uZG9lQGNvbGxlZ2UuZWR1IiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InN0dWRlbnRzZWN0aW9uIiwidHlwZSI6Im5vbi10ZWFjaGluZy1zdGFmZiIsImNvbGxlZ2VJZCI6ImNtajh4bXRlaDAwMDFvZzJrMzV3Z2RnbGQiLCJvcmdhbml6YXRpb25JZCI6ImNtajh2OWpyOTAwMDBqejJyMTV0Ymg5NjkiLCJzZXNzaW9uSWQiOiI1OGU0MDYxODhkMjc4N2Q4OWUwN2QzMDgzNGIxZDRmZCIsImlhdCI6IjIwMjUtMTItMTdUMTc6NTk6MDguOTczWiIsImV4cCI6MTc2NjA4MDc0OCwiaXNzIjoibG1zLWF1dGgtc2VydmljZSIsImF1ZCI6Imxtcy1wbGF0Zm9ybSJ9FwCJdY36Ajipb9gt9DzQIfXfHDBQQmhtYcml7Bq6hE7K2U9QCKLMMIhtFTX3Ji7m3WBgRJXQfn590MtDHpASDg"

COLLEGE_ID="cmj8xmteh0001og2k35wgdgld"
TOTAL_TEACHERS=25   # change if needed

# ===========================
# DEPARTMENT IDS (RANDOM)
# ===========================
DEPARTMENTS=(
  "cmj8z6xg50002p938jplx0ay5"
  "cmj8z6xg50003p938js2ecaxf"
  "cmj8z6xg50004p938exiktsg0"
  "cmj8z6xg50005p93866e4vyyo"
  "cmj8z6xg50006p938xfhg77f5"
  "cmj8z6xg50007p938kcr86p0g"
  "cmj8z6xg50008p938xbh9bgpz"
  "cmj8z6xg50009p938i1x6jig9"
  "cmj8z6xg5000cp938wmhp1k8a"
)

# ===========================
# BUILD TEACHERS JSON
# ===========================
TEACHERS="["

for i in $(seq 1 $TOTAL_TEACHERS); do

  # Random gender
  if (( RANDOM % 2 == 0 )); then
    GENDER="MALE"
  else
    GENDER="FEMALE"
  fi

  # Random department
  DEPT_INDEX=$((RANDOM % ${#DEPARTMENTS[@]}))
  DEPARTMENT_ID=${DEPARTMENTS[$DEPT_INDEX]}

  TEACHERS+=$(cat <<EOF
{
  "name": "Dr. Teacher $i",
  "email": "teacher$i@college.edu",
  "phone": "+919700000$(printf "%03d" $i)",
  "gender": "$GENDER",
  "departmentId": "$DEPARTMENT_ID"
}
EOF
)

  if [ "$i" -lt "$TOTAL_TEACHERS" ]; then
    TEACHERS+=","
  fi
done

TEACHERS+="]"

# ===========================
# API CALL
# ===========================
# Create temporary JSON file to avoid shell escaping issues
TEMP_JSON=$(mktemp)
cat > "$TEMP_JSON" <<EOF
{
  "collegeId": "${COLLEGE_ID}",
  "teachers": ${TEACHERS}
}
EOF

curl -X POST "${BASE_URL}/auth/api/create-teacher-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "@${TEMP_JSON}"

# Cleanup
rm -f "$TEMP_JSON"

