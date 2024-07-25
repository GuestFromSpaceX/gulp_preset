const {src, dest, watch, parallel, series /*Запускает последовательно функции  */} = require('gulp');
const scss = require('gulp-sass')(require('sass')); 
const concat = require('gulp-concat'); /*Переименовывает и соединяет  */
const uglify = require('gulp-uglify-es').default; /*Сжимает JS  */
const browserSync = require('browser-sync').create(); /*Go Live  */
const clean = require('gulp-clean'); /*Очищает папку  */
const cached = require('gulp-cached'); /** */
const mkdirp = require('mkdirp');
const rename = require('gulp-rename');

async function styles() {
    const autoprefixerModule = await import('gulp-autoprefixer'); /**Добавляет префиксы в css для кроссбраузерности */
    const autoprefixer = autoprefixerModule.default;
    return src('app/scss/style.scss')
        .pipe(autoprefixer({overrideBrowserslist: ['last 10 version']}))
        .pipe(concat('style.min.css'))
        .pipe(scss({outputStyle: 'compressed'}))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
}

function scripts() {
    return src([ 'app/js/main.js', /* 'app/js/*.js', '!app/js/main.min.js' */])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function watching() {
    browserSync.init({
        server: {
            baseDir: "app/"
        }
    });
    watch(['app/scss/style.scss'], styles)
    watch(['app/js/main.js'], scripts)
    watch(['app/*.html']).on('change', browserSync.reload) 
}

function building() {
    return src(['app/js/main.min.js', 'app/css/style.min.css', 'app/**/*.html'], {base : 'app'})
        .pipe(dest('dist'))
}

function cleanDist() {
    return src('dist')
        .pipe(clean())
}

// Task to create the destination folder
function createDistFolder(cb) {
    mkdirp.sync('app/assets/dist');
    cb();
}

// Task to convert images to AVIF (png, jpg, svg)
async function convertToAvif() {
    const avif = (await import('gulp-avif')).default; /**Конвертирует все картинки в avif */
    const debug = (await import('gulp-debug')).default;
    return src('app/assets/imgs/*.{png,jpg}')
        .pipe(debug({ title: 'Processing:' }))
        .pipe(avif({ quality: 50 }))
        .pipe(rename(function (path) {
            path.basename += '-avif';
        }))
        .on('error', function(err) {
            console.error('Error in convertToAvif task:', err.message);
        })
        .pipe(dest('app/assets/dist'));
}

// Task to convert images to WebP (Supports PNG, JPEG, TIFF, WebP)
async function convertToWebp() {
    const webp = (await import('gulp-webp')).default;
    return src('app/assets/imgs/*')
        .pipe(webp())
        .pipe(rename(function (path) {
            path.basename += '-webp';
        }))
        .pipe(dest('app/assets/dist'));
}

// Task to optimize images with imagemin (or imgae)


exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.avif = convertToAvif;
exports.webp = convertToWebp;

exports.images = series(createDistFolder, convertToAvif, convertToWebp);
exports.build = series(cleanDist, building);
exports.default = parallel(styles, scripts, watching);