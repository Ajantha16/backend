const Friends = require('../models/friend/Friends')
const User = require('../models/User')
const { ObjectId } = require('mongodb')

const addFriend = async (req, res) => {
    try {
        const user_id = new ObjectId(req.user.user_id)
        const friend_id = new ObjectId(req.params.id)
        const friend = await Friends.findOne({ user: user_id, 'friends.friend_id': friend_id }) 
        if(friend) {
            if (friend.friends[0].status === 'pending') {
                return res.json({ success: false, message: 'Friend request sent already' })
            }
            if (friend.friends[0].status === 'accepted') {
                return res.json({ success: false, message: 'Already friends' })
            }
        }
        const data = {
            _id: new ObjectId(),
            friend_id:friend_id,
            status: 'pending'
        }
        // Adding friend to user's friends
        const addFriend = await Friends.updateOne(
            { user: user_id },
            { $push: { friends: data } }
        )
        if (!addFriend.acknowledged) {
            return res.json({ success: false, message: 'Error adding friend.' })
        }
        // Adding user to friend's friends
        const data2 = {
            _id: new ObjectId(),
            friend_id: user_id,
            status: 'pending'
        }
        const friend_user = await Friends.updateOne(
            { user: friend_id },
            { $push: { friends: data2 } }
        )
        if (!friend_user.acknowledged) {
            return res.json({ success: false, message: 'Error adding friend.' })
        }

        res.json({ success: true, message: 'Friend Request Sent Successfully.' })

    } catch (error) {
        console.log(error.message)
        res.json({
            success: false,
            message: 'Some internal server error occured.',
        })
    }
}

const acceptRequest = async(req, res)=>{
    try {
        const user_id = new ObjectId(req.user.user_id)
        const friend_id = new ObjectId(req.params.id)
        const friend = await Friends.findOne({ user: user_id, 'friends.friend_id': friend_id })
        if(!friend) {
            return res.json({ success: false, message: 'No friend request found.' })
        }
        if(friend){
            if(friend.friends[0].status === 'accepted'){
                return res.json({ success: false, message: 'Already friends' })
            }
        }
        // Adding friend to user's friends - Accepting friend request
        const addFriend = await Friends.updateOne(
            { user: user_id, 'friends.friend_id': friend_id },
            { $set: { 'friends.$.status':'accepted'  } }
        )
        if (!addFriend.acknowledged) {
            return res.json({ success: false, message: 'Error adding friend.' })
        }
        // Adding user to friend's friends - Accepting friend request
        const friend_user = await Friends.updateOne(
            { user: friend_id, 'friends.friend_id': user_id },
            { $set: { 'friends.$.status':'accepted'  } }
        )
        if (!friend_user.acknowledged) {
            return res.json({ success: false, message: 'Error adding friend.' })
        }
        res.json({ success: true, message: 'Friend Request Accepted Successfully.' })
    } catch (error) {
        console.log(error.message)
        res.json({
            success: false,
            message: 'Some internal server error occured.',
        })
    }
}

const deleteFriend = async(req, res)=>{
    try {
        const user_id = new ObjectId(req.user.user_id)
        const friend_id = new ObjectId(req.params.id)
        const friend = await Friends.findOne({ user: user_id, 'friends.friend_id': friend_id })
        if(!friend) {
            return res.json({ success: false, message: 'No friend request found.' })
        }
        const deleteFriend = await Friends.updateOne(
            { user: user_id, 'friends.friend_id': friend_id },
            { $pull: { friends: { friend_id: friend_id } } }
        )
        if (!deleteFriend.acknowledged) {
            return res.json({ success: false, message: 'Error deleting friend.' })
        }
        const deleteFriend2 = await Friends.updateOne(
            { user: friend_id, 'friends.friend_id': user_id },
            { $pull: { friends: { friend_id: user_id } } }
        )
        if (!deleteFriend2.acknowledged) {
            return res.json({ success: false, message: 'Error deleting friend.' })
        }
        res.json({ success: true, message: 'Friend Deleted Successfully.' })
    } catch (error) {
        console.log(error.message)
        res.json({
            success: false,
            message: 'Some internal server error occured.',
        })
    }
}

module.exports = { addFriend, acceptRequest, deleteFriend }
