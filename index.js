import express, { json } from 'express'
import mongoose from "mongoose";
import AdminRoutes from './src/routes/adminroutes.js'
const app = express();
const router = express.Router();
import dotenv from 'dotenv'
import cors from 'cors';
import path from 'path';
import connectToDb from './src/database/index.js';
import { seedAdminUsers } from './src/controllers/seedAdmin.js';
import { fileURLToPath } from 'url';
dotenv.config();
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", AdminRoutes);
app.listen(PORT, console.log(`Backend is running on port:${PORT}`));

const startServer = async () => {
    try {
        await connectToDb()
        await seedAdminUsers();
        app.listen(PORT, () => {
            console.log(`server running on ${PORT}`);
        })
    } catch (error) {
        console.log("MONGO db connection failed !!! ", error);
    }
}
startServer();