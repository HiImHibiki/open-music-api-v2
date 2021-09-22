const SongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'music player',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const notesHandler = new SongsHandler(service, validator);
    server.route(routes(notesHandler));
  },
};
