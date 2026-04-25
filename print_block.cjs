const fs = require('fs');
const data = fs.readFileSync('src/components/views/TasksView.tsx', 'utf8');

const targetStr = '{isAdmin ? (\n                <div className="flex flex-col lg:flex-row gap-8 mb-8">';
const start = data.indexOf(targetStr);
const blockEnds = data.indexOf('              ) : (\n                <p className="text-gray-500 text-center text-sm font-bold mb-8 px-4">', start);
const block = data.substring(start, blockEnds);

console.log(block);
