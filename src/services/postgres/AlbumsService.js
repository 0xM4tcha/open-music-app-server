const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
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

  async postLikesAlbumById(albumId, credentialId) {
    const queryForCheck = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const resultCheck = await this._pool.query(queryForCheck);

    if (!resultCheck.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const isAlreadyLike = resultCheck.rows[0]?.likes?.includes(credentialId) || false;

    if (isAlreadyLike) {
      throw new InvariantError('Gagal menyukai, Album sudah disukai');
    }

    const queryForUpdate = {
      text: 'UPDATE albums SET likes = array_append(likes, $2) WHERE id = $1 RETURNING *',
      values: [albumId, credentialId],
    };

    await this._cacheService.delete(`likes:${albumId}`);
    await this._pool.query(queryForUpdate);
  }

  async getAlbumLikeCount(albumId) {
    let isCache = false;
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      
      isCache = true;

      return {
        likes: JSON.parse(result),
        isCache,
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [albumId],
      };
  
      const result = await this._pool.query(query);
  
      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const likes = result.rows[0]?.likes?.length || 0;

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(likes));
  
      return {
        likes,
        isCache,
      };
    }
  }

  async deleteLikesAlbumById(albumId, credentialId) {
    const queryForCheck = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const resultCheck = await this._pool.query(queryForCheck);

    if (!resultCheck.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const queryForUpdate = {
      text: 'UPDATE albums SET likes = array_remove(likes, $2) WHERE id = $1 RETURNING *',
      values: [albumId, credentialId],
    };

    await this._cacheService.delete(`likes:${albumId}`);
    await this._pool.query(queryForUpdate);
  }
}

module.exports = AlbumService;
