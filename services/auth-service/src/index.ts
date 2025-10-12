import express, { Application, Request, Response } from 'express';


const app: Application = express();
const PORT = process.env.PORT || 4000;

app.get("/",(req:Request,res:Response) => {
    return res.json({
        message: "Auth Service"
    })
})

//health check
app.get("/health",(req:Request,res:Response) => {
    return res.json({
        status: "Auth Service is healthy"
    })
})

app.listen(PORT,() => {
    console.log(`Auth Service is running on port ${PORT}`);
})
