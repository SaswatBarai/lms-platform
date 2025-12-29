const fs = require('fs');

// Department IDs from database
const DEPT_IDS = [
    "cmjrbvjz10005nv2nu499n5af", // Computer Science
    "cmjrbvjz10006nv2nd0eel2hb", // Electrical Engineering
    "cmjrbvjz10007nv2nz56hcmct", // Mechanical Engineering
    "cmjrbvjz10008nv2n2iph8zv2", // Civil Engineering
    "cmjrbvjz10009nv2n265kdzwd"  // ECE
];

const COUNT = parseInt(process.env.COUNT) || 100;
const timestamp = Date.now();

const stream = fs.createWriteStream('teachers_bulk.csv');
stream.write('name,email,phone,gender,departmentId,employeeNo\n');

for (let i = 0; i < COUNT; i++) {
    const name = `Dr. Teacher_${i}`;
    const email = `teacher${i}_${timestamp}@college.edu`;
    const phone = `+91${8000000000 + i}`;
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const deptId = DEPT_IDS[i % DEPT_IDS.length];
    const employeeNo = `EMP${timestamp}${String(i).padStart(4, '0')}`;
    
    stream.write(`${name},${email},${phone},${gender},${deptId},${employeeNo}\n`);
}

stream.end();
stream.on('finish', () => console.log(`✅ Generated teachers_bulk.csv with ${COUNT} rows`));
