var exif = require('exif-parser');
module.exports = function (CloudStoreImage) {
    var app;

    var async = require('async');
    var qt = require('quickthumb');
    var fs = require('fs');
    var AWS = require('aws-sdk');

    CloudStoreImage.disableRemoteMethod('download', true);
    CloudStoreImage.disableRemoteMethod('removeFile', true);
    CloudStoreImage.disableRemoteMethod('getFiles', true);
    CloudStoreImage.disableRemoteMethod('getFile', true);

    CloudStoreImage.on('attached', function () {
        app = CloudStoreImage.app;

        AWS.config.update({
            accessKeyId: app.get('cloudStoreImages').s3.accessKeyId,
            secretAccessKey: app.get('cloudStoreImages').s3.secretAccessKey
        });
        AWS.config.region = app.get('cloudStoreImages').s3.region;
    });

    CloudStoreImage.beforeRemote('upload', function (ctx, unused, next) {
        /* Sample getting header
           app.logger.info("I GOT HEADER: " + ctx.req.headers['image-type']);
           if (!ctx.req.headers['image-type']) {
           return next('Header \'image-type\' is required.');
           }
           */

        next();
    });

    CloudStoreImage.afterRemote('upload', function (ctx, res, next) {
        //var header = ctx.req.headers['image-type'];
        var file = res.result.files.fileUpload[0];

        var fileRoot = CloudStoreImage.app.datasources.fileStorageDS.settings.root;

        var ext = getExtension(file.name);
        var fileNameRoot = file.name.substr(0, file.name.length - ext.length);

        var filePath = fileRoot + '/' + file.container + '/' + file.name;
        fs.open(filePath, 'r', function(status, fd) {
            if (status) {
                console.log(status);
                return;
            }
            var buffer = new Buffer(65635);
            fs.read(fd, buffer, 0, 65635, 0, function(err, bytesRead, buffer) {
                var parser = exif.create(buffer);
                var result = parser.parse();
                CloudStoreImage.app.models.Report.findById(file.container, function(err, instance) {
                    if (err) {
                        console.log(err);
                        next();
                    }
                    var imageMetadata = { "name": file.name }
                    if (result.tags.GPSLongitude) {
                        imageMetadata.latitude = result.tags.GPSLatitude;
                        imageMetadata.longitude = result.tags.GPSLongitude;
                    }
                    instance.imageMetadatas.create(imageMetadata,
                        function(err, result) {
                            var test = result;
                        });
                });

            });

        });
        var filePathRoot = fileRoot + '/' + file.container + '/' + fileNameRoot;

        var resize = [
            {width: app.get('cloudStoreImages').thumbWidth, ext: app.get('cloudStoreImages').thumbExt},
            {width: app.get('cloudStoreImages').displayWidth, ext: app.get('cloudStoreImages').displayExt},
        ];

        var s3obj;

        async.eachSeries(resize, function (spec, cb) {
            //if (spec.width === 0) {
                //return cb();
            //}

            spec.filePath = filePathRoot + spec.ext;
            spec.fileName = fileNameRoot + spec.ext;

            qt.convert({
                src: filePath,
                dst: spec.filePath,
                width: spec.width
                }, function (err, path) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
            });
        },
        function (err) {
            if (err) {
                return next(err);
            }

            async.eachSeries(resize, function (spec, cb) {
                fs.readFile(spec.filePath, function (err, buffer) {

                    s3obj = new AWS.S3(
                        {
                        params: {
                            Bucket: app.get('cloudStoreImages').s3.bucket,
                            Key: file.container + '/' + spec.fileName,
                            ContentType: app.get('cloudStoreImages').contentType,
                            ACL: 'public-read'
                        }
                    });

                    s3obj.upload({Body: buffer})
                    .on('httpUploadProgress', function (evt) {
                        //app.logger.debug(evt);
                    }).send(function (err, data) {
                        if (err) {
                            return cb(err);
                        }

                        spec.aws = data;

                        cb();
                    });
                });
            },
            function (err) {
                if (err) {
                    //app.logger.error(err);
                    return next(err);
                }

                // Return the files we've uploaded
                res.result.files.fileUpload[0].path = filePath;
                res.result.files.fileUpload[0].resize = resize;

                //Return success to the client.  No need to wait for the files to be deleted.
                next();

                // Delete the local storage
                async.eachSeries(resize, function (spec, cb) {
                    fs.unlink(spec.filePath, function (err) {
                        if (err) {
                            return cb(err);
                        }

                        cb();
                    })
                },
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        });
    });

    function getExtension(filename) {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i);
    }
}
