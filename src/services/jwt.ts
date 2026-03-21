import jwt from "jsonwebtoken";
import type { User } from "../lib/generated/prisma/client.js";
import type { JWTUser } from "../interfaces.js";

class JWTService {
    public static generateTokenForUser(user: User) {
        const payload: JWTUser = {
            id: user?.id,
            email: user?.email
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET!);
        return token;
    }

    public static decodeToken(token: string) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTUser;
            return decoded;
        } catch (error) {
            return null;
        }
    }
}

export default JWTService;