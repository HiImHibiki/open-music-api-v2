const Joi = require('joi');

const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(2021)
    .required(),
  performer: Joi.string().required(),
  genre: Joi.string(),
  duration: Joi.number(),
});

const SongToPlaylistPayloadSchema = Joi.object({
  songId: Joi.string().required(),
});

module.exports = { SongPayloadSchema, SongToPlaylistPayloadSchema };
