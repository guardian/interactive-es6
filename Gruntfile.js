module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({

        watch: {
            js: {
                files: ['src/js/**/*'],
                tasks: ['shell'],
            },
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            },
            harness: {
                files: ['harness/**/*'],
                tasks: ['copy:main','template']
            },
            html: {
                files: ['src/html/**/*'],
                tasks: ['copy:snap']
            }
        },

        clean: { 
            build: ['build'] 
        },

        sass: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    'build/main.css': 'src/css/main.scss',
                    'build/snap.css': 'src/css/snap.scss'
                }
            }
        },

        shell: {
            jspmBundleStatic: {
                command: './node_modules/.bin/jspm bundle-sfx src/js/main build/main.js',
                options: {
                    execOptions: {
                        cwd: '.'
                    }
                }
            },
            jspmBundleSnap: {
                command: './node_modules/.bin/jspm bundle-sfx src/js/snap build/snap.js',
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
                        'assetPath': '',
                    }
                },
                'files': {
                    'build/boot.js': ['harness/boot.js.tpl'],
                    'build/interactive.html': ['harness/interactive.html.tpl']
                }
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'harness/', src: ['curl.js', 'index.html', 'mega.json', 'front.html'], dest: 'build'},
                ]
            },
            snap: {
                files: [
                    {expand: true, cwd: 'src/html/', src: ['snap.html'], dest: 'build'},
                ]
            }
        },
        symlink: {
            options: {
                overwrite: false
            },
            explicit: {
                src: 'bower_components/guss-webfonts/webfonts',
                dest: 'build/fonts/0.1.0'
            },
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: 'build'
                }
            }
      }
    });
    grunt.registerTask('default', ['clean','sass','shell','template','copy','symlink', 'connect', 'watch']);
}
