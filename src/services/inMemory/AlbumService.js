const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(songsService) {
    this._albums = [];
    this._songsService = songsService;
  }

  getSongsFromSongsService() {
    return this._songsService.getSongsWithAlbumId();
  }

  addAlbum({ name, year }) {
    const id = nanoid(16);
 
    const newAlbum = {
      name, year, id,
    };
 
    this._albums.push(newAlbum);

    const isSuccess = this._albums.filter((album) => album.id === id).length > 0;

    if (!isSuccess) {
      throw new InvariantError('Album gagal ditambahkan');
    }
 
    return id;
  }

  getAlbumById(id) {
    const songsFromSongsService = this.getSongsFromSongsService();
    const album = this._albums.filter((n) => n.id === id)[0];
    
    if (!album) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return {
      ...album,
      songs: songsFromSongsService.filter((song) => song.albumId === album.id)
    };
  }
  
  editAlbumById(id, { name, year }) {
    const index = this._albums.findIndex((album) => album.id === id);
 
    if (index === -1) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
 
    this._albums[index] = {
      ...this._albums[index],
      name,
      year,
    };
  }

  deleteAlbumById(id) {
    const index = this._albums.findIndex((album) => album.id === id);
    if (index === -1) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
    this._albums.splice(index, 1);
  }
}

module.exports = AlbumsService;
