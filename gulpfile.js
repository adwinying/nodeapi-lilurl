const gulp    = require('gulp')
const jshint  = require('gulp-jshint')
const nodemon = require('gulp-nodemon')

const jsFiles = ['*.js']

gulp.task('lint', () => {
	gulp.src(jsFiles)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish', {
			verbose: true
		}))
})

gulp.task('watch', () => {
	gulp.start('lint')
	nodemon({
		script: 'app.js',
		watch: jsFiles,
		delaytime: 1,
		env: {
			'PORT': 3000,
			'LILURL_USER': 'adwin',
			'LILURL_PW': 'mongo123'
		}
	}).on('restart', () => {
		gulp.start('lint')
		console.log('Restarting server...\n')
	})
})

gulp.task('default', () => {
	gulp.start('watch')
})