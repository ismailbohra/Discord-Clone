import { currentProfile } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/type";
import { NextApiRequest } from "next";


export default async function handler(
    req:NextApiRequest,
    res:NextApiResponseServerIo,
){
    if(req.method!== "POST"){
        return res.status(405).json({error:"Method not allowed"});
    }

    try{
        const profile=await currentProfile(req);
        const {content,fileUrl}=req.body;
        const {serverId,channelId}=req.query;

        if(!profile){
            return res.status(401).json({error:"Unauthorized"});
        }

        if(!serverId){
            return res.status(401).json({error:"Server Id missing"});
        }

        if(!channelId){
            return res.status(401).json({error:"Channel Id missing"});
        }

        if(!content){
            return res.status(401).json({error:"Content missing"});
        }

        const server=await db.server.findFirst({
            where:{
                id:serverId as string,
                members:{
                    some:{
                        profileId:profile.id,
                    },
                },
            },
            include:{
                members:true,
            }
        })

        if(!server){
            return res.status(404).json({error:"Server not found"});
        }

        const channel=await db.channel.findFirst({
            where:{
                id:channelId as string,
                serverId:serverId as string,
            },
        });

        if(!channel){
            return res.status(404).json({error:"Channel not found"});
        }
        const member=server.members.find((member)=>member.profileId===profile.id);

        if(!member){
            return res.status(401).json({error:"Not a member of the server"});
        }

        const message=await db.message.create({
            data:{
                content,
                fileUrl,
                memberId:member.id,
                channelId:channelId as string,
            },
            include:{
                member:{
                    include:{
                        profile:true,
                    },
                },
            }
        });

        const channelKey=`chat:${channelId}:messages`

        res?.socket?.server?.io?.emit(channelKey,message);

        return res.status(200).json(message);

    }catch(error){
        console.log("[MESSAGES_POST]",error);
        return res.status(500).json({message:"Internal error"});
    }
}