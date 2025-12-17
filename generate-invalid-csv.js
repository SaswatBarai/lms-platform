const fs = require('fs');

// Configuration
const DEPT_ID = process.env.DEPT_ID || "replace_with_valid_dept_id";
const BATCH_ID = process.env.BATCH_ID || "replace_with_valid_batch_id";
const SECTION_ID = process.env.SECTION_ID || "replace_with_valid_section_id";

console.log('🔧 Generating invalid.csv for error testing...');

const stream = fs.createWriteStream('invalid.csv');
stream.write('name,email,phone,gender,departmentId,batchId,sectionId,regNo\n');

const timestamp = Date.now();

// Row 1: Valid
stream.write(`Valid User,valid${timestamp}@test.com,+919999999999,MALE,${DEPT_ID},${BATCH_ID},${SECTION_ID},REGVALID${timestamp}\n`);

// Row 2: Invalid email
stream.write(`Invalid Email,invalid-email,+919999999998,MALE,${DEPT_ID},${BATCH_ID},${SECTION_ID},REGINV1${timestamp}\n`);

// Row 3: Invalid phone (too short)
stream.write(`Invalid Phone,valid2${timestamp}@test.com,+910000,FEMALE,${DEPT_ID},${BATCH_ID},${SECTION_ID},REGINV2${timestamp}\n`);

// Row 4: Invalid gender
stream.write(`Invalid Gender,valid3${timestamp}@test.com,+919999999997,INVALID,${DEPT_ID},${BATCH_ID},${SECTION_ID},REGINV3${timestamp}\n`);

// Row 5: Missing required field (no name)
stream.write(`,valid4${timestamp}@test.com,+919999999996,MALE,${DEPT_ID},${BATCH_ID},${SECTION_ID},REGINV4${timestamp}\n`);

stream.end();

stream.on('finish', () => {
    console.log('✅ Generated invalid.csv');
    console.log('   - 1 valid row');
    console.log('   - 4 invalid rows (email, phone, gender, missing name)');
});

