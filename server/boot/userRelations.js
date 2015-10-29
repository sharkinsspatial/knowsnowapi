module.exports = function(app) {
    var User = app.models.User;
    var ACL = app.models.ACL;
    User.hasMany(app.models.Report, { as: 'reports', foreignKey: 'userId' });
    ACL.create({
        accessType: ACL.ALL,
        permission: ACL.ALLOW,
        principalType: ACL.ROLE,
        principalId: '$owner',
        model: 'User',
        property: '__get__reports'
    });
}
