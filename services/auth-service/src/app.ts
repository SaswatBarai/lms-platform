import express,{Application} from "express"
import morgan from "morgan";
import helmet from "helmet";



const app:Application = express();


//middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));


// Set security HTTP headers
app.use(helmet());

//routes
app.get("/",(req,res)=>{
    res.status(200).json({message:"Auth Service is up and running"});
})


//All routes 











//health check
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})

export default app;