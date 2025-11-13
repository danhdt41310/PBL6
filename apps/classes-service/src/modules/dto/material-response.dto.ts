import { Prisma } from "@prisma/classes-client";

export enum FileType {
    document = 'document',
    image = 'image',
    video = 'video',
    audio = 'audio',
    other = 'other'
}


export class MaterialResponseDts{
    material_id: number;
    post_id:number;     
    title :string;
    file_url: string;
    uploaded_by: number; 
    uploaded_at: Date;
    type: FileType;
    file_size: number;
}

export class MaterialCreateDto{
    post_id:number | null;     
    title :string;
    file_url: string;
    uploaded_by: number; 
    type: FileType;
    file_size: number;
}

export class PostWithFilesMessageDto{
    uploader_id: number
    class_id: number
    uploadFiles: FileInfo[]
    title: string
    message: string
}

export class FilesOnlyMessageDto{
    uploader_id: number
    class_id: number
    uploadFiles: FileInfo[]
}

export class FileInfo{
    originalname: string
    mimetype: string
    buffer: string
    size: number
}

export class UploadFilesOnlyResponseDto{
    message: string
    data: FilesOnlyResponseDto
}
class FilesOnlyResponseDto{
    class_id
    materials: Prisma.MaterialCreateManyInput[]
}

export class UploadPostWithFilesResponseDto{
    message: string
    data: PostWithFilesResponseDto
}

class PostWithFilesResponseDto{
    class_id:number
    title: string
    message: string
    materials: Prisma.MaterialCreateManyInput[]
}

