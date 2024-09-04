require('dotenv').config();

const Hapi = require('@hapi/hapi');
const albums = require('./api/albums');
// const AlbumService = require('./services/postgres/AlbumService');
const AlbumService = require('./services/inMemory/AlbumService');
const AlbumsValidator = require('./validator/albums');
const songs = require('./api/songs');
// const SongService = require('./services/postgres/SongService');
const SongService = require('./services/inMemory/SongService');
const SongsValidator = require('./validator/songs');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const songsService = new SongService();
  const albumsService = new AlbumService(songsService);
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;
  
    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }
      
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
