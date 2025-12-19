const fs = require('fs');
const DEPT_ID = process.env.DEPT_ID || "replace_with_valid_dept_id";
const BATCH_ID = process.env.BATCH_ID || "replace_with_valid_batch_id";
const timestamp = Date.now();
const stream = fs.createWriteStream('partial.csv');
stream.write('name,email,phone,gender,departmentId,batchId\n');

// 100 valid rows
for (let i = 0; i < 100; i++) {
    stream.write(`Valid User ${i},valid${i}_${timestamp}@test.com,+919999999${String(i).padStart(3, '0')},${i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER')},${DEPT_ID},${BATCH_ID}\n`);
}

// 50 invalid rows
for (let i = 0; i < 50; i++) {
    if (i % 3 === 0) {
        // Invalid email
        stream.write(`Invalid Email ${i},invalid-email-${i},+919999999${String(i).padStart(3, '0')},MALE,${DEPT_ID},${BATCH_ID}\n`);
    } else if (i % 3 === 1) {
        // Invalid gender
        stream.write(`Invalid Gender ${i},invalid${i}_${timestamp}@test.com,+919999999${String(i).padStart(3, '0')},INVALID,${DEPT_ID},${BATCH_ID}\n`);
    } else {
        // Missing name
        stream.write(`,missing${i}_${timestamp}@test.com,+919999999${String(i).padStart(3, '0')},FEMALE,${DEPT_ID},${BATCH_ID}\n`);
    }
}

stream.end();
stream.on('finish', () => {
    console.log('✅ Generated partial.csv');
    console.log('   - 100 valid rows');
    console.log('   - 50 invalid rows');
});
