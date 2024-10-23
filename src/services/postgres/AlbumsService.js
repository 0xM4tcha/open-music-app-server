const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
 
    return result.rows[0].id;
  }

  async getAlbumById(albumId) {
    const query = `SELECT 
            albums.id AS id,
            albums.name AS name,
            albums.year AS year,
            albums.cover_url AS cover_url,
            songs.id AS song_id,
            songs.title AS song_title,
            songs.performer AS song_performer
          FROM 
              albums
          LEFT JOIN 
              songs 
          ON 
              albums.id = songs.album_id
          WHERE 
            albums.id = $1;`;

    const { rows } = await this._pool.query(query, [albumId]);

    if (!rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = {
      id: rows[0].id,
      name: rows[0].name,
      year: rows[0].year,
      coverUrl: rows[0].cover_url,
      songs: [],
    };

    rows.forEach((row) => {
      if (row.song_id) {
        album.songs.push({
          id: row.song_id,
          title: row.song_title,
          performer: row.song_performer,
        });
      }
    });
    
    return album;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
 
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
  }

  async editAlbumCoverUrl(id, coverUrl) {
    try {
      const query = {
        text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
        values: [coverUrl, id],
      };

      await this._pool.query(query);
    } catch (error) {
      console.log('fail update cover_url to album', error);
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumService;
