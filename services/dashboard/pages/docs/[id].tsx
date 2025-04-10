import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DocumentationViewer from '../../components/DocumentationViewer';

export default function DocumentationPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Documentation | Cursor DevDock</title>
        <meta name="description" content="Comprehensive documentation for the Cursor DevDock platform" />
      </Head>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/docs">
            <a className="inline-flex items-center mr-4 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Wiki
            </a>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        </div>
        
        <div className="flex space-x-3">
          <Link href="/docs">
            <a className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </a>
          </Link>
          <Link href="/">
            <a className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Dashboard
            </a>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[75vh]">
        <DocumentationViewer docId={typeof id === 'string' ? id : undefined} />
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Cursor DevDock Documentation | Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Contact Support</a>
          <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
} 