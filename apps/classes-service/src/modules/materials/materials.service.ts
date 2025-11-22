import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FileType } from "@prisma/classes-client";

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.material.findMany({
      include: {
        post: true,
      },
    });
  }

  async all(class_id: number) {
    return this.prisma.material.findMany({
      where: {
        post: {
          class_id,
        },
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            message: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        uploaded_at: "desc",
      },
    });
  }

  async findOne(materialId: number) {
    const material = await this.prisma.material.findUnique({
      where: { material_id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${materialId} not found`);
    }

    return material;
  }

  async create(data: {
    classId: number;
    materials: Array<{
      title: string;
      file_url: string;
      file_name: string;
      file_path: string;
      file_size: number;
      mime_type: string;
      uploaded_by: number;
    }>;
    postId?: number;
  }) {
    const { classId, materials, postId } = data;

    // Use existing post or create a new one
    let post;
    if (postId) {
      // Use existing post (for replies)
      post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException(`Post with ID ${postId} not found`);
      }
    } else {
      // Create a new post (for standalone material uploads)
      post = await this.prisma.post.create({
        data: {
          class_id: classId,
          title: `Materials Upload - ${new Date().toLocaleDateString()}`,
          message: `Uploaded ${materials.length} file(s)`,
          sender_id: materials[0].uploaded_by,
        },
      });
    }

    // Determine file type from mime type
    const getFileType = (mimeType: string): FileType => {
      if (mimeType.startsWith("image/")) return FileType.image;
      if (mimeType.startsWith("video/")) return FileType.video;
      if (mimeType.startsWith("audio/")) return FileType.audio;
      if (
        mimeType.includes("pdf") ||
        mimeType.includes("word") ||
        mimeType.includes("document") ||
        mimeType.includes("excel") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("powerpoint") ||
        mimeType.includes("presentation")
      ) {
        return FileType.document;
      }
      return FileType.other;
    };

    // Create materials
    const createdMaterials = await this.prisma.material.createMany({
      data: materials.map((material) => ({
        post_id: post.id,
        title: material.title,
        file_url: material.file_url,
        uploaded_by: material.uploaded_by,
        type: getFileType(material.mime_type),
        file_size: material.file_size,
      })),
    });

    return {
      post,
      materialsCount: createdMaterials.count,
    };
  }

  async delete(materialId: number) {
    // Check if material exists
    await this.findOne(materialId);

    // Delete material
    return this.prisma.material.delete({
      where: { material_id: materialId },
    });
  }
}
