const { client } = require('../client')

const getAllGroups = async (req, res) => {
    try{
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(group => ({
                id: group.id._serialized,
                name: group.name,
                participants: group.participants.length,
                createdAt: group.createdAt,
                description: group.description
            }));
            
        res.json({
            success: true,
            count: groups.length,
            groups: groups
        });
    }catch(e){
        console.error('error getting groups:', e);
        res.status(500).json({
            success: false,
            message: 'internal server error',
            error: e.message
        });
    }
};

const getGroupInfo = async (req, res) => {
    try{
        const { groupId } = req.params;
        const chat = await client.getChatById(groupId);
        
        if(!chat.isGroup){
            return res.status(400).json({
                success: false,
                message: 'this is not a group chat'
            });
        }
        
        res.json({
            success: true,
            group: {
                id: chat.id._serialized,
                name: chat.name,
                description: chat.description || '',
                participants: chat.participants.length,
                owner: chat.owner ? chat.owner._serialized : null,
                createdAt: chat.createdAt
            }
        });
    }catch(e){
        console.error('error getting group info:', e);
        res.status(500).json({
            success: false,
            message: 'internal server error',
            error: e.message
        });
    }
};

module.exports = {
    getAllGroups,
    getGroupInfo
};