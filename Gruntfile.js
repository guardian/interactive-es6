var fs = require('fs');
var ini = require('ini')
var path = require('path')

function getAWSCredentials(grunt, cfg) {
    var awsCredentialsFilePath = cfg.credentialsFile.replace('$HOME', process.env['HOME']);
    if (!fs.existsSync(awsCredentialsFilePath)) {
        grunt.log.warn('Credentials file missing: ' + awsCredentialsFilePath);
        return
    }
    var iniFile = ini.parse(fs.readFileSync(awsCredentialsFilePath, 'utf-8'));
    if (iniFile[cfg.profile]) {
        grunt.log.ok('Using AWS credentials ' + cfg.profile + ' profile');
        return iniFile[cfg.profile];
    }

    grunt.log.warn('AWS Credentials profile ' + cfg.profile + ' does not exist. Using default credentials.')
    return iniFile.default;
}

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    var deploy = require('./deploy.json');
    deploy.versionedPath = path.join(deploy.path, Date.now().toString());
    var awsCredentials = getAWSCredentials(grunt, deploy);

    grunt.initConfig({

        visuals: { },

        watch: {
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            },
            inlinejs: {
                files: ['src/js/**/*', 'src/templates/**/*', '!src/js/boot.js'],
                tasks: ['shell:inlinedev'],
            },
            bootjs: {
                files: ['src/js/boot.js'],
                tasks: ['template:bootjsdev'],
            },
        },

        clean: {
            build: ['build']
        },

        sass: {
            options: {
                sourceMap: true
            },
            main: {
                files: {
                    'build/main.css': 'src/css/main.scss'
                }
            }
        },

        shell: {
            options: {
                execOptions: { cwd: '.' }
            },
            inlinedev: {
                command: './node_modules/.bin/jspm bundle-sfx src/js/main build/main.js --format amd'
            },
            inlineprod: {
                command: './node_modules/.bin/jspm bundle-sfx -m src/js/main build/main.js --format amd'
            }
        },

        'template': {
            'bootjsdev': {
                'options': { 'data': { 'assetPath': '' } },
                'files': { 'build/boot.js': ['src/js/boot.js'] }
            },
            'bootjsprod': {
                'options': { 'data': { 'assetPath': deploy.domain + deploy.versionedPath } },
                'files': { 'build/boot.js': ['src/js/boot.js'] }
            }
        },

        aws_s3: {
            options: {
                accessKeyId: awsCredentials.aws_access_key_id,
                secretAccessKey: awsCredentials.aws_secret_access_key,
                region: 'us-east-1',
                uploadConcurrency: 10, // 5 simultaneous uploads
                downloadConcurrency: 10, // 5 simultaneous downloads
                debug: grunt.option('dry'),
                bucket: deploy.bucket,
                differential: true
            },
            inline: {
                files: [
                    {
                        expand: true,
                        cwd: 'build',
                        src: [ 'boot.js' ],
                        dest: deploy.path,
                        params: { CacheControl: 'max-age=5' }
                    },
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            'build/main.js', 'build/main.js.map', 'build/main.css', 'build/main.css.map'
                        ],
                        dest: deploy.versionedPath,
                        params: { CacheControl: 'max-age=60' }
                    }
                ]
            }
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: '.',
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware http://stackoverflow.com/a/24508523
                        middlewares.unshift(function (req, res, next) {
                            if (req.url === '/') req.url = '/test-inline.html';
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            if (req.originalUrl.indexOf('/jspm_packages/') === 0 ||
                                req.originalUrl.indexOf('/bower_components/') === 0) {
                                res.setHeader('Cache-Control', 'public, max-age=315360000');
                            }
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.registerTask('boot_url', function() {
        grunt.log.write('\nBOOT URL: '['green'].bold)
        grunt.log.writeln(deploy.domain + deploy.path + '/boot.js');
    })

    grunt.registerTask('deploy', ['clean', 'sass', 'shell:inlineprod', 'template:bootjsprod', 'aws_s3:inline', 'boot_url']);
    grunt.registerTask('dev', ['clean', 'sass', 'shell:inlinedev', 'template:bootjsdev', 'connect', 'watch']);
    grunt.registerTask('devfast', ['clean', 'sass', 'template:bootjsdev', 'connect', 'watch:css', 'watch:bootjs']);

    grunt.registerTask('default', ['dev']);

    grunt.loadNpmTasks('grunt-aws');

}
