import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
    name: string,
    email: string,
    password?: string,
    role?: string,
    picture?: string,
    bio?: string
}

const userSchema: mongoose.Schema<IUser> = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
    },
    role : {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default: 'user'
    },
    picture : {
        type: String,
    },
    bio : {
        type: String,
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);