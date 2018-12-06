'use strict';

exports.currentPlaybackToView = function(data) {
  const albumImage = data.item.album.images[0];
  const albumImageSrc = albumImage ? albumImage.url : '';

  return {
    albumImageSrc,
    albumName: data.item.album.name,
    artistName: data.item.artists[0].name,
    musicName: data.item.name,
    musicDuration: data.item.duration_ms,
    currentProgress: data.progress_ms,
    isPlaying: data.is_playing,
    uri: data.item.uri
  };
};

exports.playlistsToView = function(data) {
  if(!Array.isArray(data)) return;
  return data.map(item => ({
    name: item.name,
    id: item.id
  }));
};
