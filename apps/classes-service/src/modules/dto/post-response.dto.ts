import { MaterialResponseDts } from "./material-response.dto";

export class PostResponseDto{
    id : number;
    class_id:number;
    parent_id:number;
    title?:string;
    message?: string;
    sender_id:number;
    created_at:Date;
    materials: MaterialResponseDts[];
}

export class AddPostResponseDto{
    message: string;
    data: PostResponseDto;
}
