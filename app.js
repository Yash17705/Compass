import express from "express"
import mongoose from "mongoose"
const app=express();
const MONGO_URL="mongodb://127.0.0.1:27017/compass"
async function main() {
        await mongoose.connect(MONGO_URL)
}
main().then(()=>{
    console.log("cinnected to db")
}).catch(err=>{
    console.log(err);
});


app.listen(8080,()=>{
    console.log("server listening at 8080");
});
app.get((req,res)=>{
    res.send("i am route");
});

