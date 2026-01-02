'use client';

import { login } from '@/app/actions';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <form action={login} className="space-y-4">
          <input 
            name="username" 
            type="text" 
            required 
            placeholder="Username" 
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input 
            name="password" 
            type="password" 
            required 
            placeholder="Password" 
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}