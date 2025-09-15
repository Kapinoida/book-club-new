export default function TestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>CSS Debug Test</h1>
        
        <div className="test-bg-red" style={{ padding: '10px', marginBottom: '10px' }}>
          This should have RED background (forced CSS)
        </div>
        
        <div className="bg-blue-500 text-white p-4">
          This should have BLUE background (Tailwind CSS)
        </div>
        
        <div className="bg-green-500 text-white p-4 mt-4">
          This should have GREEN background (Tailwind CSS)  
        </div>
        
        <button className="bg-indigo-600 text-white px-4 py-2 rounded mt-4">
          Tailwind Button
        </button>
        
        <button style={{ backgroundColor: 'purple', color: 'white', padding: '8px 16px', marginTop: '8px', marginLeft: '8px' }}>
          Inline Style Button
        </button>
      </div>
    </div>
  );
}