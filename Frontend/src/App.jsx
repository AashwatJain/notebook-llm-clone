import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadArea from './components/UploadArea';
import ChatBox from './components/ChatBox';

function App() {
  const [selectedDocument, setSelectedDocument] = useState(null);

  return (
    <div className="app-container">
      <Sidebar 
        selectedDocument={selectedDocument}
        onSelectDocument={setSelectedDocument} 
      />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {selectedDocument ? (
          <ChatBox document={selectedDocument} />
        ) : (
          <UploadArea onUploadComplete={setSelectedDocument} />
        )}
      </main>
    </div>
  );
}

export default App;
