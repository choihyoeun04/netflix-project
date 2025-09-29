import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  category: string;
  duration: number;
  fileId: mongoose.Types.ObjectId;
  thumbnailId?: mongoose.Types.ObjectId;
  uploadDate: Date;
  views: number;
  tags: string[];
  metadata: {
    resolution: string;
    fileSize: number;
    format: string;
    codec: string;
  };
  isActive: boolean;
}

const VideoSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, default: 0 },
  fileId: { type: Schema.Types.ObjectId, required: true },
  thumbnailId: { type: Schema.Types.ObjectId },
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  tags: [{ type: String }],
  metadata: {
    resolution: { type: String, default: '720p' },
    fileSize: { type: Number, default: 0 },
    format: { type: String, default: 'mp4' },
    codec: { type: String, default: 'H.264' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
VideoSchema.index({ category: 1 });
VideoSchema.index({ uploadDate: -1 });
VideoSchema.index({ views: -1 });

export default mongoose.model<IVideo>('Video', VideoSchema);
