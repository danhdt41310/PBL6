import { MaterialResponseDts } from "./material-response.dto";

export class PostResponseDto{
    id : number;
    class_id:number;
    parent_id:number;
    message?: string;
    sender_id:number;
    created_at:Date;
    materials: MaterialResponseDts[];
}