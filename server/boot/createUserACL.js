module.exports = function(app) {
    var ACL = app.models.ACL;
    ACL.create({
        model: 'User',
        accessType: 'EXECUTE',
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        property: 'create'
    });
    ACL.create({
        model: 'User',
        accessType: 'READ',
        principalType: 'ROLE',
        principalId: '$everyone',
        permission: 'ALLOW',
        property: 'confirm'
    });
}
