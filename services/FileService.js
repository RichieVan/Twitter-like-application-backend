import { ApiFolderPath } from "../app.js";
import fs from 'fs';
import path from "path";
import imagesApi from "../config/axios.js";

class FileService {
    async save (catalog, name, extention, content) {
        const dataInfo = content.substring(0, content.indexOf('base64,') + 7);
        if (!dataInfo) return false; //@TODO throw error

        const dataType = dataInfo.split(';')[0].split(':')[1].split('/')[0];
        if (!dataType) return false; //@TODO throw error

        const contentData = content.substring(dataInfo.length);
        const imageBuffer = Buffer.from(contentData, 'base64');
        let result;
        
        fs.writeFile(path.join(ApiFolderPath, catalog, `${name}.${extention}`), imageBuffer, (err) => {
            if (err) {
                console.log(err);
                result = false;
            }
            result = true;
        });
        return result;
    }

    async delete (catalog, name, extention) {
        let result;
        
        fs.unlink(path.join(ApiFolderPath, catalog, `${name}.${extention}`), (err) => {
            if (err) {
                console.log(err);
                result = false;
            }
            result = true;
        });
        return result;
    }

    async uploadImageAndSave (content) {
        const dataInfo = content.substring(0, content.indexOf('base64,') + 7);
        if (!dataInfo) return false; //@TODO throw error

        const dataType = dataInfo.split(';')[0].split(':')[1].split('/')[0];
        if (!dataType) return false; //@TODO throw error

        const contentData = content.substring(dataInfo.length);
        const response = await imagesApi.post('https://api.imgur.com/3/upload', {
            type : "base64",
            image : contentData
        })
        
        return response.data.data.id;
    }

    async deleteImage (hash) {
        await imagesApi.delete(`https://api.imgur.com/3/image/${hash}`)
    }
}

export default new FileService();