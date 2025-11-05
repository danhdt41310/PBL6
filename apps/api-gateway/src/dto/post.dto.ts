import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class PostsDTO{

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @IsNotEmpty()
    class_id:number;

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    parent_id?:number;

    @IsString()
    message?: string;

    @IsString()
    title?: string;

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @IsNotEmpty()
    sender_id:number;  
}