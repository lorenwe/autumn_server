var mongoose = require('mongoose');
var moment = require('moment');
var marked = require('marked');
var trimHtml = require('trim-html');
var path = require('path');
var config = require('../config/config.js');

var Article = mongoose.model('Article');

module.exports = {
	add: function (req, res, next) {
		Article.find({}).sort({'sort': -1}).limit(1).exec((err, doc) => {
			if (err) {
	            console.log(err);
	        } else {
	        	var maxsort;
	        	if (doc.length !== 0) {
	        		maxsort = doc[0].sort;
	        	} else {
	        		maxsort = 0; 
	        	}       	
	        }	
			var article = new Article({
				title: "新的文章标题",
				excerpt: "新的文章内容",
				sort: maxsort+1,
				create_time: moment().format('YYYY-MM-DD HH:mm:ss')
			});
			article.save((err, doc) => {
		        if (err) {
		            console.log(err);
		        } else {
		        	res.json({
						State: true,
						Data: doc
					});
		        }
	    	});
		});
	},
	list: function (req, res, next) {
		Article.find({}).sort({'sort':-1}).exec((err, doc) => {
			if(err) console.log(err);
			if(doc){
				res.json({
					State: true,
					Data: doc
				});
			}else{
				res.json({
					State: false,
					Message: '列表为空'
				});
			}
		});
	},
	save: function (req, res, next) {
    	var updateArticle = {
    		title: req.body.title,
    		excerpt: req.body.excerpt
    	};
    	var _id = req.body._id;
    	Article.findByIdAndUpdate(_id, updateArticle, {new: true}, function(err, doc){
	        if (err) {
	            console.log(err);
	        } else {
	            res.json({
					State: true,
					Message: '更新成功'
				});
	        }
	    })
	},
	saveSort: function (req, res, next) {
		var data = req.body;
		var bulk = Article.collection.initializeOrderedBulkOp();
		for (var i = 0; i < data.length; i++) {  
		    var id = data[i]._id;
		    bulk.find({
		        '_id': mongoose.Types.ObjectId(id)
		    }).updateOne({
		        $set: {
		            sort: data[i].sort
		        }
		    });
		}
		bulk.execute(function(err, result) {
			if (err) {
	            console.log(err);
	        } else {
				res.json({
					State: true,
					Data: result,
					Message: '更新成功'
				});
			}
		});
	},
	index: function (req, res, next) {
		var host = req.headers.host;
		if (config.adminhost === host) {
			res.sendFile(path.dirname(require.main.filename) + '/dist/index.html');
		} else {
			var page = req.params.page ? parseInt(req.params.page) : 1;
			var rows = 5;
			Article.count({}, function(err, count) {
				if (err) {
					return res.render('404');
				}
				Article.find({}).skip((page-1)*rows).sort({'sort':-1}).limit(rows).exec((err, doc) => {
					if (err) {
						console.log(err);
					} else {
						if (doc.length !== 0) {
							var trim;
							for(var item in doc) {
								trim = {};
								trim = trimHtml(marked(doc[item].excerpt), { limit: 200 });
								doc[item].excerpt = trim.html;
								doc[item].more = trim.more;
							}
							var pageArr = [];
							var pageCom = Math.ceil(count/rows);
							var showPage= 5;  //总共显示5个数字页码
							if (page === 1) {
								for(var i = 0; i < pageCom; i++) {
									if (i < showPage) {
										pageArr[i] = i + 1;
									}
								}
							} else {
								if (page === pageCom) {
									for(var i = 0; i < pageCom; i++) {
										if (i < showPage) {
											pageArr[i] = pageCom - (showPage - i);
										}
									}
								} else {
									var curPage = Math.ceil(showPage/2);
									if ((page-(curPage-1)) < 0) {
										for(var i = 0; i < pageCom; i++) {
											if (i < showPage) {
												pageArr[i] = i + 1;
											}
										}
									} else if(curPage + (curPage-1) > pageCom) {
										for(var i = 0; i < pageCom; i++) {
											if (i < showPage) {
												pageArr[i] = pageCom - (showPage - i);
											}
										}
									} else {
										for(var i = 0; i < pageCom; i++) {
											if (i < showPage) {
												pageArr[i] = page-(curPage-1) + i;
											}
										}
									}
								}
							}
							var pageHbs = [];
							for(var i = 0; i < pageArr.length; i++) {
								if (pageArr[i] === page) {
									pageHbs[i] = {'index': pageArr[i], 'disabled': true}
								} else {
									pageHbs[i] = {'index': pageArr[i], 'disabled': false}
								}
							}
							if (page === 1) {
								var prev = {'disabled': true, 'url': ''};
							} else {
								var prev = {'disabled': false, 'url': page - 1};
							}
							if (page === parseInt(pageCom)) {
								var next = {'disabled': true, 'url': ''};
							} else {
								var next = {'disabled': false, 'url': page + 1};
							}
							// res.json(pageArr); return;
							res.render('index',{
								post: doc, 
								page: pageHbs, 
								prev: prev, 
								next: next
							});
						} else {
							res.render('404');
						}
						
					}
				});
			});
		}
	},
	info: function (req, res, next) {
		var sort = req.params.sort;
		Article.find({'sort':sort}).exec((err, doc) => {
			var trim = trimHtml(marked(doc[0].excerpt), { limit: 200 });
    		res.render('article',{
    			title: doc[0].title,
    			excerpt: marked(doc[0].excerpt),
    			more: false
    		});
		});
	}
}