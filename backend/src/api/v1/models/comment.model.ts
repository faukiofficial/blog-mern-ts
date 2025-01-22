import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
    blog: string;
    user: object;
    content: string;
    likes?: object[];
    replies?: object[];
}

const commentSchema: mongoose.Schema<IComment> = new mongoose.Schema({
    blog : {
        type: String,
    },
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
        ref: 'User'
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