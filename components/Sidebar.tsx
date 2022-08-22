import { Tooltip, Avatar, IconButton, Button ,Input, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVerticalIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import styled from "styled-components";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import React, {useState}  from 'react';
import * as EmailValiator from 'email-validator';
import { addDoc, collection, query, where } from "firebase/firestore";
import {useCollection} from 'react-firebase-hooks/firestore'
import { Conversation } from "../types";
import ConversationSelect from "./ConversationSelect";


const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 350px;
  overflow: scroll;
  border-right: 1px solid whitesmoke;
  ::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
`;
const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid whitesmoke;
  height: 80px;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
`;
const StyledSearch = styled.div`
  display: flex;
  padding: 15px;
  align-items: center;
  border-radius: 2px;
`;

const StyledSearchInput = styled(Input)`
  outline: none;
  border: none;
  flex: 1 0;
`;

const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`;

const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const SideBar = () => {
  const [loggedInUser, _loading, _user] = useAuthState(auth)

  const [isOpenNewConversationDialog,  setIsOpenNewConversationDialog] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState('');

  const toggleNewConversationDialog = (isOpen: boolean) => {
    setIsOpenNewConversationDialog(isOpen);
    if(!isOpen) setRecipientEmail('');
  }

  //check if conversation already exists between the currend logger in user and recipient

  const queryGetConversationForCurrentUser = query(collection(db, 'conversation'),
  where("users",'array-contains', loggedInUser?.email));
  const [conversationsSnapshot, __loading, __error] = useCollection(queryGetConversationForCurrentUser);

  const isConversationAlreadyExists = (recipientEmail: string) => 
   conversationsSnapshot?.docs.find(conversation => (conversation.data() as Conversation).users.includes(recipientEmail))
  

  const isInvittingSelf = recipientEmail === loggedInUser?.email;
  const createConversation = async () => {
    if(!recipientEmail) return;

    if(EmailValiator.validate(recipientEmail) && !isInvittingSelf && !isConversationAlreadyExists(recipientEmail)){
      //Add conversation user to db  "conversation" collection;
      //A conversation is between the current logged  user and the user invited
      await addDoc(collection(db,'conversation'), {
        users: [loggedInUser?.email, recipientEmail]
      }) 

      toggleNewConversationDialog(false);
    }
  }
  const logout =async () => {
    try{
      await signOut(auth);
    }catch(err){
      console.log(err);
    }
  }
  return (
    <StyledContainer>
      <StyledHeader>
        <Tooltip title={loggedInUser?.email as string} placement="right">
          <StyledUserAvatar src={loggedInUser?.photoURL ||''}></StyledUserAvatar>
        </Tooltip>
        <div>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVerticalIcon />
          </IconButton>
          <IconButton onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </div>
      </StyledHeader>

      <StyledSearch>
        <SearchIcon />
        <StyledSearchInput placeholder="search in conversation" 
        ></StyledSearchInput>
      </StyledSearch>

      <Dialog
        open={isOpenNewConversationDialog}
        onClose={() => {toggleNewConversationDialog(false)}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          New Conversation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
           Please entere a Google email addresss for the user you with to chat with 
          </DialogContentText>
          <TextField
           autoFocus
           label='Email Address'
           type='email'
           fullWidth
           variant='standard'
           value={recipientEmail}
           onChange={event => {
             setRecipientEmail(event.target.value)
           }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {toggleNewConversationDialog(false)}}>Disagree</Button>
          <Button disabled={!recipientEmail} onClick={createConversation}>Create</Button>
          
        </DialogActions>
      </Dialog>

      <StyledSidebarButton onClick={()=> {toggleNewConversationDialog(true)}}>Start a new conversation</StyledSidebarButton>

      {
        conversationsSnapshot?.docs.map(conversation => 
          <ConversationSelect key={conversation.id} id={conversation.id} 
          conversationUsers={(conversation.data() as Conversation).users}
          />)

      }
    </StyledContainer>
  );
};

export default SideBar;
