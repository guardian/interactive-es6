var fs = require('fs');
var timestamp = Date.now();

// S3 CONFIG
// **************************
var s3bucket = 'gdn-cdn';
var s3path = undefined; // upload URL e.g. '2015/05/results-interactive/'
var s3target = 'http://visuals.guim.co.uk/' + s3path + timestamp;



module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    var s3 = grunt.option('s3') || false;

    if (s3 && !s3path) throw new Error('You need to set s3path in Gruntfile.js');

    grunt.log.writeln('Compiling ' + (s3 ? 'for S3' : 'locally'));

    grunt.initConfig({

        watch: {
            js: {
                files: ['src/js/**/*'],
                tasks: ['shell:interactive'],
            },
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass:interactive'],
            },
            harness: {
                files: ['harness/**/*'],
                tasks: ['harness']
            }
        },

        clean: {
            build: ['build']
        },

        sass: {
            options: {
                sourceMap: true
            },
            interactive: {
                files: {
                    'build/main.css': 'src/css/main.scss',
                    'build/snap.css': 'src/css/snap.scss'
                }
            },
            harness: {
                files: {
                    'build/fonts.css': 'harness/fonts.scss'
                }
            }
        },

        shell: {
            interactive: {
                command: './node_modules/.bin/jspm bundle-sfx ' + (s3 ? '-m ' : '') + 'src/js/main build/main.js',
                options: {
                    execOptions: {
                        cwd: '.'
                    }
                }
            }
        },

        'template': {
            'harness': {
                'options': {
                    'data': {
                        'assetPath': s3 ? s3target : '',
                    }
                },
                'files': {
                    'build/boot.js': ['harness/boot.js.tpl'],
                    'build/interactive.html': ['harness/interactive.html.tpl'],
                    'build/lite.html': ['harness/lite.html.tpl']
                }
            }
        },

        copy: {
            harness: {
                files: [
                    {expand: true, cwd: 'harness/', src: ['curl.js', 'index.html', 'mega.json', 'front.html'], dest: 'build'},
                ]
            },
            deploy: {
                files: [
                    {expand: true, cwd: 'build/', src: ['boot.js'], dest: 'deploy' },
                    {expand: true, cwd: 'build/', src: ['main.js', 'main.css', 'main.js.map', 'main.css.map'], dest: 'deploy/' + timestamp }
                ]
            }
        },
        symlink: {
            options: {
                overwrite: false
            },
            fonts: {
                src: 'bower_components/guss-webfonts/webfonts',
                dest: 'build/fonts/0.1.0'
            },
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: 'build',
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware http://stackoverflow.com/a/24508523
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.registerTask('harness', ['copy:harness', 'template:harness', 'sass:harness', 'symlink:fonts'])
    grunt.registerTask('interactive', ['shell:interactive', 'sass:interactive'])

    grunt.registerTask('default', ['clean', 'harness', 'interactive', 'connect', 'watch']);

    grunt.registerTask('build', ['clean','interactive', 'copy:deploy']);
}
