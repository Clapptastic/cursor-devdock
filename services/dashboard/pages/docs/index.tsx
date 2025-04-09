import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

export default function DocumentationIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState([
    {
      id: 'platform-basics',
      title: 'Platform Basics',
      description: 'Core concepts and basic usage of Cursor DevDock',
      icon: '📚'
    },
    {
      id: 'services',
      title: 'Service Documentation',
      description: 'Detailed documentation for each service in the platform',
      icon: '🧩'
    },
    {
      id: 'sdk',
      title: 'SDK & Integration',
      description: 'How to integrate Cursor DevDock with your applications',
      icon: '🔌'
    },
    {
      id: 'tutorials',
      title: 'Tutorials & Guides',
      description: 'Step-by-step guides for common tasks',
      icon: '📝'
    },
    {
      id: 'api',
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      icon: '🔧'
    }
  ]);

  useEffect(() => {
    // This effect can be used to fetch categories dynamically if needed
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Knowledge Wiki - Cursor DevDock</title>
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Wiki</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p>Loading knowledge wiki...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Knowledge Wiki - Cursor DevDock</title>
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Wiki</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-red-600 mb-4">{error}</div>
          <p>
            There was an error loading the knowledge wiki. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Knowledge Wiki - Cursor DevDock</title>
      </Head>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Wiki</h1>
        <Link href="/">
          <a className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
            Back to Dashboard
          </a>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Welcome to the Cursor DevDock Knowledge Wiki</h2>
          <p className="text-gray-600">
            This wiki provides comprehensive documentation for both the Cursor DevDock platform
            and any integrated applications. Whether you're looking to understand the basics,
            learn about specific services, integrate with your own application, or find detailed
            API references, you'll find it all here.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
            <h3 className="font-bold">Getting Started</h3>
            <p>
              New to Cursor DevDock? Start with the <Link href="/docs/platform-basics/getting-started"><a className="text-blue-600 underline">Getting Started Guide</a></Link> to 
              learn the basics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="border rounded-lg hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <div className="p-6">
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Link href={`/docs/${category.id}`}>
                  <a className="block w-full text-center py-2 px-4 bg-gray-800 text-white rounded hover:bg-gray-700 transition">
                    Explore
                  </a>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Popular Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/docs/services/nodejs-debugger">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">Node.js Debugger Guide</h3>
                <p className="text-sm text-gray-600">Learn how to use the Node.js Debugger service</p>
              </a>
            </Link>
            <Link href="/docs/sdk/quickstart">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">SDK Quick Start</h3>
                <p className="text-sm text-gray-600">Get up and running with the DevDock SDK</p>
              </a>
            </Link>
            <Link href="/docs/api/rest-endpoints">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">REST API Reference</h3>
                <p className="text-sm text-gray-600">Complete API documentation</p>
              </a>
            </Link>
            <Link href="/docs/tutorials/debugging-workflow">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">Debugging Workflow</h3>
                <p className="text-sm text-gray-600">Efficient debugging with DevDock tools</p>
              </a>
            </Link>
            <Link href="/docs/services/browser-tools">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">Browser Tools</h3>
                <p className="text-sm text-gray-600">Monitor and debug browser behavior</p>
              </a>
            </Link>
            <Link href="/docs/platform-basics/architecture">
              <a className="p-4 border rounded hover:bg-gray-50">
                <h3 className="font-bold">Platform Architecture</h3>
                <p className="text-sm text-gray-600">Under the hood of Cursor DevDock</p>
              </a>
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Recently Updated</h2>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <Link href="/docs/services/nodejs-debugger/advanced">
                <a className="text-blue-600 hover:underline">Advanced Node.js Debugging Techniques</a>
              </Link>
              <span className="text-sm text-gray-500">Updated 2 days ago</span>
            </li>
            <li className="flex justify-between">
              <Link href="/docs/sdk/authentication">
                <a className="text-blue-600 hover:underline">SDK Authentication Methods</a>
              </Link>
              <span className="text-sm text-gray-500">Updated 5 days ago</span>
            </li>
            <li className="flex justify-between">
              <Link href="/docs/services/browser-tools/network-monitoring">
                <a className="text-blue-600 hover:underline">Network Traffic Monitoring Guide</a>
              </Link>
              <span className="text-sm text-gray-500">Updated 1 week ago</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 