import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMeetingDto: CreateMeetingDto) {
    return await this.prisma.meeting.create({
      data: {
        ...createMeetingDto,
        start_time: new Date(createMeetingDto.start_time),
        end_time: new Date(createMeetingDto.end_time),
      },
      include: {
        attendees: true,
      },
    });
  }

  async update(id: number, updateMeetingDto: UpdateMeetingDto) {
    const meeting = await this.findOne(id);
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    const updateData: any = { ...updateMeetingDto };
    if (updateMeetingDto.start_time) {
      updateData.start_time = new Date(updateMeetingDto.start_time);
    }
    if (updateMeetingDto.end_time) {
      updateData.end_time = new Date(updateMeetingDto.end_time);
    }

    return await this.prisma.meeting.update({
      where: { meeting_id: id },
      data: updateData,
      include: {
        attendees: true,
      },
    });
  }

  async findOne(id: number) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meeting_id: id },
      include: {
        attendees: true,
      },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    return meeting;
  }

  async findByClass(classId: number) {
    return await this.prisma.meeting.findMany({
      where: { class_id: classId },
      include: {
        attendees: true,
      },
      orderBy: { start_time: 'asc' },
    });
  }

  async findAll() {
    return await this.prisma.meeting.findMany({
      include: {
        attendees: true,
      },
      orderBy: { start_time: 'asc' },
    });
  }

  async remove(id: number): Promise<void> {
    const meeting = await this.findOne(id);
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    await this.prisma.meeting.delete({
      where: { meeting_id: id },
    });
  }
}
