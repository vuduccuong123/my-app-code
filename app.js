const http = require('http');
const port = 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello! App chay tu Nexus qua ArgoCD thanh cong!');
});
server.listen(port, () => {
  console.log(`Server chạy tại port ${port}`);
});