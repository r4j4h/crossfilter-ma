module.exports = function ( grunt ) {
    'use strict';

    var jsFiles = module.exports.jsFiles;

    var output = {
        js: '<%= pkg.name %>.js',
        jsmin: '<%= pkg.name %>.min.js',
        map: '<%= pkg.name %>.min.js.map'
    };

    grunt.initConfig( {
        pkg: grunt.file.readJSON( 'package.json' ),

        concat: {
            js: {
                src: jsFiles,
                dest: output.js
            }
        },
        uglify: {
            jsmin: {
                options: {
                    mangle: true,
                    compress: true,
                    sourceMap: output.map
                },
                src: output.js,
                dest: output.jsmin
            }
        },
        sed: {
            version: {
                pattern: '%VERSION%',
                replacement: '<%= pkg.version %>',
                path: [ output.js, output.jsmin ]
            }
        },
        jscs: {
            old: {
                src: [ 'spec/**/*.js' ],
                options: {
                    validateIndentation: 4
                }
            },
            source: {
                src: [ 'src/**/*.js', '!src/{banner,footer}.js', 'Gruntfile.js' ],
                options: {
                    config: '.jscsrc'
                }
            }
        },
        jshint: {
            source: {
                src: [ 'src/**/*.js', 'Gruntfile.js' ],
                options: {
                    jshintrc: '.jshintrc',
                    ignores: [ 'src/banner.js', 'src/footer.js' ]
                }
            }
        },
        watch: {
            scripts: {
                files: [ 'src/**/*.js' ],
                tasks: [ 'build' ]
            },
            jasmineRunner: {
                files: [ 'spec/**/*.js' ],
                tasks: [ 'jasmine:specs:build' ]
            },
            tests: {
                files: [ 'src/**/*.js', 'spec/**/*.js' ],
                tasks: [ 'test' ]
            },
            reload: {
                files: [ 'crossfilter-ma.js', 'web/js/crossfilter-ma.js', 'crossfilter-ma.min.js' ],
                options: {
                    livereload: true
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.'
                }
            }
        },
        jasmine: {
            specs: {
                options: {
                    display: 'short',
                    summary: true,
                    specs:  'spec/*-spec.js',
                    helpers: 'spec/helpers/*.js',
                    version: '2.0.0',
                    outfile: 'spec/index.html',
                    keepRunner: true
                },
                src: [
                    'node_modules/d3/d3.js',
                    'node_modules/crossfilter/crossfilter.js',
                    'web/js/colorbrewer.js',
                    'crossfilter-ma.js'
                ]
            },
            coverage:{
                src: '<%= jasmine.specs.src %>',
                options:{
                    specs: '<%= jasmine.specs.options.specs %>',
                    helpers: '<%= jasmine.specs.options.helpers %>',
                    version: '<%= jasmine.specs.options.version %>',
                    template: require( 'grunt-template-jasmine-istanbul' ),
                    templateOptions: {
                        coverage: 'coverage/jasmine/coverage.json',
                        report: [
                            {
                                type: 'html',
                                options: {
                                    dir: 'coverage/jasmine'
                                }
                            }
                        ]
                    }
                }
            },
            browserify: {
                options: {
                    display: 'short',
                    summary: true,
                    specs:  'spec/*-spec.js',
                    helpers: 'spec/helpers/*.js',
                    version: '2.0.0',
                    outfile: 'spec/index-browserify.html',
                    keepRunner: true
                },
                src: [
                    'bundle.js'
                ]
            }
        },
        browserify: {
            dev: {
                src: 'crossfilter-ma.js',
                dest: 'bundle.js',
                options: {
                    browserifyOptions: {
                        standalone: 'crossfilter-ma'
                    }
                }
            },
        }
    } );


    grunt.registerTask( 'watch:jasmine', function () {
        grunt.config( 'watch', {
            options: {
                interrupt: true
            },
            runner: grunt.config( 'watch' ).jasmineRunner,
            scripts: grunt.config( 'watch' ).scripts
        } );
        grunt.task.run( 'watch' );
    } );


    // These plugins provide necessary tasks.
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-connect' );
    grunt.loadNpmTasks( 'grunt-contrib-copy' );
    grunt.loadNpmTasks( 'grunt-contrib-jasmine' );
    grunt.loadNpmTasks( 'grunt-contrib-jshint' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks( 'grunt-jscs' );
    grunt.loadNpmTasks( 'grunt-markdown' );
    grunt.loadNpmTasks( 'grunt-sed' );
    grunt.loadNpmTasks( 'grunt-shell' );
    grunt.loadNpmTasks( 'grunt-debug-task' );
    grunt.loadNpmTasks( 'grunt-browserify' );


    // task aliases
    grunt.registerTask( 'build', [ 'concat', 'uglify', 'sed' ] );
    grunt.registerTask( 'lint', [ 'build', 'jshint', 'jscs' ] );
    grunt.registerTask( 'coverage', [ 'build', 'jasmine:coverage' ] );
    grunt.registerTask( 'server', [ 'jasmine:specs:build', 'connect:server', 'watch:jasmine' ] );
    grunt.registerTask( 'test', [ 'build', 'jasmine:specs' ] );

    grunt.registerTask( 'test-browserify', [ 'build', 'browserify', 'jasmine:browserify' ] );
    grunt.registerTask( 'default', [ 'build' ] );
};

module.exports.jsFiles = [
    'src/banner.js',
    'src/crossfilter-ma.js',
    'src/math-average.js',
    'src/math-rolling-average.js',
    'src/footer.js'
];