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
          'public/css/main.css': 'public/css/main.less'
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      js: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint']
      },
      less: {
        files: 'public/css/*.less',
        tasks: ['less']
      },
      static: {
        files: ['views/*.ejs', 'public/*.html']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'less', 'watch']);
};

//
