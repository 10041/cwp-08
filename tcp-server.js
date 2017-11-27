const path = require('path');
const net = require('net');
const fs = require('fs');
const child_process = require('child_process');
const guid = require("guid");
const moment = require("moment");

const port = 4000;
let workers = [];

const server = net.createServer((client) => {
    console.log('New client connected');

    client.on('data', handler);
    client.on('end', () => console.log(`Client ${client.id} disconnected`));

    function handler(data, error) {
        if (!error) {
            data = JSON.parse(data);
            handlers[data.action](data, client);
        }
        else console.error(error);
    }
});

server.listen(port, () => {
    console.log(`Server listening on localhost:${port}`);
});


const handlers = {
    "getWorkers" : async (data, client) => {
        let res = await getWorkers();
        res["action"] = "getWorkers";
        client.write(JSON.stringify(res));
    },
    "add" : (data, client) => {
        if(runWorker(data.x, client)){
            client.write(JSON.stringify({
                "action": "add",
                "id": workers[workers.length - 1].pid,
                "date": workers[workers.length - 1].startedOn,
            }));
        }
    },
    "remove" : async (data, client) => {
        let index = workers.findIndex(worker => worker.pid == data["id"]);
        let numbers = await getNumbers(workers[index]);
        const message = {
            "action": "remove",
            "id": workers[index].pid,
            "date": workers[index].startedOn,
            "numbers": numbers,
        }
        let fileName = workers[index].filename;
        fs.appendFile(workers[index].filename, "]", () => {});
        process.kill(workers[index].pid);
        workers.splice(index, 1);
        fs.unlink(fileName, () => {})
        client.write(JSON.stringify(message));
    }
}

function runWorker(interval, client) {
    if(isNaN(Number(interval)) || interval <= 0) {
        client.write(JSON.stringify({ "action": "exit" }));
        return false;
    }
    let filename = `./workers/${guid.create().value}.json`;
    let worker = child_process.spawn('node', ['worker.js', filename, interval]);
    worker.startedOn = moment().format();
    worker.filename = filename;
    workers.push(worker);
    return true;
}

async function getWorkers() {
    return new Promise(async (resolve) => {
        let res = [];
        for (i = 0; i < workers.length; i++) {
            let numbers = await getNumbers(workers[i]);
            res.push({
                "id" : workers[i].pid,
                "startedOn" : workers[i].startedOn,
                "numbers" : numbers,
            });
        }
        resolve({ "array": res });
    })
}

function getNumbers(worker) {
    return new Promise((resolve, reject) => {
        fs.readFile(worker.filename, (error, data) => {
            if (!error) {
                resolve(data + "]");
            }
            else {
                reject(error);
            }
        })
    })
}