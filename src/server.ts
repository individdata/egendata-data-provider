import errorHandler from 'errorhandler';
import http from 'http';

import app from './app';

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

const server = http.createServer(app);

/**
 * Start Express server.
 */
server.listen(app.get('port'), () => {
  console.log(
    '  App is running at http://localhost:%d in %s mode',
    app.get('port'),
    app.get('env'),
  );
  console.log('  Press CTRL-C to stop\n');
});

export default server;
