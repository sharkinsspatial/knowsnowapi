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

    function buildImageMetadata(filePath, file, callback) {
        fs.open(filePath, 'r', function(status, fd) {
            var buffer = new Buffer(65635);
            fs.read(fd, buffer, 0, 65635, 0, function(err, bytesRead, buffer) {
                if (err) return callback(err);

                var parser = exif.create(buffer);
                var result = parser.parse();

                CloudStoreImage.app.models.Report.findById(file.container,
                    function(err, instance) {
                        if (err) return callback(err);

                        var imageMetadata = { "name": file.name }
                        if (result.tags.GPSLongitude) {
                            imageMetadata.latitude = result.tags.GPSLatitude;
                            imageMetadata.longitude = result.tags.GPSLongitude;
                        }
                        instance.imageMetadatas.create(imageMetadata,
                            function(err, result) {
                                if (err) return callback(err);
                                callback(null, result);
                            });
                    });
            });
        });
    }

    function buildResizedImages(filePath, fileRoot, file, resize, callback) {
        var ext = getExtension(file.name);
        var fileNameRoot = file.name.substr(0, file.name.length - ext.length);
        var filePathRoot = fileRoot + '/' + file.container + '/' + fileNameRoot;
        async.eachSeries(resize, function (spec, callback) {
            spec.filePath = filePathRoot + spec.ext;
            spec.fileName = fileNameRoot + spec.ext;

            qt.convert({
                src: filePath,
                dst: spec.filePath,
                width: spec.width
            }, function (err, path) {
                if (err) return callback(err);
                callback();
            });
        },
        function(err) {
            if (err) return callback(err);
            callback();
        });
    }

    function uploadS3(resize, file, callback) {
        var s3obj;
        async.eachSeries(resize, function (spec, callback) {
            fs.readFile(spec.filePath, function (err, buffer) {
                if (err) return callback(err);

                s3obj = new AWS.S3(
                    {
                    params: {
                        Bucket: app.get('cloudStoreImages').s3.bucket,
                        Key: file.container + '/' + spec.fileName,
                        ContentType: app.get('cloudStoreImages').contentType,
                        ACL: 'public-read'
                    }
                });

                s3obj.upload({Body: buffer}).on('httpUploadProgress',
                    function (evt) {}).send(function (err, data) {
                        if (err) return callback(err);

                        spec.aws = data;
                        callback();
                    });
            });
        },
        function(err) {
            if (err) return callback(err);
            callback();
        });
    }

    function deleteImages(resize, filePath, callback) {
        async.eachSeries(resize, function (spec, callback) {
            fs.unlink(spec.filePath, function (err) {
                if (err) return callback(err);
                callback();
            });
        },
        function(err) {
            if (err) return callback(err);
            fs.unlink(filePath, function (err) {
                if (err) return callback(err);
                callback();
            });
        });
    }

    CloudStoreImage.afterRemote('upload', function (ctx, res, next) {
        var file = res.result.files.fileUpload[0];
        var fileRoot = CloudStoreImage.app.datasources.fileStorageDS.settings.root;
        var filePath = fileRoot + '/' + file.container + '/' + file.name;
        var resize = [
            {width: app.get('cloudStoreImages').thumbWidth,
                ext: app.get('cloudStoreImages').thumbExt},
            {width: app.get('cloudStoreImages').displayWidth,
                ext: app.get('cloudStoreImages').displayExt}
        ];

        var locals = {};

        async.parallel([
            function(callback) {
                buildImageMetadata(filePath, file, function(err, result) {
                    if (err) return callback(err);
                    locals = result;
                    callback();
                });
            },
            function(callback) {
                async.series([
                    async.apply(buildResizedImages, filePath, fileRoot, file, resize),
                    async.apply(uploadS3, resize, file),
                    async.apply(deleteImages, resize, filePath)
                ],
                function(err) {
                    if (err) return callback(err);
                    callback();
                });
            }
        ],
        function(err) {
            if (err) return next(err);
            res.imageMetadata = locals;
            next();
        });
    });

    function getExtension(filename) {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i);
    }
}
