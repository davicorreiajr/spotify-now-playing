'use strict';
const { app } = require('electron');
const githubDatasource = require('./github-datasource');

exports.execute = function() {
  githubDatasource.getLatestVersion()
    .then(data => console.log('latest version ', data));
  
  console.log('appVersion ', app.getVersion());
};
