Package.describe({
  name: 'qualia:analyze-observes',
  version: '0.0.1',
  summary: 'Find polling publications/observes.',
  git: 'http://github.com/qualialabs/analyze-observes',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4');

  api.use([
    'ecmascript',
    'underscore',
    'mongo',
    'minimongo',
  ], [ 'server' ]);

  api.mainModule('main.js', 'server');
});

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'underscore',
    'mongo',
    'tinytest',
    'qualia:analyze-observes',
  ], ['server']);

  api.mainModule('tests.js', 'server');
});
