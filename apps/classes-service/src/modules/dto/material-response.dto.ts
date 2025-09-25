export enum FileType {
    document = 'document',
    image = 'image',
    video = 'video',
    audio = 'audio',
    other = 'other'
}


export class MaterialResponseDts{
    material_id: number;
    post_id:number;     
    title :string;
    file_url: string;
    uploaded_by: number; 
    uploaded_at: Date;
    type: FileType;
    file_size: number;
}
