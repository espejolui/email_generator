import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = process.env.PORT || 8000;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer(function (req, res) {
  let ruta;
  try {
    ruta = decodeURIComponent(req.url.split('?')[0]);
  } catch (err) {
    res.writeHead(400);
    res.end('Solicitud inválida');
    return;
  }
  if (ruta === '/') ruta = '/index.html';
  const archivo = path.normalize(path.join(RAIZ, ruta));
  if (archivo.indexOf(RAIZ) !== 0) {
    res.writeHead(403);
    res.end('Prohibido');
    return;
  }
  fs.readFile(archivo, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('No encontrado');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream'
    });
    res.end(data);
  });
}).listen(PUERTO, function () {
  console.log('Generador de email disponible en http://localhost:' + PUERTO + '/');
});