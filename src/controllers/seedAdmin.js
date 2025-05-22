import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUseSchema.model.js';

export const seedAdminUsers = async () => {
    const admins = [
        {
            name: 'Admin One',
            email: 'admin1@example.com',
            phoneNumber: '8050012715',
            password: 'Admin@#6246',
        },
        {
            name: 'Admin Two',
            email: 'admin@littlemoney.co.in',
            phoneNumber: '9886751481',
            password: 'Admin@#6246',
        },
        {
            name: 'Admin Three',
            email: 'gs@littlemoney.co.in',
            phoneNumber: '9900300011',
            password: 'Admin@#6246',
        }
    ];

    // {
    //     name: 'Admin Three',
    //     email: 'admin@littlemoney.co.in',
    //     phoneNumber: '9886751481',
    //     password: 'admin123',
    // },
    // {
    //     name: 'Admin Four',
    //     email: 'gs@littlemoney.co.in',
    //     phoneNumber: '9900300011',
    //     password: 'admin456',
    // },

    for (let admin of admins) {
        const existing = await AdminUser.findOne({ email: admin.email });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            await AdminUser.create({
                ...admin,
                password: hashedPassword,
            });
            console.log(`Seeded admin: ${admin.email}`);
        }
    }
};
