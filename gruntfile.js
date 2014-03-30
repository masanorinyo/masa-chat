module.exports = function(grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.initConfig({
   		compass:{
   			dev:{
   				options:{
   					config:'config.rb'
   				}//options
   			}//dev
   		},//compass
     
	    watch: {
		    sass: {
		        files: ['app/sass/*/*.scss','app/sass/*.scss'],
		        tasks: ['compass:dev']//when the files change, what task should be executed?
		    }, //sass
	    } //watch
  }) //initConfig
  grunt.registerTask('default', 'watch');
} //exports

