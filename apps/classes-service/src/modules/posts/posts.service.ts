import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostMapper } from '../mapper/post.mapper';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      include: {
        class: true,
        materials: true,
      },
    });
  }

  async addNewPost(classId: number, message:string , senderId: number ,parentId?: number ,title?:string){
    
    const post = await this.prisma.post.create({
      data:{
        class_id: classId,
        sender_id: senderId,
        parent_id: parentId?parentId:null,
        message: message,
        title: title,
      }
    })

    return PostMapper.toAddPostRespnseDto('Add post sucessfully',post);
  }
}
