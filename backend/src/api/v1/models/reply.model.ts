import mongoose from "mongoose";

export interface IReply extends mongoose.Document {
    user: Object,
    likes?: object[],
    content: string
}

const replySchema: mongoose.Schema<IReply> = new mongoose.Schema({
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