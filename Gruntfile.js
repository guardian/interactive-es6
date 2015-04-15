module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({

        watch: {
            js: {
                files: ['src/js/**/*'],
                tasks: ['shell:jspmBundleStatic'],
            },
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            },
            harness: {
                files: ['harness/**/*'],
                tasks: ['copy','template']
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
                    'build/main.css': 'src/css/main.scss'
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
            }
        },

        'template': {
            'harness': {
                'options': {
                    'data': {
                        'assetPath': 'http://localhost:8000',
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
                    {expand: true, cwd: 'harness/', src: ['curl.js', 'index.html'], dest: 'build'}
                ]
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: 'build'
                }
            }
      }
    });
    grunt.registerTask('default', ['clean','sass','shell','template','copy','connect', 'watch']);
}
