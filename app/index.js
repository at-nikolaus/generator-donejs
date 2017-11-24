var validate = require("validate-npm-package-name");
var BaseGenerator = require('../lib/baseGenerator');
var path = require('path');
var _ = require('lodash');
var utils = require('../lib/utils');
var npmVersion = utils.npmVersion;
var getKeywords = utils.getKeywords;

module.exports = BaseGenerator.extend({
  constructor: function(args, opts) {
    BaseGenerator.call(this, args, opts);

    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    // Pre set the default props from the information we have at this point
    this.props = {
      name: this.pkg.name,
      description: this.pkg.description,
      version: this.pkg.version,
      homepage: this.pkg.homepage,
      repository: this.pkg.repository
    };

    this.mainFiles = [
      'README.md',
      '_gitignore',
      'build.js',
      'production.html',
      'development.html',
      'test.html'
    ];

    this.srcFiles = [
      'app.js',
      'index.stache',
      'index.md',
      'styles.less',
      'test.js',
      'models/fixtures/fixtures.js',
      'models/test.js'
    ];
  },

  prompting: function () {
    var done = this.async();

    npmVersion(function(err, version){
      if(err) {
        done(err);
        return;
      }

      var prompts = [{
        name: 'name',
        message: 'Project name',
        when: !this.pkg.name,
        default: process.cwd().split(path.sep).pop()
      }, {
        name: 'folder',
        message: 'Project main folder',
        default: 'src'
      }, {
        name: 'description',
        message: 'Description',
        when: !this.pkg.description,
        default: 'An awesome DoneJS app'
      }, {
        name: 'homepage',
        message: 'Project homepage url',
        when: !this.pkg.homepage
      }, {
        name: 'githubAccount',
        message: 'GitHub username or organization',
        when: !this.pkg.repository
      }, {
        name: 'authorName',
        message: 'Author\'s Name',
        when: !this.pkg.author,
        store: true
      }, {
        name: 'authorEmail',
        message: 'Author\'s Email',
        when: !this.pkg.author,
        store: true
      }, {
        name: 'authorUrl',
        message: 'Author\'s Homepage',
        when: !this.pkg.author,
        store: true
      }, {
        name: 'keywords',
        message: 'Application keywords',
        when: !this.pkg.keywords
      }, {
        name: 'npmVersion',
        message: 'NPM version used',
        default: version.major
      }];

      this.prompt(prompts).then(function(props) {
        this.props = _.extend(this.props, props);

        var validationResults = validate(this.props.name);
        var isValidName = validationResults.validForNewPackages;

        // Try to fix it by kebab casing.
        // We don't do this first because kebabCase can change
        // otherwise valid names, which is undesirable.
        if(!isValidName) {
          this.props.name = _.kebabCase(this.props.name);
          validationResults = validate(this.props.name);
          isValidName = validationResults.validForNewPackages;
        }

        if(!isValidName) {
          var warnings = validationResults.warnings;
          var error = new Error('Your project name ' + this.props.name + ' is not ' +
            'valid. Please try another name. Reason: ' + warnings[0]);
          done(error);
          return;
        }

        if (path.isAbsolute(this.props.folder)) {
          this.props.folder = path.relative(this.destinationPath(), this.props.folder);
        }
        var isValidPath = this.props.folder.indexOf('..') === -1;
        if (!isValidPath) {
          var error = new Error('Your project main folder ' + this.props.folder + ' is external ' +
            'to the project folder. Please set to internal path.');
          done(error);
          return;
        }

        done();
      }.bind(this));
    }.bind(this));
  },

  writing: function () {
    var pkgName = this.props.name;
    var pkgMain = pkgName + '/index.stache!done-autorender';
    var repository = this.props.repository || {
      type: 'git',
      url: 'git+https://github.com/' + (this.props.githubAccount || 'donejs-user') +
        '/' + pkgName + '.git'
    };

    var self = this;
    var keywords = getKeywords('app', this.props.keywords);
    var pkgJsonFields = {
      name: pkgName,
      version: '0.0.0',
      description: this.props.description,
      homepage: this.props.homepage,
      repository: repository,
      author: {
        name: this.props.authorName,
        email: this.props.authorEmail,
        url: this.props.authorUrl
      },
      private: true,
      scripts: {
        test: 'testee test.html --browsers firefox --reporter Spec',
        start: 'done-serve --port 8080',
        develop: "done-serve --develop --port 8080",
        build: "node build"
      },
      main: pkgMain,
      files: [this.props.folder],
      keywords: keywords,
      steal: {
        main: pkgMain,
        directories: {
          lib: this.props.folder
        },
        configDependencies: [ 'live-reload', 'node_modules/can-zone/register' ],
        plugins: [ 'done-css', 'done-component', 'steal-less', 'steal-stache' ],
        envs: {
          'server-production': {
            renderingBaseURL: '/dist'
          }
        },
        serviceBaseURL: ''
      }
    };

    if(this.props.npmVersion < 3) {
      pkgJsonFields.steal.npmAlgorithm = 'nested';
    }

    if(!this.options.packages) {
      // EQ donejs-cli 1.10.0
      this.options.packages = {
          "dependencies": {
            "can-component": "^3.3.5",
            "can-connect": "^1.5.9",
            "can-define": "^1.5.3",
            "can-route": "^3.2.3",
            "can-route-pushstate": "^3.1.2",
            "can-set": "^1.3.2",
            "can-stache": "^3.11.1",
            "can-view-autorender": "^3.1.1",
            "can-zone": "^0.6.13",
            "done-autorender": "^1.4.0",
            "done-component": "^1.0.0",
            "done-css": "^3.0.1",
            "done-serve": "^1.5.0",
            "generator-donejs": "^1.0.7",
            "steal": "^1.5.15",
            "steal-less": "^1.2.0",
            "steal-stache": "^3.1.2"
          },
          "devDependencies": {
            "can-fixture": "^1.1.1",
            "donejs-cli": "^1.0.0",
            "funcunit": "^3.2.0",
            "steal-qunit": "^1.0.1",
            "steal-tools": "^1.9.1",
            "testee": "^0.3.0"
          }
      }
    }

    var deps = this.options.packages.dependencies;
    var devDeps = this.options.packages.devDependencies;

    this.fs.writeJSON('package.json', _.extend(pkgJsonFields, this.pkg, {
      dependencies: deps,
      devDependencies: devDeps
    }));

    this.composeWith(require.resolve('generator-license/app'), {
      name: this.props.authorName,
      email: this.props.authorEmail,
      website: this.props.authorUrl,
      defaultLicense: 'MIT'
    });

    this.mainFiles.forEach(function(name) {
      // Handle bug where npm has renamed .gitignore to .npmignore
      // https://github.com/npm/npm/issues/3763
      self.fs.copyTpl(
        self.templatePath(name),
        self.destinationPath((name === "_gitignore") ? ".gitignore" : name),
        self.props
      );
    });

    this.srcFiles.forEach(function(name) {
      self.fs.copyTpl(
        self.templatePath(path.join('src', name)),
        self.destinationPath(path.join(self.props.folder, name)),
        self.props
      );
    });
  },

  end: function () {
    if(!this.options.skipInstall) {
      var done = this.async();
      this.spawnCommand('npm', ['--loglevel', 'error', 'install']).on('close', done);
    }
  }
});
