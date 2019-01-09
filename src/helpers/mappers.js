'use strict';
require('../sentry');

exports.currentPlaybackToView = function(data) {
  const albumImage = data.item.album.images[0];
  const albumImageSrc = albumImage ? albumImage.url : '';
  const artistName = data.item.artists.map(artist => artist.name).join(', ');

  return {
    albumImageSrc,
    albumName: data.item.album.name,
    artistName,
    musicName: data.item.name,
    musicDuration: data.item.duration_ms,
    currentProgress: data.progress_ms,
    isPlaying: data.is_playing,
    shuffleState: data.shuffle_state,
    currentlyPlayingType: data.currently_playing_type,
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

exports.notificationData = function(data) {
  const artistName = data.item.artists.map(artist => artist.name).join(', ');
    
  return {
    title: data.item.name,
    subtitle: artistName, 
    message: data.item.album.name,
    group: 'Spotify',
    remove: 'ALL',
    sender: 'com.spotify.client'
  };
}
