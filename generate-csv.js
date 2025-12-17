const fs = require('fs');

// Configuration - Update these IDs from your database
const DEPT_ID = process.env.DEPT_ID || "replace_with_valid_dept_id";
const BATCH_ID = process.env.BATCH_ID || "replace_with_valid_batch_id";
const SECTION_ID = process.env.SECTION_ID || "replace_with_valid_section_id";
const COUNT = parseInt(process.env.COUNT) || 5000;

console.log(`🔧 Configuration:
  Department ID: ${DEPT_ID}
  Batch ID: ${BATCH_ID}
  Section ID: ${SECTION_ID}
  Row Count: ${COUNT}
`);

if (DEPT_ID === "replace_with_valid_dept_id") {
    console.error(`
❌ ERROR: Please set valid IDs first!

Run these commands to get valid IDs from your database:

docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, name FROM \\"Department\\" LIMIT 5;"
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \\"batchYear\\" FROM \\"Batch\\" LIMIT 5;"
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \\"sectionNo\\" FROM \\"Section\\" LIMIT 5;"

Then run:
DEPT_ID=<dept_id> BATCH_ID=<batch_id> SECTION_ID=<section_id> node generate-csv.js
    `);
    process.exit(1);
}

const stream = fs.createWriteStream('students_5k.csv');
stream.write('name,email,phone,gender,departmentId,batchId,sectionId,regNo\n');

const timestamp = Date.now();

for (let i = 0; i < COUNT; i++) {
    const name = `Student_${i}`;
    const email = `student${i}_${timestamp}@test.com`;
    const phone = `+91${9000000000 + i}`;
    const gender = i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER');
    const regNo = `REG${timestamp}${String(i).padStart(5, '0')}`;
    
    stream.write(`${name},${email},${phone},${gender},${DEPT_ID},${BATCH_ID},${SECTION_ID},${regNo}\n`);
}

stream.end();

stream.on('finish', () => {
    console.log(`✅ Generated students_5k.csv with ${COUNT} rows`);
    console.log(`📄 File: students_5k.csv`);
});

stream.on('error', (err) => {
    console.error('❌ Error generating CSV:', err);
    process.exit(1);
});

