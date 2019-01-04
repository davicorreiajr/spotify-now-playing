'use strict';
const localStorage = require('../data-source/local-storage');
const spotifyDataSource = require('../data-source/spotify-datasource');
const subjectFactory = require('../helpers/subject-factory');
const { SPOTIFY_SCOPES } = require('../helpers/constants');
const errorReporter = require('../helpers/error-reporter');

let authorizing;

exports.execute = function() {
  if(authorizing) return;

  authorizing = true;
  const subject = subjectFactory.get();
  const accessToken = localStorage.get('accessToken');

  if(accessToken && areSavedScopesEnough()) {
    getCurrentUser(accessToken);
  } else {
    console.log('else');
    // getAuthorization();
  }

  function getCurrentUser(token) {
    spotifyDataSource.getCurrentUser(token)
      .then(user => {
        if(user.uri) {
          localStorage.save('userUri', user.uri);
          authorizing = false;
        } else {
          subject.emit('errorCurrentUser', null);
        }
      })
      .catch(error => errorReporter.emit('getSpotifyCurrentUser', error));
  }

  function areSavedScopesEnough() {
    const savedScopes = localStorage.get('authorizedScopes');
    if(!savedScopes) return false;
  
    const savedScopesArray = savedScopes.split(' ');
    const appScopesArray = SPOTIFY_SCOPES.split(' ');
  
    return appScopesArray.reduce((result, scope) => result && savedScopesArray.includes(scope), true);
  }
};
