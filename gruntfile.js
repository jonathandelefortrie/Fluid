module.exports = function(grunt) {

    /* Core Files */
    var fluid = [
        './src/fluid.js'
    ];

    /* Test Array */
    var test = fluid.slice(0);
    test.splice(0, 0, './test/**/*.js');
    test.splice(0, 0, './node_modules/chai/chai.js');

    grunt.initConfig({

        watch: {
            fluid: {
                files: ['./src/*.js'],
                tasks: ['uglify:fluid']
            }
        },

        uglify: {
            fluid: {
                files: {
                    './fluid.min.js': fluid
                }
            }
        },

        jshint: {
            all: ['./src/*.js']
        },

        karma: {
            unit: {
                options: {
                    files: test,
                    basePath: '',
                    autoWatch: true,
                    singleRun: true,
                    frameworks: ['mocha'],
                    browsers: ['PhantomJS'],
                    reporters: ['progress', 'coverage', 'tap'],
                    preprocessors: {
                        './src/*.js': ['coverage']
                    },
                    coverageReporter: {
                        type: 'lcov',
                        dir: 'coverage/'
                    },
                    tapReporter: {
                        outputFile: 'test/results.tap'
                    }
                }
            }
        },

        mocha: {
            test: {
                src: ['./test/**/*.html']
            },
            options: {
                run: true
            }
        }

    });

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
};