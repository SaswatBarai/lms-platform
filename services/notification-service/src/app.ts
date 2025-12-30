import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { register } from "./config/metrics.js";


const app:Application = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));
app.use(helmet());
app.use(cors());

app.get("/health",(req,res)=>{
    res.status(200).json({message:"Notification service is running"});
});

// Add metrics endpoint
app.get("/metrics", async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
  



export default app;



