import mongoose from "mongoose";

const connectDatabase = async () => {
    try{
        let data = await mongoose.connect(process.env.MONGO_URL)
        console.log(`Mongodb connected with server: ${data.connection.host}`);
    }
    catch (error) {
        console.log(`Errors: ${error}`)
    }
};

export default connectDatabase;
