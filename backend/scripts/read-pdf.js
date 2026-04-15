const pdfParse = require('pdf-parse');
const fs = require('fs');

const pdfPath = '/Users/wuteng/Downloads/大厂秋招面试手撕SQL必刷30题-V1.0.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdfParse(dataBuffer).then(data => {
  console.log('=== PDF 内容 ===');
  console.log(data.text);
  console.log('\n=== 结束 ===');
}).catch(err => {
  console.error('Error:', err);
});
