var request = require('sync-request')
var cheerio = require('cheerio')

// ES6 定义一个类
class Movie {
    constructor() {
        // 分别是电影名/评分/引言/排名/封面图片链接
        this.name = ''
        this.score = 0
        this.type = ''
        this.ranking = 0
        this.coverUrl = ''
        this.otherNames = ''
    }
}

var log = console.log.bind(console)

var cachedUrl = url => {
    // 1, 确定缓存文件名
    var cacheFile = 'cached_html/' + url.split('index-')[1] + '.html'
    // 2, 检查缓存文件是否存在
    // 如果存在就读取缓存文件
    // 如果不存在就下载并写入缓存文件
    var fs = require('fs')
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        // log('data', data)
        return data
    } else {
        // 用 GET 方法获取 url 链接的内容
        // 相当于你在浏览器地址栏输入 url 按回车后得到的 HTML 内容
        var r = request('GET', url)
        // utf-8 是网页文件的文本编码
        var body = r.getBody('utf-8')
        // 写入缓存
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

var movieFromDiv = function(div) {
    var e = cheerio.load(div)

    // 创建一个电影类的实例并且获取数据
    // 这些数据都是从 html 结构里面人工分析出来的
    var movie = new Movie()
    var block = e('.mov_pic')
    movie.name = block.find('a').attr('title').split('/')[0]
    movie.score = e('.total').text() + e('.total2').text()
    movie.type = block.find('span[class=c_fff]').text()
    movie.otherNames = block.find('a').attr('title').split('/')[1]

    //var pic = e('.pic')
    //movie.ranking = pic.find('em').text()
   // movie.coverUrl = pic.find('img').attr('src')

    return movie
}

var moviesFromUrl = function(url) {
    // 调用 cached_url 来获取 html 数据
    // 我们不关心这个函数怎么获取到 HTML, 只要知道它可以根据 url 返回
    // 我们想要的 HTML 内容即可
    var body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    var e = cheerio.load(body)
    //
    // 一共有 25 个 .item
    var movieDivs = e('#asyncRatingRegion').find('li')
    // 循环处理 25 个 .item
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        // 扔给 movieFromDiv 函数来获取到一个 movie 对象
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

var saveMovie = function(movies) {
    // JSON.stringify 第 2 3 个参数配合起来是为了让生成的 json
    // 数据带有缩进的格式, 第三个参数表示缩进的空格数
    // 建议当套路来用
    // 如果你一定想要知道原理, 看下面的链接(不建议看)
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    var s = JSON.stringify(movies, null, 2)
    // 把 json 格式字符串写入到 文件 中
    var fs = require('fs')
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

/*var downloadCovers = movies => {
    // 使用 request 库来下载图片
    var request = require('request')
    var fs = require('fs')
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        // 保存图片的路径
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        // 下载并保存图片的套路
        request(url).pipe(fs.createWriteStream(path))
    }
}*/

var __main = function() {
    // 主函数
    var movies = []
    var moviesInPage = ""
    var url =` http://www.mtime.com/top/movie/top100/`
    moviesInPage = moviesFromUrl(url)
    movies = [...movies, ...moviesInPage]
    for (var i = 2; i <=10; i++) {
        url = `http://www.mtime.com/top/movie/top100/index-${i}.html`
        moviesInPage = moviesFromUrl(url)
        // 注意这个 ES6 的语法
        movies = [...movies, ...moviesInPage]
    }
    saveMovie(movies)
    // download covers
    //downloadCovers(movies)
}


__main()
