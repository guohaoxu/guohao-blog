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
            files: {
                'public/css/main.css': 'pbulic/css/main.less'
            }
        },
        watch: {
            files: ['<%= jshint.files %>', 'public/css/*.less'],
            tasks: ['jshint']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jshint', 'less', 'watch']);
};

//