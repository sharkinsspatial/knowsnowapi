module.exports = function(Report) {
    Report.beforeRemote('create', function(ctx, modelInstance, next) {
        ctx.args.data.userId = ctx.req.accessToken.userId;
        next();
    });

    Report.afterRemote('create', function(ctx, modelInstance, next) {
        var id = modelInstance.id.toString();
        Report.app.models.CloudStoreImage.createContainer({ name: id },
                                                   function(err, result) {
                                                       next();
                                                   });
    });
};
