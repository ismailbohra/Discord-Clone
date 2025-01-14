import { ChatHeader } from "@/components/chat/chat-header";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface MemberIdPageProps {
    params:{
        memberId: string;
        serverId: string;
    }
}

const MemberIdPage = async({
    params
}:MemberIdPageProps) => {
    const profile =await currentProfile();

    if(!profile){
        return <RedirectToSignIn />
    }

    const currentMember=await db.member.findFirst({
        where:{
            profileId:profile.id,
            serverId:params.serverId
        },
        include:{
            profile:true
        }
    })

    if(!currentMember){
        return redirect("/");
    }

    const conversation=await getOrCreateConversation(currentMember.id,params.memberId);

    if(!conversation){
        return redirect("/server/${params.serverId}");
    }

    const {memberOne,memberTwo}=conversation;

    const otherMember=profile.id===memberOne.profile.id?memberTwo:memberOne;

    return ( 
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
            <ChatHeader
                imageUrl={otherMember.profile.imageUrl}
                name={otherMember.profile.name}
                serverId={params.serverId}
                type="conversation"
            />
        </div>
     );
}
 
export default MemberIdPage;