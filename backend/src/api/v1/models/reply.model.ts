import mongoose from "mongoose";

export interface IReply extends mongoose.Document {
    comment: object,
    user: Object,
    likes?: string[],
    content: string
}

const replySchema: mongoose.Schema<IReply> = new mongoose.Schema({
    comment : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: true
    },
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    content : {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Reply', replySchema);