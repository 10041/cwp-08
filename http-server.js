const http = require('http');
const net = require('net');

const hostname = '127.0.0.1';
const port = 3000;
const tcp_port = 4000;
const connection = new net.Socket();

connection.connect(tcp_port, hostname, () => {
    console.log('Connected to the TCP server');
});


const handlers = {
    '/workers': (req, res, payload, cb) => {
        connection.write(JSON.stringify({
            "action":"getWorkers"
        }));
        connection.on("data", (data, err) => {
            if(!err){
                data = JSON.parse(data);
                //console.log(data);
                if(data.action === "getWorkers"){
                    cb(null, data.array)
                }
            }
            else console.log(err);
        }) 
    },
    '/workers/add': (req, res, payload, cb) => {
        if(payload.x !== undefined){
            connection.write(JSON.stringify({
                "action":"add",
                "x":payload.x
            }));
            connection.on('data', (data, err) => {
                if(!err){
                    data = JSON.parse(data);
                    if (data.action === "add") {
                        cb(null, {
                            "id": data.id,
                            "startedOn": data.date,
                        });
                    }
                    else cb({code: 406, message: 'Incorrect arg'});
                }
                else console.log(err);
            })
        }
        else cb({code: 405, message: 'Incorrect param'});
    },
    '/workers/remove': (req, res, payload, cb) => {
        if(payload.id !== undefined){
            connection.write(JSON.stringify({
                "action": "remove",
                "id": payload.id,
            }));
            connection.on('data', (data, error) => {
                if (!error) {
                    data = JSON.parse(data);
                    if (data.action === "remove") {
                        cb(null, {
                            "id": data.id,
                            "startedOn": data.date,
                            "numbers": data.numbers,
                        });
                    }
                }
                else console.error(error);
            });
        }
        else cb({ "code": 405, "message": 'Worker not found' });
    }
}


const server = http.createServer((req, res) => {
    parseBodyJson(req, (err, payload) => {
        const handler = getHandler(req.url);
        handler(req, res, payload, (err, result) => {
            if (err) {
                res.writeHead(err.code, {'Content-Type' : 'application/json'});
                res.end( JSON.stringify(err) );
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result, null, "\t"));
        });
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url) {
    return handlers[url] || notFound;
}

function notFound(req, res, payload, cb) {
    cb({"code": 404, "message": 'Not found'});
}

function parseBodyJson(req, cb) {
    let body = [];
    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        if (body !== "") {
            params = JSON.parse(body);
            cb(null, params);
        }
        else {
            cb(null, null);
        }
    });
}