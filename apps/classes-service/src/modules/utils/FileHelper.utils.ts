import { FileType } from "@prisma/classes-client"
export class FileHelper{
    private static readonly documentFileExtension = ['pdf', 'csv', 'xlxs', 'doc', 'docx', 'xls']
    static getFileTypeFromMime(mimetype: string, path: string){
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
}