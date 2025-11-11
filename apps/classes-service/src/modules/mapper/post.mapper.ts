import {Post} from "@prisma/classes-client";
import { AddPostResponseDto, PostResponseDto } from "../dto/post-response.dto";
export class PostMapper{
    static toPostRespnseDto(post: Post) : PostResponseDto{
        return {
            id : post.id,
            class_id:post.class_id,
            parent_id: post.parent_id,
            title: post.title||'',
            message: post.message||'',
            sender_id: post.sender_id,
            created_at: post.created_at,
            materials: null,
        }
    }

    static toAddPostRespnseDto(message:string, post: Post) : AddPostResponseDto{
        return {
            message,
            data: this.toPostRespnseDto(post)
        }
    }
}