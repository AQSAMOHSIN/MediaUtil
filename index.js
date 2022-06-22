
let isConfigUpdated = false
const uploadOnS3 = async (stream, credentials, cb) => {
    if (!window.AWS) {
        return;
    }
    if (!isConfigUpdated) {
        window.AWS.config.update({ region: credentials.Region });
        isConfigUpdated = true;
    }
    let s3 = new window.AWS.S3({
        credentials: new window.AWS.Credentials({
            accessKeyId: credentials.AccessKeyId,
            secretAccessKey: credentials.SecretAccessKey,
            sessionToken: credentials.SessionToken,
            signatureVersion: "v4",
            region: credentials.Region
        })
    });

    let uploadedItem = await s3
        .upload({
            Bucket: credentials.Bucket,
            Key: credentials.Path,
            ACL: "public-read",
            Body: stream
        })
        .on("httpUploadProgress", function (progress) {
            cb(getUploadedProgress(progress.loaded, progress.total));
        })
        .promise();
    return uploadedItem;
};

export const handleMediaUpload = async (file, Post, isPublic = false) => {
    try {

        const initializeMediaUtiOlbj = {
            url: isPublic ? "/media/upload/public/init" : "/media/upload/init",
            body: {
                Name: file.name,
                MimeType: file.type,
                Size: file.size
            },

        }
        return Post(initializeMediaUtiOlbj).then(async (res) => {
            let credentials = res;
            await uploadOnS3(file, credentials);
            return await Post({
                url: isPublic ? "/media/upload/public/finalize" : "/media/upload/finalize",
                body: {
                    Id: credentials.MediaId
                },
            });
        });
    }
    catch (err) {
    }
};
