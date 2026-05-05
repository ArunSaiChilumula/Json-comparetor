import fs from 'fs';
const buf = fs.readFileSync('./src/App.jsx');
console.log('First 30 bytes:', buf.subarray(0,30).map(b=>b.toString(16).padStart(2,'0')).join(' '));
console.log('Is valid UTF-8?', buf.toString('utf8',0,100).includes('import'));
