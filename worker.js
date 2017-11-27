
const fs = require('fs');

let file = process.argv[2];
let sec = Math.ceil(process.argv[3]);
console.log(rand());
fs.writeFile(file, `[ ${rand()}`, (err) => {
    if(err){
        console.log(err);
        return;
    }
    setInterval(
        () => {fs.appendFile(file, `, ${rand()}`, ()=>{});},
        sec*1000
    );
})

function rand() { return Math.round(Math.random() * 1000); }