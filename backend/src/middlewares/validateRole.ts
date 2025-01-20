import { NextFunction, Response } from "express";

export const validateRole = (roles: string[]) : any => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        next();
    }
};