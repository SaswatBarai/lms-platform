const fs = require('fs');

// Configuration - Update these IDs from your database
const DEPT_ID = process.env.DEPT_ID || "replace_with_valid_dept_id";
const BATCH_ID = process.env.BATCH_ID || "replace_with_valid_batch_id";
// SECTION_ID is now optional - sections will be auto-assigned based on gender balancing
const SECTION_ID = process.env.SECTION_ID || "";
const COUNT = parseInt(process.env.COUNT) || 5000;

console.log(`🔧 Configuration:
  Department ID: ${DEPT_ID}
  Batch ID: ${BATCH_ID}
  Section ID: ${SECTION_ID || "(auto-assign)"}
  Row Count: ${COUNT}
`);

if (DEPT_ID === "replace_with_valid_dept_id") {
    console.error(`
❌ ERROR: Please set valid IDs first!

Run these commands to get valid IDs from your database:

docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, name FROM \\"Department\\" LIMIT 5;"
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \\"batchYear\\" FROM \\"Batch\\" LIMIT 5;"

Optional (sections will be auto-assigned if not provided):
docker exec -it postgres_cont psql -U lms_user -d lms_db -c "SELECT id, \\"sectionNo\\" FROM \\"Section\\" LIMIT 5;"

Then run:
DEPT_ID=<dept_id> BATCH_ID=<batch_id> node generate-csv.js

Or with explicit section:
DEPT_ID=<dept_id> BATCH_ID=<batch_id> SECTION_ID=<section_id> node generate-csv.js
    `);
    process.exit(1);
}

const stream = fs.createWriteStream('students_5k.csv');
// sectionId is now optional in the CSV - will be auto-assigned if empty
stream.write('name,email,phone,gender,departmentId,batchId,sectionId\n');

const timestamp = Date.now();

// Generate unique phone numbers using timestamp + random suffix
const basePhone = timestamp % 10000000; // Use last 7 digits of timestamp as base

for (let i = 0; i < COUNT; i++) {
    const name = `Student_${i}`;
    const email = `student${i}_${timestamp}@test.com`;
    // Use truly unique phone: +91 + base from timestamp + sequential index
    const phone = `+91${7000000000 + basePhone + i}`;
    const gender = i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER');
    
    // sectionId can be empty - worker will auto-assign based on gender balancing
    stream.write(`${name},${email},${phone},${gender},${DEPT_ID},${BATCH_ID},${SECTION_ID}\n`);
}

stream.end();

stream.on('finish', () => {
    console.log(`✅ Generated students_5k.csv with ${COUNT} rows`);
    console.log(`📄 File: students_5k.csv`);
    if (!SECTION_ID) {
        console.log(`ℹ️  Section will be auto-assigned based on gender balancing and capacity`);
    }
});

stream.on('error', (err) => {
    console.error('❌ Error generating CSV:', err);
    process.exit(1);
});
