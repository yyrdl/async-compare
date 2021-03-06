var bluebird = require('bluebird');
require('../lib/fakesP')(bluebird.promisify);

var the_upload = function upload(stream, idOrPath, tag, done) {
    bluebird.spawn(function* () {
        try {
            var blob = blobManager.create(account);
            var tx = db.begin();
            var blobId = yield blob.put(stream);
            var file = yield self.byUuidOrPath(idOrPath).get();

            var previousId = file ? file.version : null;
            version = {
                userAccountId: userAccount.id,
                date: new Date(),
                blobId: blobId,
                creatorId: userAccount.id,
                previousId: previousId,
            };
            version.id = Version.createHash(version);
            yield Version.insert(version).execWithin(tx);
            if (!file) {
                var splitPath = idOrPath.split('/');
                var fileName = splitPath[splitPath.length - 1];
                file = {
                    id: uuid.v1(),
                    userAccountId: userAccount.id,
                    name: fileName,
                    version: version.id
                }
                var query = yield self.createQuery(idOrPath, file);
                yield query.execWithin(tx);
            }
            yield FileVersion.insert({fileId: file.id, versionId: version.id})
                .execWithin(tx);
            yield File.whereUpdate({id: file.id}, {version: version.id})
                .execWithin(tx);
            tx.commit();
        } catch (err) {
            tx.rollback();
            throw err;
        }
    }).done(done, done);
}

module.exports=the_upload;

 