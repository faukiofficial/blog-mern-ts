import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
    _id: string,
    name: string,
    email: string,
    password?: string,
    role?: string,
    picture?: {
        public_id: string,
        url: string
    },
    bio?: string
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: mongoose.Schema<IUser> = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        select: false
    },
    role : {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default: 'user'
    },
    picture : {
        public_id: String,
        url: String
    },
    bio : {
        type: String,
    }
}, {
    timestamps: true
});

userSchema.pre<IUser>('save', async function(next) {
    if(!this.isModified('password')) {
       return next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password as string, salt);
    this.password = hashedPassword;
    next();
})

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password as string);
}

export default mongoose.model('User', userSchema);