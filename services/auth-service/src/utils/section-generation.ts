// import { prisma } from "@lib/prisma.js"




// export const generateSection = async (
//     batchId:string,
//     departmentId:string,
// ):Promise<string> => {
//     const batch = await prisma.batch.findUnique({
//         where:{
//             id:batchId
//         },
//         include:{
//             course:true
//         }
//     })

//     if(!batch){
//         throw new Error("Batch not found")
//     }
//     const department = await prisma.department.findUnique({
//         where:{
//             id:departmentId
//         }
//     })
//     if(!department){
//         throw new Error("Department not found")
//     }

//     const batchYear 
// }