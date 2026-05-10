import fs from 'fs';

function localFileRemove(localFilePath) {
    if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath)
    }
}

export { localFileRemove }