var formidable = require('formidable'),
    util = require('util'),
    im = require('imagemagick'),
    fs = require('fs'),
    path = require('path'),
    knox = require('knox');

var config_file = './alleup.json',
    config = {},
    s3client = undefined,
    uploaddir = undefined,
    storage_type = undefined,
    scope = undefined;


var Alleup = exports = module.exports = function Alleup(options) {
	config_file = (typeof options['config_file'] === 'undefined') ? config_file : options['config_file'];
	storage_type = options['storage'];
	this.loadConfig(config_file);
	
	if ( typeof (config['storage']['aws'] || config['storage']['dir']) == 'undefined' )
		throw new TypeError("No storage defined in alleup config");
	
	for(storage in config['storage']) {
		eval('this.' + storage + 'Setup')(config['storage'][storage]);
	}

   	
};


Alleup.prototype = {
	
	url: function(file, version) {
		var _file = this.genFileName( file, version );
		
		return eval('this.' + storage_type + 'Url')(_file);
	},
	
	dirUrl: function(file) {
		return '/' + uploaddir + file;
	},
	
	awsUrl: function(file) {
		return s3client.url( file );
	},
	
	
	genFileName: function(file, version) {
		return version + '_' + file;
	},
	
	remove: function(file, callback, _scope) {
		scope = (arguments.length == 3) ? _scope : undefined
		var _variants = this.setupVariants()
		
		var _resize = _variants['resize'];
		var _crop = _variants['crop'];
		
		for(version in _resize) {
			eval('this.' + storage_type + 'Remove')( this.genFileName( file, version ),  function(err) {
				callback(err);
			});
		};
		
		for(version in _crop) {
			eval('this.' + storage_type + 'Remove')( this.genFileName( file, version ),  function(err) {
				callback(err);
			});
		};
		return callback(null);
	},
	
	awsRemove: function(file, callback) {
		s3client.deleteFile(file, function(err, res){
		  callback(err);
		});
	},
	
	dirRemove: function(file, callback){
		fs.unlink(uploaddir + file, function(err){
			return callback(err);
		});
		
	},
	
	upload: function(req, res, callback, _scope) {
		scope = (arguments.length == 4) ? _scope : undefined
		
    var _this = this;
		var form = new formidable.IncomingForm(),
		files = [],
		fields = [],
		new_file = undefined;

		//form.uploadDir = './tmp';

		form
		.on('field', function(field, value) {
			fields.push([field, value]);
		})
		.on('file', function(field, file) {
			files.push([field, file]);
			new_file = file;
			
		})
		.on('end', function() {
			
			//res.writeHead(200, {'content-type': 'text/plain'});
			//res.write('received fields:\n\n '+util.inspect(fields));
			//res.write('\n\n');
			//res.end('received files:\n\n '+util.inspect(files));
			
			_this.makeVariants(new_file, function(err, file){
				callback(err, file, res);
			});
		});
		form.parse(req);
	},
	
	awsSetup: function(options) {
		
		s3client = knox.createClient({
		    key: options['key']
		  , secret: options['secret']
		  , bucket: options['bucket']
		});
	},
	
	dirSetup: function(options) {
		
		uploaddir = options['path'];
	},
	

	makeVariants: function(file, callback) {
		
		var _this = this;
		var _variants = this.setupVariants()
		
		var _resize = _variants["resize"] || JSON.parse( JSON.stringify({"null" : "null"}) );
		var _crop = _variants["crop"] || JSON.parse( JSON.stringify({"null" : "null"}) );
		
		var new_file = Math.round(new Date().getTime());
		var ext = this.setExtension(file['type']);
		new_file += ext;
		
		var i = 0;
		for(prefix in _resize) {
			
			this.imAction('im.resize', file, this.genFileName( new_file, prefix ) , _resize[prefix], function(err){
				i++;
				if (i == Object.keys(_resize).length ) {
					i = 0;
					for(prefix in _crop) {
						_this.imAction('im.crop', file, _this.genFileName( new_file, prefix ) , _crop[prefix], function(err){
							i++;
							if (i == Object.keys(_crop).length ) {
							    fs.unlink(file['path']);
							    callback(err, new_file);
							};
						});
					};
				};
				
				
			});
		};
	
	},
  
  setupVariants: function() {
			var resize = (typeof scope === 'undefined') ? config.variants.resize : eval('config.variants.'+scope+'.resize')
			var crop = (typeof scope === 'undefined') ? config.variants.crop : eval('config.variants.'+scope+'.crop') 
			return { "resize" : resize, "crop" : crop }
  },

	pushToS3: function(sfile, dfile, content_type, callback) {
		
		fs.readFile(sfile, function(err, buf){
			var req = s3client.put(dfile, {
				'Content-Length': buf.length
				, 'Content-Type': content_type
			});
			req.on('response', function(res){
				if (200 == res.statusCode) {
					fs.unlink(sfile);
					callback(err);
				}
			});
			req.end(buf);
			
		});
	},

	loadConfig: function(resource) {
		if (fs.existsSync(resource)) {
			try {
				config = JSON.parse(fs.readFileSync(resource));		
			} catch (err) {
				throw new Error("Could not parse JSON config at "+path.resolve(resource));
			}
		}
	},

	imAction: function(action, file, prefix, size, callback) {
		if (size == "null") {
			return callback(null);
		}
		var _this = this;
		
		
		var dfile = prefix;
		var tfile = (storage_type == 'dir') ?  uploaddir + dfile : file['path'] + prefix;
		
	   	eval(action)( this.imOptions(file, tfile, size), function(err, stdout, stderr){
		  	if (storage_type == 'aws') {
			
			    _this.pushToS3(tfile, dfile, file['type'], function(err){
					return callback(err);
				});
				
			} else {
				return callback(err);
			}
		});
	
	},

    setExtension: function(content_type) {
	    
	    switch(content_type) {
			case 'image/jpeg':
			  var ext = '.jpg'
			  break;
			case 'image/png':
			  var ext = '.png'
			  break;
			case 'image/gif':
			  var ext = '.gif'
			  break;
		};
		
		return ext;
		
    },
    
	imOptions: function(file, tfile, size) {
		var _size = size.split('x');
		return options = {
			srcPath: file['path'],
			dstPath: tfile,
			width: _size[0],
			height: _size[1],
			quality: 1
		};
	}

};