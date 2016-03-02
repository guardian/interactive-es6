var fs = require('fs');

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({

        visuals: { },

        watch: {
            js: {
                files: ['src/js/**/*'],
                tasks: ['shell:interactive', 'shell:embed'],
            },
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            },
            assets: {
                files: ['src/assets/**/*'],
                tasks: ['copy:assets']
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
                    'build/main.css': 'src/css/main.scss'
                }
            },
            embed: {
                files: {
                    'build/embed.css': 'src/css/embed.scss'
                }
            }
        },

        shell: {
            interactive: {
                command: './node_modules/.bin/jspm bundle-sfx <%= visuals.jspmFlags %> src/js/main build/main.js --format amd',
                options: {
                    execOptions: {
                        cwd: '.'
                    }
                }
            },
            embed: {
                command: './node_modules/.bin/jspm bundle-sfx <%= visuals.jspmFlags %> src/js/embed build/embed.js',
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
            'bootjs': {
                'files': {
                    'build/boot.js': ['src/js/boot.js.tpl'],
                }
            },
            'embed': {
                'files': {
                    'build/embed.html': ['src/embed.html']
                }
            }
        },

        copy: {
            harness: {
                files: [
                    {expand: true, cwd: 'harness/', src: ['curl.js', 'index.html', 'immersive.html', 'interactive.html'], dest: 'build'},
                ]
            },
            assets: {
                files: [
                    {expand: true, cwd: 'src/', src: ['assets/**/*'], dest: 'build'},
                ]
            },
            deploy: {
                files: [
                    { // BOOT and EMBED
                        expand: true, cwd: 'build/',
                        src: ['boot.js', 'embed.html'],
                        dest: 'deploy/<%= visuals.timestamp %>'
                    },
                    { // ASSETS
                        expand: true, cwd: 'build/',
                        src: ['main.js', 'main.css', 'main.js.map', 'main.css.map',
                            'embed.js', 'embed.css', 'embed.js.map', 'embed.css.map',
                            'assets/**/*'],
                        dest: 'deploy/<%= visuals.timestamp %>/<%= visuals.timestamp %>'
                    }
                ]
            }
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
                region: 'us-east-1',
                debug: grunt.option('dry'),
                bucket: '<%= visuals.s3.bucket %>',
                uploadConcurrency: 10, // 5 simultaneous uploads
                downloadConcurrency: 10 // 5 simultaneous downloads
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
                    },
                    { // EMBED
                        expand: true,
                        cwd: 'deploy/<%= visuals.timestamp %>',
                        src: ['embed.html'],
                        dest: '<%= visuals.s3.path %>/embed',
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
        grunt.config('visuals', {
            s3: grunt.file.readJSON('./cfg/s3.json'),
            timestamp: Date.now(),
            jspmFlags: '-m',
            assetPath: '<%= visuals.s3.domain %><%= visuals.s3.path %>/<%= visuals.timestamp %>'
        });
    })

    grunt.registerTask('boot_url', function() {
        grunt.log.write('\nBOOT URL: '['green'].bold)
        grunt.log.writeln(grunt.template.process('<%= visuals.s3.domain %><%= visuals.s3.path %>/boot.js'))

        grunt.log.write('\nEMBED URL: '['green'].bold)
        grunt.log.writeln(grunt.template.process('<%= visuals.s3.domain %><%= visuals.s3.path %>/embed/embed.html'))
    })

    grunt.registerTask('embed', ['shell:embed', 'template:embed', 'sass:embed']);
    grunt.registerTask('interactive', ['shell:interactive', 'template:bootjs', 'sass:interactive']);
    grunt.registerTask('all', ['interactive', 'embed', 'copy:assets'])
    grunt.registerTask('default', ['clean', 'copy:harness', 'all', 'connect', 'watch']);
    grunt.registerTask('build', ['clean', 'all']);
    grunt.registerTask('deploy', ['loadDeployConfig', 'prompt:visuals', 'build', 'copy:deploy', 'aws_s3', 'boot_url']);

    grunt.loadNpmTasks('grunt-aws');

}
