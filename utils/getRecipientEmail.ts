import { User } from 'firebase/auth'
import { Conversation } from '../types'

export const getRecipientEmail = (
	conversationUsers: Conversation['users'],
	loggedInUser?: User | null
) => conversationUsers.find(userEmail => userEmail !== loggedInUser?.email)

//tim user email khac voi login user.email

//ham utils dc goi nhieu lan;