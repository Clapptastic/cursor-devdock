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
        <DocumentationViewer docId={typeof id === 'string' ? id : undefined} />
      </div>
    </div>
  );
} 