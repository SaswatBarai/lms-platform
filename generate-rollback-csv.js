const fs = require('fs');
const DEPT_ID = process.env.DEPT_ID;
const BATCH_ID = process.env.BATCH_ID;
const timestamp = Date.now();
const stream = fs.createWriteStream('rollback.csv');
stream.write('name,email,phone,gender,departmentId,batchId\n');
for (let i = 0; i < 100; i++) {
    stream.write(`Rollback Test ${i},rollback${i}_${timestamp}@test.com,+919999999${String(i).padStart(3, '0')},${i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER')},${DEPT_ID},${BATCH_ID}\n`);
}
stream.end();
stream.on('finish', () => console.log('✅ Generated rollback.csv with 100 rows'));
