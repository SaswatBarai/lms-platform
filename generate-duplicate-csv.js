const fs = require('fs');
const DEPT_ID = process.env.DEPT_ID;
const BATCH_ID = process.env.BATCH_ID;
const timestamp = Date.now();
const stream = fs.createWriteStream('duplicate.csv');
stream.write('name,email,phone,gender,departmentId,batchId\n');
for (let i = 0; i < 50; i++) {
    stream.write(`Duplicate Test ${i},duplicate${i}_${timestamp}@test.com,+919999999${String(i).padStart(3, '0')},${i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER')},${DEPT_ID},${BATCH_ID}\n`);
}
stream.end();
stream.on('finish', () => console.log('✅ Generated duplicate.csv with 50 rows'));
