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
    .replace(/^## (.*$)/gm, '<h2 id="$1">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 id="$1">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 id="$1">$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5 id="$1">$1</h5>')
    .replace(/^###### (.*$)/gm, '<h6 id="$1">$1</h6>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
  
  // Convert tables
  html = html.replace(/^\|(.+)\|$/gm, '<tr><td>$1</td></tr>');
  html = html.replace(/<tr><td>(.+)\|(.+)<\/td><\/tr>/gm, '<tr><td>$1</td><td>$2</td></tr>');
  html = html.replace(/<tr><td>(.+)\|(.+)\|(.+)<\/td><\/tr>/gm, '<tr><td>$1</td><td>$2</td><td>$3</td></tr>');
  html = html.replace(/(<tr><td>---(.+)<\/td><\/tr>)/gm, '');
  
  // Replace this line to fix ES2018 flag issue
  let matches = html.match(/(<tr>.+?<\/tr>){2,}/gm);
  if (matches) {
    for (let match of matches) {
      html = html.replace(match, `<table class="border-collapse table-auto w-full text-sm"><tbody>${match}</tbody></table>`);
    }
  }
  
  // Convert code blocks with syntax highlighting
  html = html.replace(/```(\w+)\n([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded overflow-x-auto"><code class="language-$1">$2</code></pre>');
  html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded overflow-x-auto"><code>$1</code></pre>');
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
  
  // Convert bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Convert unordered lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/<li>(.*)<\/li>(?!\n<li>)/g, '<ul class="list-disc pl-6 mb-4"><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul class="list-disc pl-6 mb-4">/g, '');
  
  // Convert ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  html = html.replace(/<li>(.*)<\/li>(?!\n<li>)/g, '<ol class="list-decimal pl-6 mb-4"><li>$1</li></ol>');
  html = html.replace(/<\/ol>\s*<ol class="list-decimal pl-6 mb-4">/g, '');
  
  // Convert blockquotes
  html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-1 italic">$1</blockquote>');
  
  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-gray-300" />');
  
  // Convert alerts/callouts
  html = html.replace(/^:::info\s*\n([\s\S]*?)\n:::/gm, '<div class="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">$1</div>');
  html = html.replace(/^:::warning\s*\n([\s\S]*?)\n:::/gm, '<div class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">$1</div>');
  html = html.replace(/^:::danger\s*\n([\s\S]*?)\n:::/gm, '<div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">$1</div>');
  html = html.replace(/^:::tip\s*\n([\s\S]*?)\n:::/gm, '<div class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4">$1</div>');
  
  // Convert paragraphs (must come last)
  html = html.replace(/^(?!<[h|u|o|l|p|b|d|t])(.*$)/gm, '<p class="mb-4">$1</p>');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} className="markdown-content prose max-w-none" />;
};

interface DocumentationViewerProps {
  docId?: string;
}

interface Document {
  id: string;
  title: string;
  path: string;
  category?: string;
}

interface TableOfContents {
  [key: string]: {
    title: string;
    items: { id: string; title: string }[];
  };
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ docId }) => {
  const [documentList, setDocumentList] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(docId || null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TableOfContents>({});
  const [activeTOC, setActiveTOC] = useState<string[]>([]);
  const router = useRouter();

  // Fetch document list
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('/api/docs');
        setDocumentList(response.data);
        
        // Organize documents into categories
        const toc: TableOfContents = {};
        response.data.forEach((doc: Document) => {
          const category = doc.category || 'Uncategorized';
          if (!toc[category]) {
            toc[category] = { title: category, items: [] };
          }
          toc[category].items.push({ id: doc.id, title: doc.title });
        });
        setTableOfContents(toc);
        
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
        setDocumentTitle(response.data.title);
        
        // Extract headings for page ToC
        const headings = response.data.content.match(/^#{2,3} (.*)$/gm) || [];
        setActiveTOC(headings.map((h: string) => h.replace(/^#{2,3} /, '')));
        
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

  // Filter documents based on search term
  const filteredDocuments = searchTerm
    ? documentList.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : documentList;

  if (loading && documentList.length === 0) {
    return <div className="p-6">Loading documentation...</div>;
  }

  if (error && documentList.length === 0) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Sidebar with document list */}
      <div className="w-full md:w-64 lg:w-72 bg-gray-100 p-4 overflow-y-auto border-r border-gray-200">
        <div className="sticky top-0 bg-gray-100 pb-4 mb-4 border-b border-gray-200 z-10">
          <Link href="/docs">
            <a className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Knowledge Wiki
            </a>
          </Link>
          <div className="relative">
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {searchTerm ? (
          <div>
            <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">Search Results</h3>
            <ul className="space-y-1">
              {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => (
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
              )) : (
                <li className="text-sm text-gray-500 px-3 py-2">No results found</li>
              )}
            </ul>
          </div>
        ) : (
          <div>
            {Object.entries(tableOfContents).map(([category, data]) => (
              <div key={category} className="mb-4">
                <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">{data.title}</h3>
                <ul className="space-y-1">
                  {data.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleDocSelect(item.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedDoc === item.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document content */}
      <div className="w-full flex-1 overflow-auto">
        <div className="flex">
          {/* Main content area */}
          <div className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div>Loading document content...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div>
                <div className="mb-8 pb-4 border-b border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900">{documentTitle}</h1>
                  
                  <div className="flex mt-4 text-sm">
                    <button className="mr-4 text-gray-500 hover:text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit this page
                    </button>
                    <button className="mr-4 text-gray-500 hover:text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                    <a href="#" onClick={(e) => { e.preventDefault(); window.print(); }} className="text-gray-500 hover:text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </a>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  {renderMarkdown(documentContent)}
                </div>
                
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <div className="flex justify-between">
                    <Link href={`/docs/${getPreviousDocId()}`}>
                      <a className={`inline-flex items-center text-sm ${getPreviousDocId() ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </a>
                    </Link>
                    <Link href={`/docs/${getNextDocId()}`}>
                      <a className={`inline-flex items-center text-sm ${getNextDocId() ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}>
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </Link>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Found an issue with this page?</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Submit a fix</a>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Report a problem</a>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* On-page table of contents for larger screens */}
          <div className="hidden lg:block w-64 p-8 border-l border-gray-200 overflow-y-auto">
            <div className="sticky top-0">
              <h4 className="text-xs uppercase font-semibold text-gray-500 mb-4">On this page</h4>
              {activeTOC.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {activeTOC.map((heading, index) => (
                    <li key={index}>
                      <a 
                        href={`#${heading}`} 
                        className="text-gray-600 hover:text-gray-900 hover:underline"
                      >
                        {heading}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No headings available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper functions for navigation
  function getPreviousDocId() {
    if (!selectedDoc) return null;
    const currentIndex = documentList.findIndex(doc => doc.id === selectedDoc);
    return currentIndex > 0 ? documentList[currentIndex - 1].id : null;
  }
  
  function getNextDocId() {
    if (!selectedDoc) return null;
    const currentIndex = documentList.findIndex(doc => doc.id === selectedDoc);
    return currentIndex < documentList.length - 1 ? documentList[currentIndex + 1].id : null;
  }
};

export default DocumentationViewer; 