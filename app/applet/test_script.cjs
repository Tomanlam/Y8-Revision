const score = "2 of 2";
const parts = score.toString().split(/\s*(?:\/|of)\s*/i);
console.log(parts);
