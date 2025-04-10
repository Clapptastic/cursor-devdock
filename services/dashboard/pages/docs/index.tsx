import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

export default function DocumentationIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([
    {
      id: 'platform-basics',
      title: 'Platform Basics',
      description: 'Core concepts and basic usage of Cursor DevDock',
      icon: '📚',
      color: 'bg-blue-500'
    },
    {
      id: 'services',
      title: 'Service Documentation',
      description: 'Detailed documentation for each service in the platform',
      icon: '🧩',
      color: 'bg-purple-500'
    },
    {
      id: 'sdk',
      title: 'SDK & Integration',
      description: 'How to integrate Cursor DevDock with your applications',
      icon: '🔌',
      color: 'bg-green-500'
    },
    {
      id: 'tutorials',
      title: 'Tutorials & Guides',
      description: 'Step-by-step guides for common tasks',
      icon: '📝',
      color: 'bg-yellow-500'
    },
    {
      id: 'api',
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      icon: '🔧',
      color: 'bg-red-500'
    }
  ]);
  
  const [popularTopics, setPopularTopics] = useState([
    {
      id: 'nodejs-debugger',
      title: 'Node.js Debugger Guide',
      description: 'Learn how to use the Node.js Debugger service',
      category: 'services',
      icon: '🐞'
    },
    {
      id: 'quickstart',
      title: 'SDK Quick Start',
      description: 'Get up and running with the DevDock SDK',
      category: 'sdk',
      icon: '🚀'
    },
    {
      id: 'rest-endpoints',
      title: 'REST API Reference',
      description: 'Complete API documentation',
      category: 'api',
      icon: '📡'
    },
    {
      id: 'debugging-workflow',
      title: 'Debugging Workflow',
      description: 'Efficient debugging with DevDock tools',
      category: 'tutorials',
      icon: '🔍'
    },
    {
      id: 'browser-tools',
      title: 'Browser Tools',
      description: 'Monitor and debug browser behavior',
      category: 'services',
      icon: '🌐'
    },
    {
      id: 'architecture',
      title: 'Platform Architecture',
      description: 'Under the hood of Cursor DevDock',
      category: 'platform-basics',
      icon: '🏗️'
    }
  ]);
  
  const [recentlyUpdated, setRecentlyUpdated] = useState([
    {
      id: 'advanced',
      title: 'Advanced Node.js Debugging Techniques',
      path: '/services/nodejs-debugger/advanced',
      updatedAt: '2 days ago'
    },
    {
      id: 'authentication',
      title: 'SDK Authentication Methods',
      path: '/sdk/authentication',
      updatedAt: '5 days ago'
    },
    {
      id: 'network-monitoring',
      title: 'Network Traffic Monitoring Guide',
      path: '/services/browser-tools/network-monitoring',
      updatedAt: '1 week ago'
    }
  ]);

  useEffect(() => {
    // This effect can be used to fetch categories dynamically if needed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search on CMD+K or CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('wiki-search')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Filter topics by search term
  const filteredTopics = searchTerm
    ? popularTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : popularTopics;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <Head>
          <title>Knowledge Wiki | Cursor DevDock</title>
          <meta name="description" content="Comprehensive documentation for the Cursor DevDock platform" />
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Wiki</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center justify-center h-64">
            <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-gray-600">Loading knowledge wiki...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <Head>
          <title>Knowledge Wiki | Cursor DevDock</title>
          <meta name="description" content="Comprehensive documentation for the Cursor DevDock platform" />
        </Head>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Wiki</h1>
          <Link href="/">
            <a className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
          <p className="text-center">
            There was an error loading the knowledge wiki. Please try again later or contact support.
          </p>
          <div className="mt-4 flex justify-center">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Head>
        <title>Knowledge Wiki | Cursor DevDock</title>
        <meta name="description" content="Comprehensive documentation for the Cursor DevDock platform" />
      </Head>
      
      {/* Header & Search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Wiki</h1>
          <Link href="/">
            <a className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          </Link>
        </div>
        
        <div className="relative max-w-2xl mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="wiki-search"
            type="text"
            placeholder="Search the Knowledge Wiki... ⌘K"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search the Knowledge Wiki"
          />
          <div className="absolute right-3 top-3 flex items-center text-sm text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded shadow-sm">⌘K</kbd>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Welcome to the Cursor DevDock Knowledge Wiki</h2>
            <p className="text-blue-100 text-lg mb-6">
              This wiki provides comprehensive documentation for both the Cursor DevDock platform
              and any integrated applications. Whether you're a developer, tester, or project manager,
              you'll find everything you need to be productive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/docs/platform-basics/getting-started">
                <a className="inline-flex items-center justify-center px-5 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Getting Started Guide
                </a>
              </Link>
              <Link href="/docs/tutorials">
                <a className="inline-flex items-center justify-center px-5 py-3 bg-blue-500 bg-opacity-20 text-white font-medium rounded-lg hover:bg-opacity-30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Explore Tutorials
                </a>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Documentation Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Browse by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link href={`/docs/${category.id}`} key={category.id}>
                  <a className="group">
                    <div className="border rounded-xl hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
                      <div className={`p-5 ${category.color} text-white text-center`}>
                        <span className="text-4xl">{category.icon}</span>
                      </div>
                      <div className="p-6 flex-grow">
                        <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                        <p className="text-gray-600 mb-4">{category.description}</p>
                        <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                          Explore
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:ml-2 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Topics */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Popular Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTopics.map((topic) => (
                <Link href={`/docs/${topic.category}/${topic.id}`} key={topic.id}>
                  <a className="p-5 border rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start">
                      <div className="mr-3 text-2xl">{topic.icon}</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{topic.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      </div>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
            
            {filteredTopics.length === 0 && searchTerm && (
              <div className="text-center p-8">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">We couldn't find any topics matching "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* Recently Updated */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Recently Updated</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="divide-y divide-gray-200">
                {recentlyUpdated.map((doc) => (
                  <li key={doc.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <Link href={`/docs${doc.path}`}>
                        <a className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          {doc.title}
                        </a>
                      </Link>
                      <span className="text-sm text-gray-500 mt-1 sm:mt-0">{doc.updatedAt}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <Link href="/docs/recent-updates">
                  <a className="inline-flex items-center text-blue-600 hover:text-blue-800">
                    View all updates
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Feedback Section */}
          <div className="bg-gray-50 rounded-lg p-6 mt-8 text-center">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Can't find what you're looking for?</h2>
            <p className="text-gray-600 mb-4">We're constantly improving our documentation. Let us know if you have any suggestions.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <a href="#" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Submit Feedback
              </a>
              <a href="#" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Request Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 