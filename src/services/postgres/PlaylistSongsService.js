const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistSongsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addSongToPlaylist({ playlistId, songId }) {
    this.verifySongExist(songId);

    const id = `playlistsong-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongsFromPlaylist({ playlistId }) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer FROM playlistsongs 
      LEFT JOIN songs ON songs.id = playlistsongs.song_id 
      WHERE playlistsongs.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows;
  }

  async removeSongFromPlaylist({ playlistId, songId }) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifySongExist(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(playlistId, credentialId) {
    const query = {
      text: 'SELECT * FROM playlists where id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlists tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== credentialId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, credentialId) {
    try {
      await this.verifyPlaylistOwner(playlistId, credentialId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Playlists tidak ditemukan');
      }
      try {
        await this._collaborationService.verifyCollaborator(
          playlistId,
          credentialId,
        );
      } catch {
        throw new AuthorizationError(
          'Anda tidak berhak mengakses resource ini',
        );
      }
    }
  }
}

module.exports = PlaylistSongsService;
