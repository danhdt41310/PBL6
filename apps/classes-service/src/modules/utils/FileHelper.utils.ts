import { promises as fs } from 'fs'
import { join } from "path"
import { FileInfo, FileType } from "../dto/material-response.dto"
import { Prisma } from '@prisma/classes-client'

export class FileHelper{
    private static UPLOAD_DIR = process.env.UPLOAD_DIR
    private static readonly documentFileExtension = ['pdf', 'csv', 'xlxs', 'doc', 'docx', 'xls']

    static getFileTypeFromMime(mimetype: string, path: string): FileType{
        const ftype_general = mimetype.substring(0, mimetype.indexOf('/'))
        const fextension = path.substring(path.lastIndexOf('.')+1)
        if (ftype_general==='image'){
            return FileType.image
        }
        else if (ftype_general==='video'){
            return FileType.video
        }
        else if (ftype_general==='audio'){
            return FileType.audio
        }
        else if (this.documentFileExtension.includes(fextension)){
            return FileType.document
        }
        else return FileType.other
    }

    static async saveUploadFiles(uploadFiles: FileInfo[], class_id: number, uploader_id: number, post_id: number=null):Promise<Prisma.MaterialCreateManyInput[]>{
    
        
        const material_infos:Prisma.MaterialCreateManyInput[] =[]
        for (let uploadFile of uploadFiles){
            try{
                const uploadDir = join(this.UPLOAD_DIR, class_id.toString() , uploader_id.toString());
                await fs.mkdir(uploadDir, {recursive:true})
                const filePath = join(uploadDir, uploadFile.originalname);
                const buffer = Buffer.from(uploadFile.buffer, 'base64');
                await fs.writeFile(filePath, buffer);

                material_infos.push({
                    file_url: filePath,
                    title: uploadFile.originalname,
                    file_size: uploadFile.size,
                    type: FileHelper.getFileTypeFromMime(uploadFile.mimetype, uploadFile.originalname),
                    uploaded_by: uploader_id,
                    post_id,
                })
            }
            catch (error){
                console.log('Failed to save file',uploadFile.originalname)
                console.log('Error',error)
            }
        }
        return material_infos
    }
}