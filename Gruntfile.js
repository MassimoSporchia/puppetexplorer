const url = require('url');
const historyFallback = require('connect-history-api-fallback');
const proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
const rewriteRules = require('grunt-connect-rewrite/lib/utils').rewriteRequest;
const serveStatic = require('serve-static');
const taskLoader = require('load-grunt-tasks');

module.exports = (grunt) => {
  taskLoader(grunt);
  const puppetdb = url.parse(grunt.option('puppetdb') || 'http://puppetdb.puppetexplorer.io:80/');
  const properties = grunt.file.readJSON('package.json');

  // Define the configuration for all the tasks
  grunt.initConfig({
    connect: {
      rules: [{ // We use the example config for local development
        from: '^/config.js$',
        to: '/config.js.example',
      },
      ],
      options: {
        hostname: 'localhost',
        base: 'dist',
        middleware(connect, options) {
          return [
            // Include the proxy first
            proxy,

            // Then rewrite rules
            rewriteRules,

            // History API fallback
            historyFallback(),

            // Serve static files.
            serveStatic(options.base[0]),
          ];
        },
      },
      server: {
        options: {
          port: 8000,
        },
      },
      testserver: {
        options: {
          port: 8001,
        },
      },
      proxies: {
        context: '/api',
        host: puppetdb.hostname,
        port: puppetdb.port || (puppetdb.protocol === 'https:' ? 443 : 80),
        https: puppetdb.protocol === 'https:',
        rewrite: {
          '^/api': '',
        },
      },
    },

    watch: {
      js: {
        files: 'app/**/*.js',
        tasks: ['browserify:dev'],
      },
      static: {
        files: [
          'app/**/*.html',
          'app/**/*.css',
          'app/config.js.example',
          'app/favicon.ico',
          'fonts/**',
        ],
        tasks: ['copy:src'],
      },
    },

    browserify: {
      // Build for distribution
      dist: {
        files: {
          'dist/app.js': ['app/**/*.js'],
        },
        options: {
          transform: [
            ['babelify', { presets: ['es2015'] }],
            ['uglifyify', { mangle: false }],
          ],
        },
      },
      // Dev target without ulgifyify
      dev: {
        options: {
          transform: [
            ['babelify', { presets: ['es2015'] }],
          ],
        },
        files: {
          'dist/app.js': ['app/app.js'],
        },
      },
    },

    copy: {
      src: {
        expand: true,
        cwd: 'app/',
        src: ['**/*.html', '**/*.css', 'config.js.example', 'favicon.ico', 'fonts/**'],
        dest: 'dist/',
      },
      dependencies: {
        expand: true,
        cwd: 'node_modules/',
        src: [
          'moment/moment.js',
        ],
        dest: 'dist/lib/',
      },
      theme: {
        expand: true,
        flatten: true,
        dest: 'dist/css/',
        src: [
          'node_modules/bootswatch/sandstone/bootstrap.min.css',
        ],
      },
    },

    eslint: {
      files: ['app/**/*.js', 'tests/**/*.js', '!tests/casperjs/**/*.js', 'Gruntfile.js'],
    },

    debian_package: {
      options: {
        maintainer: properties.author,
      },
      files: {
        expand: true,
        cwd: 'dist',
        src: ['**'],
        dest: `/usr/share/${properties.name}/`,
      },
    },

    rpm: {
      options: {
        summary: 'web frontend for PuppetDB',
      },
      release: {
        options: {
          release: true,
        },
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['**'],
          dest: `/usr/share/${properties.name}/`,
        },
        ],
      },
      snapshot: {
        options: {
          release: false,
        },
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['**'],
          dest: `/usr/share/${properties.name}/`,
        },
        ],
      },
    },

    clean: ['dist', 'tmp'],

    protractor: {
      local: {
        options: { configFile: 'tests/protractor/conf-local.js' },
      },
      saucelabs: {
        options: { configFile: 'tests/protractor/conf-saucelabs.js' },
      },
    },
  });

  grunt.registerTask('serve', [
    'configureRewriteRules',
    'configureProxies',
    'connect:server:keepalive',
  ]);

  grunt.registerTask('dev', [
    'clean',
    'browserify:dev',
    'copy',
    'configureRewriteRules',
    'configureProxies',
    'connect:server',
    'watch',
  ]);

  grunt.registerTask('build', ['clean', 'browserify:dist', 'copy']);
  grunt.registerTask('build_debian', ['build', 'debian_package']);
  grunt.registerTask('default', ['build']);
  grunt.registerTask('test', [
    'configureRewriteRules',
    'configureProxies',
    'connect:testserver',
    'protractor:local',
    'eslint',
  ]);
  grunt.registerTask('test:saucelabs', [
    'configureRewriteRules',
    'configureProxies',
    'connect:testserver',
    'protractor:saucelabs',
    'eslint',
  ]);
};
