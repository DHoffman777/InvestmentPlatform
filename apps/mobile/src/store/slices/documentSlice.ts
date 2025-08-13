import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Document} from '@types/index';

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  isLoading: false,
  error: null,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.unshift(action.payload);
    },
    clearDocuments: (state) => {
      state.documents = [];
    },
  },
});

export const {setDocuments, addDocument, clearDocuments} = documentSlice.actions;
export default documentSlice.reducer;