import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';

// This would be better with a proper markdown parser library like 'react-markdown'
// For demonstration purposes, we're using a simple approach
const renderMarkdown = (markdown: string) => {
  if (!markdown) return <div>No content available</div>;
  
  // Convert headers
  let html = markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gm, '<h6>$1</h6>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Convert lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/<li>(.*)<\/li>/g, '<ul><li>$1</li></ul>');
  
  // Convert paragraphs (must come last)
  html = html.replace(/^(?!<[h|u|p|l])(.*$)/gm, '<p>$1</p>');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} className="markdown-content" />;
};

interface DocumentationViewerProps {
  docId?: string;
}

interface Document {
  id: string;
  title: string;
  path: string;
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ docId }) => {
  const [documentList, setDocumentList] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(docId || null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch document list
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('/api/docs');
        setDocumentList(response.data);
        
        if (!selectedDoc && response.data.length > 0) {
          setSelectedDoc(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load document list. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Fetch document content when selectedDoc changes
  useEffect(() => {
    if (!selectedDoc) return;

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/docs/${selectedDoc}`);
        setDocumentContent(response.data.content);
        // Update URL without reloading the page
        router.push(`/docs/${selectedDoc}`, undefined, { shallow: true });
      } catch (err) {
        console.error(`Failed to fetch document ${selectedDoc}:`, err);
        setError(`Failed to load document. Please try again later.`);
        setDocumentContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [selectedDoc, router]);

  const handleDocSelect = (docId: string) => {
    setSelectedDoc(docId);
  };

  if (loading && documentList.length === 0) {
    return <div className="p-6">Loading documentation...</div>;
  }

  if (error && documentList.length === 0) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Sidebar with document list */}
      <div className="w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Documentation</h2>
        <ul className="space-y-2">
          {documentList.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => handleDocSelect(doc.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedDoc === doc.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-200'
                }`}
              >
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Document content */}
      <div className="w-full md:w-3/4 p-6 overflow-y-auto">
        {loading ? (
          <div>Loading document content...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="prose max-w-none">
            {renderMarkdown(documentContent)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationViewer; 