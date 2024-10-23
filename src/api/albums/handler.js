class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);

    this.postLikesAlbumByIdHandler = this.postLikesAlbumByIdHandler.bind(this);
    this.getAlbumLikeCountHandler = this.getAlbumLikeCountHandler.bind(this);
    this.deleteLikesAlbumByIdHandler = this.deleteLikesAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._service.editAlbumById(id, request.payload);
    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postLikesAlbumByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.postLikesAlbumById(id, credentialId);

    return {
      status: 'success',
      message: 'Album berhasil disukai',
    };
  }

  async getAlbumLikeCountHandler(request) {
    const { id } = request.params;
    const likes = await this._service.getAlbumLikeCount(id);

    return {
      status: 'success',
      data: {
        likes,
      },
    };
  }

  async deleteLikesAlbumByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.deleteLikesAlbumById(id, credentialId);

    return {
      status: 'success',
      message: 'Menyukai Album berhasil dibatalkan',
    };
  }
}

module.exports = AlbumsHandler;
