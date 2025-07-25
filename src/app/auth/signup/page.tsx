'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSuccess = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm onSuccess={handleSuccess} redirectTo={callbackUrl} />
    </div>
  );
}