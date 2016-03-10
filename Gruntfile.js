module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'public/js/main.js', 'models/**/*.js', 'routes/**/*.js'],
            options: {
                globals: {}
            }
        },
        less: {
            dev: {
                files: {
                    'public/css/test.css': 'public/css/test.less'
                }
            }
        },
        watch: {
            js: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint']
            },
            less: {
                files: 'public/css/*.less',
                tasks: ['less']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint', 'less', 'watch']);
};

//