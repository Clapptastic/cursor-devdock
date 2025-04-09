import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import DocumentationViewer from '../../components/DocumentationViewer';

export default function DocumentationIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFirstDocument = async () => {
      try {
        const response = await axios.get('/api/docs');
        if (response.data && response.data.length > 0) {
          // Redirect to the first document
          router.push(`/docs/${response.data[0].id}`);
        } else {
          setError('No documentation files available.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load documentation. Please try again later.');
        setLoading(false);
      }
    };

    fetchFirstDocument();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Documentation - Cursor DevDock</title>
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p>Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Documentation - Cursor DevDock</title>
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-red-600 mb-4">{error}</div>
          <p>
            Please ensure that the documentation directory exists and contains markdown files.
          </p>
        </div>
      </div>
    );
  }

  // This should not normally be displayed as we redirect
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Documentation - Cursor DevDock</title>
      </Head>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
        <Link href="/">
          <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Back to Dashboard
          </a>
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden min-h-[70vh]">
        <DocumentationViewer />
      </div>
    </div>
  );
} 