var fs = require('fs');

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({

        visuals: { },

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
                command: './node_modules/.bin/jspm bundle-sfx <%= visuals.jspmFlags %> src/js/main build/main.js',
                options: {
                    execOptions: {
                        cwd: '.'
                    }
                }
            }
        },

        'template': {
            'options': {
                'data': {
                    'assetPath': '<%= visuals.assetPath %>',
                }
            },
            'harness': {
                'files': {
                    'build/interactive.html': ['harness/interactive.html.tpl'],
                    'build/immersive.html': ['harness/immersive.html.tpl']
                }
            },
            'bootjs': {
                'files': {
                    'build/boot.js': ['src/js/boot.js.tpl'],
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
                    { // BOOT
                        expand: true, cwd: 'build/',
                        src: ['boot.js'],
                        dest: 'deploy/<%= visuals.timestamp %>'
                    },
                    { // ASSETS
                        expand: true, cwd: 'build/',
                        src: ['main.js', 'main.css', 'main.js.map', 'main.css.map'],
                        dest: 'deploy/<%= visuals.timestamp %>/<%= visuals.timestamp %>'
                    }
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

        prompt: {
            visuals: {
                options: {
                    questions: [
                        {
                            config: 'visuals.s3.stage',
                            type: 'list',
                            message: 'Deploy to TEST or PRODUCTION URL?',
                            choices: [{
                                name: 'TEST: <%= visuals.s3.domain %>testing/<%= visuals.s3.path %>',
                                value: 'TEST'
                            },{
                                name: 'PROD: <%= visuals.s3.domain %><%= visuals.s3.path %>',
                                value: 'PROD'
                            }]
                        },
                        {
                            config: 'visuals.confirmDeploy',
                            type: 'confirm',
                            message: 'Deploying to PRODUCTION. Are you sure?',
                            default: false,
                            when: function(answers) {
                                return answers['visuals.s3.stage'] === 'PROD';
                            }
                        }
                    ],
                    then: function(answers) {
                        if (grunt.config('visuals.s3.stage') !== 'PROD') { // first Q
                            var prodPath = grunt.config('visuals.s3.path');
                            var testPath = 'testing/' + prodPath;
                            grunt.config('visuals.s3.path', testPath);
                        } else if (answers['visuals.confirmDeploy'] !== true) { // second Q
                            grunt.fail.warn('Please confirm to deploy to production.');
                        }
                    }
                }
            },
        },

        aws_s3: {
            options: {
                accessKeyId: '<%= visuals.aws.AWSAccessKeyID %>',
                secretAccessKey: '<%= visuals.aws.AWSSecretKey %>',
                region: 'us-east-1',
                debug: grunt.option('dry'),
                bucket: '<%= visuals.s3.bucket %>'
            },
            production: {
                options: {
                },
                files: [
                    { // ASSETS
                        expand: true,
                        cwd: 'deploy/<%= visuals.timestamp %>',
                        src: ['<%= visuals.timestamp %>/**/*'],
                        dest: '<%= visuals.s3.path %>',
                        params: { CacheControl: 'max-age=2678400' }
                    },
                    { // BOOT
                        expand: true,
                        cwd: 'deploy/<%= visuals.timestamp %>',
                        src: ['boot.js'],
                        dest: '<%= visuals.s3.path %>',
                        params: { CacheControl: 'max-age=60' }
                    }]
            }
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

    grunt.registerTask('loadDeployConfig', function() {
        if (!grunt.file.exists('cfg/aws-keys.json')) grunt.fail.fatal('./cfg/aws-keys.json missing');
        grunt.config('visuals', {
            s3: grunt.file.readJSON('./cfg/s3.json'),
            aws: grunt.file.readJSON('./cfg/aws-keys.json'),
            timestamp: Date.now(),
            jspmFlags: '-m',
            assetPath: '<%= visuals.s3.domain %><%= visuals.s3.path %>/<%= visuals.timestamp %>'
        });
    })

    grunt.registerTask('boot_url', function() {
        grunt.log.write('\nBOOT URL: '['green'].bold)
        grunt.log.writeln(grunt.template.process('<%= visuals.s3.domain %><%= visuals.s3.path %>/boot.js'))
    })

    grunt.registerTask('harness', ['copy:harness', 'template:harness', 'sass:harness', 'symlink:fonts'])
    grunt.registerTask('interactive', ['shell:interactive', 'template:bootjs', 'sass:interactive'])
    grunt.registerTask('default', ['clean', 'harness', 'interactive', 'connect', 'watch']);
    grunt.registerTask('build', ['clean', 'interactive']);
    grunt.registerTask('deploy', ['loadDeployConfig', 'prompt:visuals', 'build', 'copy:deploy', 'aws_s3', 'boot_url']);

    grunt.loadNpmTasks('grunt-aws');

}
