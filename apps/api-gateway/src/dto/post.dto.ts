import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PostsDTO{

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @IsNotEmpty()
    class_id:number;

    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @IsOptional()
    @IsInt()
    parent_id?:number;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @IsNotEmpty()
    sender_id:number;  
}