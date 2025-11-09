import { Transform } from "class-transformer"
import { IsInt, IsOptional, IsString } from "class-validator"

export class PostCreateDto{
    @Transform(({value})=>parseInt(value))
    @IsInt()
    uploader_id: number

    @IsString()
    @IsOptional()
    title: string

    @IsString()
    @IsOptional()
    message: string
}

export class PostWithFilesDto{
    uploader_id: number
    class_id: number
    uploadFiles: FileInfo[]
    title: string
    message: string
}

class FileInfo{
    originalname: string
    mimetype: string
    buffer: string
    size: number
}

export class FilesOnlyDto{
    uploader_id: number
    class_id: number
    uploadFiles: FileInfo[]
}