import http from 'http';
import app from './app';

const server = http.createServer(app);

server.listen(app.get('port'), () => {
  console.log(`App is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`);
});

export default server;
