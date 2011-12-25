Alleup
=============

Flexible way to resize and upload images to Amazon S3 or file system storages for Node.js. Possible  to add different versions of the same file in cropped or resized variant.

## Installation
    $ npm install alleup

## Quick Start

1. **You need to create alleup configuration file with image variants and your storages**
Example:

    ```javascript
    {
		"variants": {
			"resize": {
				"mini" : "300x200",
				"preview": "800x600"
			},
			"crop": {
				"thumb": "200x200"
			}
		},

		"storage": {
			"aws": {
				"key" : "AWS_KEY",
				"secret" : "AWS_SECRET",
				"bucket" : "AWS_BUCKET"
			},
			"dir": {
				"path" : "./public/images/" 
			}
		}
	}
Example config with scopes (only from version 0.1.0):

    {
		"variants": {
			"projects": { //projects is scope
			  "resize": {
				  "mini" : "300x200",
				  "preview": "800x600"
			  },
			  "crop": {
				 "thumb": "200x200"
			  }
			},
			
			"gallery": { //gallery is scope
			   "crop": {
				"thumb": "100x100"
			   }	
			}
		},

		"storage": {
			"aws": {
				"key" : "AWS_KEY",
				"secret" : "AWS_SECRET",
				"bucket" : "AWS_BUCKET"
			},
			"dir": {
				"path" : "./public/images/" 
			}
		}
	}

	
2. **Now you can use Alleup**
  
    ```javascript
    var  Alleup = require('alleup');
    var alleup = new Alleup({storage : "aws", config_file: "path_to_alleup_config.json"})
	
  You can use `storage: 'aws'` for store files on Amazon S3 or `storage: 'dir'` for store files in filesystem

## UPLOAD, URL and DELETE
	
1. **Upload example:**
	
    ```javascript

    app.get('/upload_form', function(req, res) {
      res.writeHead(200, {'content-type': 'text/html'});
        res.end(
          '<form action="/upload" enctype="multipart/form-data" method="post">'+
            '<input type="text" name="title"><br>'+
            '<input type="file" name="upload" multiple="multiple"><br>'+
            '<input type="submit" value="Upload">'+
          '</form>'
        );

    });
    
    app.post('/upload',  function(req, res) {
	 // Without Scopes
      alleup.upload(req, res, function(err, file, res){

          console.log("FILE UPLOADED: " + file);
          // THIS YOU CAN SAVE FILE TO DATABASE FOR EXAMPLE
          res.end();
      });

     //With Scope `projects` (look at example of configuration file)
     alleup.upload(req, res, function(err, file, res){

         console.log("FILE UPLOADED: " + file);
         // THIS YOU CAN SAVE FILE TO DATABASE FOR EXAMPLE
         res.end();
     }, 'projects');
     
    });

2. **Remove uploaded file example:**

    ```javascript
    // Without Scopes
    app.get('/delete',  function(req, res) {
      alleup.remove('1322506647.jpg', function(err) {

          // THIS YOU CAN DELETE FILE FROM DATABASE FOR EXAMPLE
          res.end();
      });

    // With Scope `projects` (look at example of configuration file)
    app.get('/delete',  function(req, res) {
      alleup.remove('1322506647.jpg', function(err) {

          // THIS YOU CAN DELETE FILE FROM DATABASE FOR EXAMPLE
          res.end();
      }, 'projects'); 
    });

3. **Get file url example:**

    ```javascript
    alleup.url(file, variant);

`file` - The name of the file you uploaded, saved for example in database (`345621345.jpg`), `variant` - one of your image variants names from alleup_congig.json
	
### Contribution
**Pull requests are welcome!!!**

### License
(The MIT License)

Copyright (c) 2011 Andriy Bazyuta &lt;andriy.bazyuta@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---
### Author
Andriy Bazyuta