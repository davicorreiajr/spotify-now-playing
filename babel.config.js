const presets = [
  [
    '@babel/env',
    {
      targets: {
        browsers: '> 1%',
        uglify: true
      },
      useBuiltIns: 'usage',
    },
  ],
];

module.exports = { presets };
