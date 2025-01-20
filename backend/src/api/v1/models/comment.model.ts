import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
    blog: object;
    user: object;
    content: string;
    likes?: number;
    replies?: object[];
}

const commentSchema: mongoose.Schema<IComment> = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content : {
        type: String,
        required: true
    },
    likes : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: 0
    }],
    replies : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reply'
        }
    ]
}, {
    timestamps: true
});

export default mongoose.model('Comment', commentSchema);