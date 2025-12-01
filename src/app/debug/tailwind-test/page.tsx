export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tailwind CSS Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Card 1</h2>
            <p className="text-gray-600">If you can see this styled properly, Tailwind is working!</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg text-white">
            <h2 className="text-xl font-semibold mb-4">Card 2</h2>
            <p>This card has a gradient background and white text.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-white">
            <h2 className="text-xl font-semibold mb-4">Card 3</h2>
            <p>Dark card with light text.</p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Component Tests</h3>
          
          <div className="space-y-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Blue Button
            </button>
            
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Green Button
            </button>
            
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Red Button
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              If this page looks unstyled (plain HTML), then Tailwind CSS is not working properly.
              Check the console for any CSS-related errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
