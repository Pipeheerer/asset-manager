'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DbTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDbConnection = async () => {
    setLoading(true)
    setResult('Testing database connection...')
    
    try {
      // Test if users table exists
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1)
      
      if (error) {
        setResult(`❌ Database Error: ${error.message}\n\nThis means the database tables haven't been created yet.\n\nPlease run the migration in Supabase SQL Editor.`)
      } else {
        setResult(`✅ Database connection successful!\n\nUsers table exists and is accessible.`)
      }
    } catch (error: any) {
      setResult(`❌ Connection Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
        
        <button
          onClick={testDbConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
            {result || 'Click the button to test database connection'}
          </pre>
        </div>
        
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">If database test fails:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to SQL Editor</li>
            <li>Copy the entire contents of <code className="bg-gray-200 px-1">supabase/migrations/001_initial_schema.sql</code></li>
            <li>Paste and click "Run" to create all tables</li>
            <li>Try this test again</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
