import { Prisma } from "@prisma/classes-client";
import { UploadFilesOnlyResponseDto, UploadPostWithFilesResponseDto } from "../dto/material-response.dto";

export class MaterialMapper{
    static toUploadPostWithFilesDto(message: string, class_id:number, data_saved: Prisma.MaterialCreateManyInput[], title:string, post_message:string):UploadPostWithFilesResponseDto{
        return {
            message,
            data:{
                class_id,
                message:post_message,
                title,
                materials:data_saved   
            }
        }
    }

    static toUploadFilesOnlyDto(message: string, class_id:number, data_saved: Prisma.MaterialCreateManyInput[]):UploadFilesOnlyResponseDto{
        return{
            message,
            data:{
                class_id,
                materials:data_saved
            }
        }
    }
}