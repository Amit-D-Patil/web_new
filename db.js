import mongoose from 'mongoose';

let isConnected = false; // global connection state

export const connectDB = async () => {
    if (isConnected) {
        console.log('✅ Using existing MongoDB connection');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // these options enable pooling
            maxPoolSize: 10, // adjust based on your workload
            minPoolSize: 1,
        });

        isConnected = conn.connections[0].readyState === 1;
        console.log('✅ MongoDB connected:', conn.connection.host);
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        throw err;
    }
};