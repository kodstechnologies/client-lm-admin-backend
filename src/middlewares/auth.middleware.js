import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log("🚨 Received Token:", token);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Expecting decoded to have at least id and name
        const { id, name, mobileNumber ,_id} = decoded;
        // console.log("🚀 ~ authMiddleware ~ id:", id)
        // console.log("🚀 ~ authMiddleware ~ mobileNumber:", mobileNumber)
        // console.log("🚀 ~ authMiddleware ~ name:", name)

        req.user = {
             id: id || _id||null, 
            name: name || mobileNumber || 'system', // fallback if name not available
            mobileNumber
        };

        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
