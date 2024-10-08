const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._songs = [];
  }

  addSong({
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  }) {
    const id = nanoid(16);
 
    const newSong = {
      title, year, genre, performer, duration, id, albumId,
    };
 
    this._songs.push(newSong);

    const isSuccess = this._songs.filter((song) => song.id === id).length > 0;

    if (!isSuccess) {
      throw new InvariantError('Song gagal ditambahkan');
    }
 
    return id;
  }

  getSongs({ title, performer }) {
    let filteredSongs = this._songs;

    if (title) {
      filteredSongs = filteredSongs
        .filter((song) => song.title.toLowerCase().includes(title.toLowerCase()));
    }

    if (performer) {
      filteredSongs = filteredSongs
        .filter((song) => song.performer
          .toLowerCase()
          .includes(performer.toLowerCase()));
    }

    return filteredSongs.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
    }));
  }

  getSongsWithAlbumId() {
    return this._songs.map((song) => {
      const {
        id,
        title,
        performer,
        albumId,
      } = song;

      return {
        id,
        title,
        performer,
        albumId,
      };
    });
  }

  getSongById(id) {
    const song = this._songs.filter((n) => n.id === id)[0];
    if (!song) {
      throw new NotFoundError('Song tidak ditemukan');
    }
    return song;
  }
  
  editSongById(id, {
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  }) {
    const index = this._songs.findIndex((song) => song.id === id);
 
    if (index === -1) {
      throw new NotFoundError('Gagal memperbarui song. Id tidak ditemukan');
    }
 
    this._songs[index] = {
      ...this._songs[index],
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    };
  }

  deleteSongById(id) {
    const index = this._songs.findIndex((song) => song.id === id);
    if (index === -1) {
      throw new NotFoundError('Song gagal dihapus. Id tidak ditemukan');
    }
    this._songs.splice(index, 1);
  }
}

module.exports = SongsService;
